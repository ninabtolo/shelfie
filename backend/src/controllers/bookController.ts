// /src/controllers/bookController.ts

import { Request, Response } from 'express';
import { prisma } from '../models/prismaClient';
import { getUserFromAuthToken } from '../services/firebaseAuth';
import { searchBooks, getBookById, formatBookData, formatSearchResults } from '../services/googleBooksService';

// procura livros pela api Google Books
export const searchGoogleBooks = async (req: Request, res: Response) => {
  const { query, startIndex, maxResults } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    const result = await searchBooks(
      query as string, 
      startIndex ? parseInt(startIndex as string) : 0,
      maxResults ? parseInt(maxResults as string) : 10
    );
    
    if (!result || !result.items) {
      return res.status(200).json({ items: [], totalItems: 0 });
    }
    
    // Formata os resultados da pesquisa
    const formattedResults = formatSearchResults(result);
    
    return res.status(200).json(formattedResults);
  } catch (error) {
    return res.status(500).json({ error: 'Error searching books' });
  }
};

// pega os detalhes do livro
export const getBookDetails = async (req: Request, res: Response) => {
  const { googleBookId } = req.params;
  
  try {
    // verifica se o livro já existe no db
    let book = await prisma.book.findUnique({
      where: { googleBookId },
      include: {
        ratings: {
          select: {
            rating: true,
            review: true,
            user: {
              select: {
                email: true,
                username: true  
              }
            },
            createdAt: true
          }
        }
      }
    });
    
    // se n existe, busca na api do google
    if (!book) {
      try {
        const googleBookData = await getBookById(googleBookId);
        const formattedBookData = formatBookData(googleBookData);
        
        // guarda o livro para pesquisas futuras
        try {
          book = await prisma.book.create({
            data: formattedBookData,
            include: {
              ratings: {
                select: {
                  rating: true,
                  review: true,
                  user: {
                    select: {
                      email: true,
                      username: true  
                    }
                  },
                  createdAt: true
                }
              }
            }
          });
        } catch (dbError: any) {
          if (dbError.code === 'P2002' && dbError.meta?.target?.includes('googleBookId')) {
            book = await prisma.book.findUnique({
              where: { googleBookId },
              include: {
                ratings: {
                  select: {
                    rating: true,
                    review: true,
                    user: {
                      select: {
                        email: true,
                        username: true
                      }
                    },
                    createdAt: true
                  }
                }
              }
            });
          } else {
            throw dbError;
          }
        }
      } catch (apiError) {
        return res.status(500).json({ 
          error: 'Error retrieving book details',
          message: 'We could not retrieve the book information at this time. Please try again later.'
        });
      }
    }
    
    return res.status(200).json(book);
  } catch (error) {
    return res.status(500).json({ error: 'Error retrieving book details' });
  }
};

