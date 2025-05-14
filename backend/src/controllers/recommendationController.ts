import { Request, Response } from 'express';
import { prisma } from '../models/prismaClient';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import { getUserFromAuthToken } from '../services/firebaseAuth';
import { searchBooks, formatBookData } from '../services/googleBooksService';

dotenv.config();

// inicia a API do Gemini
const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export const getAutomatedRecommendations = async (req: Request, res: Response) => {
  try {
    const user = await getUserFromAuthToken(req);
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // pega as preferências do user
    const userWithPreferences = await prisma.user.findUnique({
      where: { id: user.uid },
      include: {
        likedTropes: true,
        dislikedTropes: true,
        likedCategories: true,
        dislikedCategories: true,
        likedAuthors: true,
        dislikedAuthors: true,
        languages: true, 
      }
    });

    if (!userWithPreferences) {
      return res.status(404).json({ error: 'User not found' });
    }

    // verifica se as recomendações automáticas estão ativadas 
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId: user.uid },
    });

    if (!userSettings?.automatedRecommendationsEnabled) {
      return res.status(200).json([]);
    }

    // pega as avaliações do user
    const userRatings = await prisma.rating.findMany({
      where: { userId: user.uid },
      include: { book: true },
      orderBy: { createdAt: 'desc' },
      take: 20, // pega as 20 mais recentes
    });

    // vê se o user tem preferências
    const hasPreferences = (
      userWithPreferences.likedTropes.length > 0 || 
      userWithPreferences.dislikedTropes.length > 0 || 
      userWithPreferences.likedCategories.length > 0 || 
      userWithPreferences.dislikedCategories.length > 0 || 
      userWithPreferences.likedAuthors.length > 0 || 
      userWithPreferences.dislikedAuthors.length > 0
    );
    
    // se o user n avaliou nada e n tem preferências, retorna vazio
    if (userRatings.length === 0 && !hasPreferences) {
      return res.status(200).json([]);
    }

    // Formata o histórico de leitura do user
    const readingHistory = userRatings.map(rating => ({
      title: rating.book.title,
      author: rating.book.author,
      rating: rating.rating,
    }));

    // prompt para AI
    let prompt = "Based on the following user preferences and reading history, recommend 5 books:\n\n";
    
    // add preferência de idiomas
    if (userWithPreferences.languages.length > 0) {
      const languages = userWithPreferences.languages.map(lang => lang.name).join(", ");
      prompt += `The user reads books in the following languages: ${languages}. ONLY recommend books in these languages.\n\n`;
    } else {
      // padrão pt e en 
      prompt += "The user hasn't specified language preferences. Please recommend books in Portuguese or English.\n\n";
    }
    
    // tropes q o user gosta e n gosta
    if (userWithPreferences.likedTropes.length > 0) {
      prompt += "Tropes the user likes: " + userWithPreferences.likedTropes.map(trope => trope.name).join(", ") + "\n";
    }
    
    if (userWithPreferences.dislikedTropes.length > 0) {
      prompt += "Tropes the user dislikes: " + userWithPreferences.dislikedTropes.map(trope => trope.name).join(", ") + "\n";
    }
    
    // categorias q o user gosta e n gosta
    if (userWithPreferences.likedCategories.length > 0) {
      prompt += "Categories the user likes: " + userWithPreferences.likedCategories.map(cat => cat.name).join(", ") + "\n";
    }
    
    if (userWithPreferences.dislikedCategories.length > 0) {
      prompt += "Categories the user dislikes: " + userWithPreferences.dislikedCategories.map(cat => cat.name).join(", ") + "\n";
    }
    
    // autores q o user gosta e n gosta
    if (userWithPreferences.likedAuthors.length > 0) {
      prompt += "Authors the user likes: " + userWithPreferences.likedAuthors.map(author => author.name).join(", ") + "\n";
    }
    
    if (userWithPreferences.dislikedAuthors.length > 0) {
      prompt += "Authors the user dislikes: " + userWithPreferences.dislikedAuthors.map(author => author.name).join(", ") + "\n";
    }
    
    // add historico de leitura
    if (readingHistory.length > 0) {
      prompt += "\nBooks the user has rated:\n";
      readingHistory.forEach(book => {
        prompt += `- "${book.title}" by ${book.author} - Rated ${book.rating}/5\n`;
      });
    }
    
    // instruções para formatação
    prompt += "\nPlease recommend books that match the user's preferences. For each book, provide the title, author, and a brief description. Format your response as a JSON array with objects containing title, author, and description properties.";

    // chama a IA
    const result = await model.generateContent(prompt);
    const response = result.response;
    const textResult = response.text();
    
    try {
      // vê primeiro se o resultado é um JSON válido
      let recommendations;
      try {
        recommendations = JSON.parse(textResult.trim());
      } catch (initialParseError) {
        // se a resposta n for um JSON válido, tenta extrair o JSON do texto
        const jsonMatch = textResult.match(/(\[[\s\S]*?\])/);
        if (!jsonMatch) {
          return res.status(500).json({ error: "Couldn't parse recommendations" });
        }
        
        let jsonString = jsonMatch[0].trim();
        
        // limpa o JSON
        jsonString = jsonString.replace(/\n/g, ' ');
        jsonString = jsonString.replace(/,\s*\]/g, ']'); // remove virgula antes do colchete de fechamento
        
        try {
          recommendations = JSON.parse(jsonString);
        } catch (extractedParseError) {
          return res.status(500).json({ error: "Invalid JSON in recommendations" });
        }
      }
      
      if (!Array.isArray(recommendations)) {
        return res.status(500).json({ error: "Recommendations format is incorrect" });
      }
    
      // tenta achar os livros recomendados no Google Books
      const enhancedRecommendations = await Promise.all(
        recommendations.map(async (rec: any) => {
          try {
            // procura o livro no Google Books
            const searchQuery = `intitle:"${rec.title}" inauthor:"${rec.author}"`;
            const searchResult = await searchBooks(searchQuery, 0, 1);
            
            if (searchResult.items && searchResult.items.length > 0) {
              const bookData = formatBookData(searchResult.items[0]);
              return {
                ...rec,
                googleBookId: bookData.googleBookId,
                coverUrl: bookData.coverUrl,
                description: bookData.description,
              };
            }
            return rec;
          } catch (error) {
            return rec;
          }
        })
      );

      return res.status(200).json(enhancedRecommendations);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to generate recommendations' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate recommendations' });
  }
};

