import { Request, Response } from 'express';
import { prisma } from '../models/prismaClient';
import { getUserFromAuthToken } from '../services/firebaseAuth';

// pega as tropes 
export const getAllTropes = async (_req: Request, res: Response) => {
  try {
    const tropes = await prisma.trope.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    return res.status(200).json(tropes);
  } catch (error) {
    return res.status(500).json({ error: 'Error fetching tropes' });
  }
};

// pega as preferências do user (autor, etc)
export const getUserPreferences = async (req: Request, res: Response) => {
  const user = await getUserFromAuthToken(req);

  if (!user) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  try {
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

    return res.status(200).json(userWithPreferences);
  } catch (error) {
    return res.status(500).json({ error: 'Error fetching user preferences' });
  }
};

// Update das preferências de tropes
export const updateTropePreferences = async (req: Request, res: Response) => {
  const user = await getUserFromAuthToken(req);

  if (!user) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  const { likedTropeIds = [], dislikedTropeIds = [] } = req.body;

  try {
    let dbUser = await prisma.user.findUnique({
      where: { id: user.uid }
    });

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          id: user.uid,
          email: user.email || '',
          username: user.username || '',
          password: '' 
        }
      });
    }

    // Update das preferências 
    await prisma.user.update({
      where: { id: user.uid },
      data: {
        likedTropes: {
          set: [], // limpa as conexões existentes
          connect: likedTropeIds.map((id: string) => ({ id }))
        },
        dislikedTropes: {
          set: [], // limpa as conexões existentes
          connect: dislikedTropeIds.map((id: string) => ({ id }))
        }
      }
    });

    return res.status(200).json({ message: 'Trope preferences updated successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Error updating trope preferences' });
  }
};

// Update das preferências de categorias
export const updateCategoryPreferences = async (req: Request, res: Response) => {
  const user = await getUserFromAuthToken(req);

  if (!user) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  const { likedCategories = [], dislikedCategories = [] } = req.body;

  try {
    for (const category of [...likedCategories, ...dislikedCategories]) {
      await prisma.category.upsert({
        where: { name: category },
        create: { name: category },
        update: {}
      });
    }

    const likedCategoryRecords = await Promise.all(
      likedCategories.map((name: string) => 
        prisma.category.findUnique({ where: { name } })
      )
    );
    
    const dislikedCategoryRecords = await Promise.all(
      dislikedCategories.map((name: string) => 
        prisma.category.findUnique({ where: { name } })
      )
    );

    await prisma.user.update({
      where: { id: user.uid },
      data: {
        likedCategories: {
          set: [],
          connect: likedCategoryRecords.filter(Boolean).map((cat: any) => ({ id: cat!.id }))
        },
        dislikedCategories: {
          set: [],
          connect: dislikedCategoryRecords.filter(Boolean).map((cat: any) => ({ id: cat!.id }))
        }
      }
    });

    return res.status(200).json({ message: 'Category preferences updated successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Error updating category preferences' });
  }
};

// Update das preferências de autores
export const updateAuthorPreferences = async (req: Request, res: Response) => {
  const user = await getUserFromAuthToken(req);

  if (!user) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  const { likedAuthors = [], dislikedAuthors = [] } = req.body;

  try {
    for (const author of [...likedAuthors, ...dislikedAuthors]) {
      await prisma.author.upsert({
        where: { name: author },
        create: { name: author },
        update: {}
      });
    }

    const likedAuthorRecords = await Promise.all(
      likedAuthors.map((name: string) => 
        prisma.author.findUnique({ where: { name } })
      )
    );
    
    const dislikedAuthorRecords = await Promise.all(
      dislikedAuthors.map((name: string) => 
        prisma.author.findUnique({ where: { name } })
      )
    );

    await prisma.user.update({
      where: { id: user.uid },
      data: {
        likedAuthors: {
          set: [],
          connect: likedAuthorRecords.filter(Boolean).map((author: any) => ({ id: author!.id }))
        },
        dislikedAuthors: {
          set: [],
          connect: dislikedAuthorRecords.filter(Boolean).map((author: any) => ({ id: author!.id }))
        }
      }
    });

    return res.status(200).json({ message: 'Author preferences updated successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Error updating author preferences' });
  }
};

// Update das preferências de idiomas
export const updateLanguagePreferences = async (req: Request, res: Response) => {
  const user = await getUserFromAuthToken(req);

  if (!user) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  const { languages = [] } = req.body;

  try {
    // verifica se as línguas existem 
    for (const language of languages) {
      await prisma.language.upsert({
        where: { code: language },
        create: { 
          code: language, 
          name: language === 'pt' ? 'Português' : language === 'en' ? 'Inglês' : language 
        },
        update: {}
      });
    }

    const languageRecords = await Promise.all(
      languages.map((code: string) => 
        prisma.language.findUnique({ where: { code } })
      )
    );

    // Update  linguagens 
    await prisma.user.update({
      where: { id: user.uid },
      data: {
        languages: {
          set: [], // limpa as conexões existentes
          connect: languageRecords.filter(Boolean).map((lang: any) => ({ id: lang!.id }))
        }
      }
    });

    return res.status(200).json({ message: 'Language preferences updated successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Error updating language preferences' });
  }
};

// procura autores para autocomplete
export const searchAuthors = async (req: Request, res: Response) => {
  const { query } = req.query;
  
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    const authors = await prisma.author.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive'
        }
      },
      take: 10,
      orderBy: {
        name: 'asc'
      }
    });
    
    return res.status(200).json(authors);
  } catch (error) {
    return res.status(500).json({ error: 'Error searching authors' });
  }
};