// adiciona livro ao histórico do user
export const addBookToHistory = async (req: Request, res: Response) => {
  const { googleBookId, rating, review } = req.body;

  const user = await getUserFromAuthToken(req);

  if (!user) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  try {
    let book = await prisma.book.findUnique({
      where: { googleBookId }
    });

    if (!book) {
      // Fetch da api do google e salva no db
      const googleBookData = await getBookById(googleBookId);
      const formattedBookData = formatBookData(googleBookData);
      
      book = await prisma.book.create({
        data: formattedBookData
      });
    }

    // procura o user no db
    let dbUser = await prisma.user.findUnique({
      where: { id: user.uid }
    });

    if (!dbUser) {
      // cria se n existe
      dbUser = await prisma.user.create({
        data: {
          id: user.uid,
          email: user.email || '',
          username: user.username || '',
          password: '' 
        }
      });
    }

    // add o livro na lista 
    await prisma.user.update({
      where: { id: user.uid },
      data: {
        books: {
          connect: { id: book.id }
        }
      }
    });

    // Add ou atualiza a avaliação
    const existingRating = await prisma.rating.findFirst({
      where: {
        userId: user.uid,
        bookId: book.id,
      }
    });

    if (existingRating) {
      await prisma.rating.update({
        where: { id: existingRating.id },
        data: { rating, review }
      });
    } else {
      await prisma.rating.create({
        data: {
          userId: user.uid,
          bookId: book.id,
          rating,
          review
        }
      });
    }

    return res.status(200).json({ message: 'Livro adicionado ao histórico com sucesso' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao adicionar livro ao histórico' });
  }
};

// remove livro do histórico do user
export const removeBookFromHistory = async (req: Request, res: Response) => {
  const { googleBookId } = req.params;
  
  const user = await getUserFromAuthToken(req);

  if (!user) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  try {
    // acha o livro no db
    const book = await prisma.book.findUnique({
      where: { googleBookId }
    });

    if (!book) {
      return res.status(404).json({ error: 'Livro não encontrado' });
    }

    // tira a avaliação
    await prisma.rating.deleteMany({
      where: {
        userId: user.uid,
        bookId: book.id,
      }
    });

    // tira o livro do histórico
    await prisma.user.update({
      where: { id: user.uid },
      data: {
        books: {
          disconnect: { id: book.id }
        }
      }
    });

    return res.status(200).json({ message: 'Livro removido do histórico com sucesso' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao remover livro do histórico' });
  }
};

// toggle do status de favorito
export const toggleBookFavorite = async (req: Request, res: Response) => {
  const { googleBookId } = req.body;

  const user = await getUserFromAuthToken(req);

  if (!user) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  try {
    let book = await prisma.book.findUnique({
      where: { googleBookId }
    });

    if (!book) {
      const googleBookData = await getBookById(googleBookId);
      const formattedBookData = formatBookData(googleBookData);
      
      book = await prisma.book.create({
        data: formattedBookData
      });
    }

    // vê se o livro já é favorito
    const currentUser = await prisma.user.findUnique({
      where: { id: user.uid },
      include: {
        favorites: {
          where: { id: book.id }
        }
      }
    });

    if (currentUser?.favorites.length) {
      // Remove dos favoritos
      await prisma.user.update({
        where: { id: user.uid },
        data: {
          favorites: {
            disconnect: { id: book.id }
          }
        }
      });
      return res.status(200).json({ message: 'Livro removido dos favoritos' });
    } else {
      // Add nos favoritos
      await prisma.user.update({
        where: { id: user.uid },
        data: {
          favorites: {
            connect: { id: book.id }
          }
        }
      });
      return res.status(200).json({ message: 'Livro adicionado aos favoritos' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao alterar status de favorito do livro' });
  }
};

// toggle da lista de leitura
export const toggleReadingList = async (req: Request, res: Response) => {
  const { googleBookId } = req.body;

  const user = await getUserFromAuthToken(req);

  if (!user) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  try {
    let book = await prisma.book.findUnique({
      where: { googleBookId }
    });

    if (!book) {
      const googleBookData = await getBookById(googleBookId);
      const formattedBookData = formatBookData(googleBookData);
      
      book = await prisma.book.create({
        data: formattedBookData
      });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: user.uid },
      include: {
        readingList: {
          where: { id: book.id }
        }
      }
    });

    if (currentUser?.readingList.length) {
      // Remove da lista
      await prisma.user.update({
        where: { id: user.uid },
        data: {
          readingList: {
            disconnect: { id: book.id }
          }
        }
      });
      return res.status(200).json({ message: 'Livro removido da lista de leitura' });
    } else {
      // Add na lista
      await prisma.user.update({
        where: { id: user.uid },
        data: {
          readingList: {
            connect: { id: book.id }
          }
        }
      });
      return res.status(200).json({ message: 'Livro adicionado à lista de leitura' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao alterar status da lista de leitura' });
  }
};

// pega o historico com avaliações do user
export const getUserReadHistory = async (req: Request, res: Response) => {
  const user = await getUserFromAuthToken(req);

  if (!user) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

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
      return res.status(200).json([]);
    }

    const userWithBooks = await prisma.user.findUnique({
      where: { id: user.uid },
      include: {
        books: {
          include: {
            ratings: {
              where: { userId: user.uid }
            }
          }
        }
      }
    });

    return res.status(200).json(userWithBooks?.books || []);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao obter o histórico de leitura' });
  }
};

// pega o historico 
export const getUserReadingList = async (req: Request, res: Response) => {
  const user = await getUserFromAuthToken(req);

  if (!user) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

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
      return res.status(200).json([]);
    }

    const userWithReadingList = await prisma.user.findUnique({
      where: { id: user.uid },
      include: {
        readingList: true
      }
    });

    return res.status(200).json(userWithReadingList?.readingList || []);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao obter a lista de leitura' });
  }
};

// pega os favoritos 
export const getUserFavorites = async (req: Request, res: Response) => {
  const user = await getUserFromAuthToken(req);

  if (!user) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

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
      return res.status(200).json([]);
    }

    const userWithFavorites = await prisma.user.findUnique({
      where: { id: user.uid },
      include: {
        favorites: true
      }
    });

    return res.status(200).json(userWithFavorites?.favorites || []);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao obter os livros favoritos' });
  }
};

// pega categorias da api do google
export const getCommonCategories = async (req: Request, res: Response) => {
  const { query } = req.query;
  
  try {
    // se tiver query, procura na api
    if (query) {
      const result = await searchBooks(
        `subject:${query}`, 
        0,
        10
      );
      
      // extrai e deduplica as categorias dos resultados  
      const categories = new Set<string>();
      if (result.items && result.items.length > 0) {
        result.items.forEach(book => {
          book.volumeInfo.categories?.forEach(category => {
            categories.add(category);
          });
        });
      }
      
      return res.status(200).json(Array.from(categories));
    } else {
      // pega algumas categorias comuns
      const commonCategories = [
        'Ficção', 'Fantasia', 'Ficção científica', 'Romance', 'Mistério',
        'Thriller', 'Terror', 'Biografia', 'História', 'Autoajuda',
        'Young Adult', 'Infantil', 'Poesia', 'Drama', 'HQs'
      ];
      
      return res.status(200).json(commonCategories);
    }
  } catch (error) {
    return res.status(500).json({ error: 'Error getting categories' });
  }
};

// Get common authors from Google Books
export const getCommonAuthors = async (req: Request, res: Response) => {
  const { query } = req.query;
  
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query parameter is required' });
  }
  
  try {
    const result = await searchBooks(
      `inauthor:${query}`, 
      0,
      20
    );
    
    // Epega os autores e conta a frequencia
    const authorsMap = new Map<string, number>(); 
    
    if (result.items && result.items.length > 0) {
      result.items.forEach(book => {
        book.volumeInfo.authors?.forEach(author => {
          authorsMap.set(author, (authorsMap.get(author) || 0) + 1);
        });
      });
    }
    
    // converte para array e ordena
    const authors = Array.from(authorsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, _]) => ({ name, id: name.replace(/\s+/g, '-').toLowerCase() }));
    
    return res.status(200).json(authors);
  } catch (error) {
    return res.status(500).json({ error: 'Error searching authors' });
  }
};