export const getChatRecommendation = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // pega o user
    const user = await getUserFromAuthToken(req);
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // pega as preferências
    const userWithPreferences = await prisma.user.findUnique({
      where: { id: user.uid },
      include: {
        likedTropes: true,
        dislikedTropes: true,
        likedCategories: true,
        dislikedCategories: true,
        likedAuthors: true,
        dislikedAuthors: true,
        languages: true, 
        readingList: true
      }
    });

    if (!userWithPreferences) {
      return res.status(404).json({ error: 'User not found' });
    }

    // pega as avaliações 
    const userRatings = await prisma.rating.findMany({
      where: { userId: user.uid },
      include: { book: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Formata o histórico 
    const readingHistory = userRatings.map(rating => ({
      title: rating.book.title,
      author: rating.book.author,
      rating: rating.rating,
    }));

    // manda as preferências no prompt
    let preferencesText = "USER PREFERENCES:\n";
    
    // manda preferência de idiomas
    if (userWithPreferences.languages.length > 0) {
      const languages = userWithPreferences.languages.map(lang => lang.name).join(", ");
      preferencesText += `Languages: ${languages} (ONLY recommend books in these languages)\n`;
    } else {
      preferencesText += "Languages: Not specified (default to Portuguese or English)\n";
    }
    
    // manda as tropes
    if (userWithPreferences.likedTropes.length > 0) {
      preferencesText += "Tropes the user likes: " + userWithPreferences.likedTropes.map(trope => trope.name).join(", ") + "\n";
    }
    
    if (userWithPreferences.dislikedTropes.length > 0) {
      preferencesText += "Tropes the user dislikes: " + userWithPreferences.dislikedTropes.map(trope => trope.name).join(", ") + "\n";
    }
    
    // manda as categorias
    if (userWithPreferences.likedCategories.length > 0) {
      preferencesText += "Categories the user likes: " + userWithPreferences.likedCategories.map(cat => cat.name).join(", ") + "\n";
    }
    
    if (userWithPreferences.dislikedCategories.length > 0) {
      preferencesText += "Categories the user dislikes: " + userWithPreferences.dislikedCategories.map(cat => cat.name).join(", ") + "\n";
    }
    
    // manda os autores
    if (userWithPreferences.likedAuthors.length > 0) {
      preferencesText += "Authors the user likes: " + userWithPreferences.likedAuthors.map(author => author.name).join(", ") + "\n";
    }
    
    if (userWithPreferences.dislikedAuthors.length > 0) {
      preferencesText += "Authors the user dislikes: " + userWithPreferences.dislikedAuthors.map(author => author.name).join(", ") + "\n";
    }
    
    // manda o histórico 
    if (readingHistory.length > 0) {
      preferencesText += "\nREADING HISTORY (Books the user has rated):\n";
      readingHistory.forEach(book => {
        preferencesText += `- "${book.title}" by ${book.author} - Rated ${book.rating}/5\n`;
      });
    }

    // formata a lista de leitura
    const readingList = userWithPreferences.readingList || [];
    let readingListText = "";
    
    if (readingList.length > 0) {
      readingListText = "\nREADING LIST (to be read):\n";
      readingList.forEach((book, index) => {
        readingListText += `${index + 1}. "${book.title}" by ${book.author}\n`;
      });
    }

    // prompt para o chat gemini 
    const prompt = `As an AI book recommendation assistant, please respond to the following request from a user:

"${message}"

${preferencesText}
${readingListText}

Please make use of the user's preferences when they ask for personalized recommendations.

For each recommendation, include:
1. Title and author
2. Brief description
3. If they're asking specifically about their "to be read" list or which book to read first, explain why they should read it based on their preferences.
   Otherwise, explain why you're recommending it based on their request and preferences.

IMPORTANT: For each book you recommend, include a link format exactly like this example: [Book Title](/books/GOOGLE_BOOK_ID)
If you can't find the exact Google Book ID, just use the book title as an identifier.

Format each recommendation with clear headings and keep your overall response friendly and helpful. And please always try to match the language of the user's request. The default language of the site is portuguese.`;

    // Chama a IA
    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const recommendation = response.text();

      return res.status(200).json({ recommendation });
    } catch (aiError) {
      // Fallback se a IA falhar
      return res.status(200).json({ 
        recommendation: "I'm sorry, I'm having trouble generating recommendations right now. Please try again in a few minutes."
      });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate recommendation' });
  }
};

export const getRecommendationSettings = async (req: Request, res: Response) => {
  try {
    const user = await getUserFromAuthToken(req);
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // pega as preferências do user 
    let userSettings = await prisma.userSettings.findUnique({
      where: { userId: user.uid },
    });

    if (!userSettings) {
      userSettings = await prisma.userSettings.create({
        data: {
          userId: user.uid,
          automatedRecommendationsEnabled: true, // padrão ser ativado 
        }
      });
    }

    return res.status(200).json({
      automatedRecommendationsEnabled: userSettings.automatedRecommendationsEnabled,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get recommendation settings' });
  }
};

export const updateRecommendationSettings = async (req: Request, res: Response) => {
  try {
    const user = await getUserFromAuthToken(req);
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { automatedRecommendationsEnabled } = req.body;
    if (typeof automatedRecommendationsEnabled !== 'boolean') {
      return res.status(400).json({ error: 'automatedRecommendationsEnabled must be a boolean' });
    }

    // updade das preferências do user  
    try {
      const userSettings = await prisma.userSettings.upsert({
        where: { userId: user.uid },
        update: { automatedRecommendationsEnabled },
        create: {
          userId: user.uid,
          automatedRecommendationsEnabled,
        }
      });
      
      return res.status(200).json({
        automatedRecommendationsEnabled: userSettings.automatedRecommendationsEnabled,
      });
    } catch (dbError) {
      return res.status(500).json({ error: 'Database error when updating settings' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update recommendation settings' });
  }
};
