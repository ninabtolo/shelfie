import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GOOGLE_BOOKS_API_URL = 'https://www.googleapis.com/books/v1/volumes';
const API_KEY = process.env.GOOGLE_BOOKS_API_KEY;

// cache simples na memória para respostas da API
const cache: Record<string, {data: any, timestamp: number}> = {};
const CACHE_TTL = 3600000;

export interface GoogleBookSearchResult {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    publishedDate?: string;
    pageCount?: number;
    categories?: string[];
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    industryIdentifiers?: Array<{
      type: string;
      identifier: string;
    }>;
  };
}

export interface GoogleBookSearchResponse {
  items: GoogleBookSearchResult[];
  totalItems: number;
}

// valida o ID do livro do Google Books 
const isValidGoogleBookId = (id: string): boolean => {
  return /^[\w\-_]{8,25}$/.test(id);
};

// procura por livros
export const searchBooks = async (
  query: string, 
  startIndex: number = 0, 
  maxResults: number = 10,
  retries: number = 3
): Promise<GoogleBookSearchResponse> => {
  // Cria uma chave de cache para esta pesquisa
  const cacheKey = `search:${query}:${startIndex}:${maxResults}`;
  
  // verifica o cache primeiro
  if (cache[cacheKey] && (Date.now() - cache[cacheKey].timestamp < CACHE_TTL)) {
    return cache[cacheKey].data;
  }

  try {
    const response = await axios.get(GOOGLE_BOOKS_API_URL, {
      params: {
        q: query,
        startIndex,
        maxResults,
        key: API_KEY,
      },
      timeout: 8000, 
    });
    
    // resposta bem-sucedida, armazena no cache
    cache[cacheKey] = {
      data: response.data,
      timestamp: Date.now()
    };
    
    return response.data;
  } catch (error) {
    if (retries > 0 && axios.isAxiosError(error) && 
        (error.response?.status === 503 || error.code === 'ECONNABORTED' || !error.response)) {
      const delay = 1000 * Math.pow(2, 3 - retries);
      await new Promise(resolve => setTimeout(resolve, delay));
      return searchBooks(query, startIndex, maxResults, retries - 1);
    }
    
    return { items: [], totalItems: 0 };
  }
};

// pega os detalhes do livro pelo id do google books
export const getBookById = async (googleBookId: string): Promise<GoogleBookSearchResult> => {
  // cria uma nova chave de cache p esse id 
  const cacheKey = `book:${googleBookId}`;
  
  // vê o cache primeiro
  if (cache[cacheKey] && (Date.now() - cache[cacheKey].timestamp < CACHE_TTL)) {
    return cache[cacheKey].data;
  }

  // Validate o formato do id 
  if (!googleBookId || !isValidGoogleBookId(googleBookId)) {
    // retorna estrutura fallback p invalidos 
    return createFallbackBook(googleBookId);
  }

  try {
    const response = await axios.get(`${GOOGLE_BOOKS_API_URL}/${googleBookId}`, {
      params: {
        key: API_KEY,
      },
      timeout: 8000,
    });
    
    // cache das respostas bem sucedidas 
    cache[cacheKey] = {
      data: response.data,
      timestamp: Date.now()
    };
    
    return response.data;
  } catch (error) {
    // fallback p erros 
    return createFallbackBook(googleBookId);
  }
};

// objeto fallback p quando a API falha 
const createFallbackBook = (googleBookId: string): GoogleBookSearchResult => {
  return {
    id: googleBookId,
    volumeInfo: {
      title: "Book Information Temporarily Unavailable",
      authors: ["Unknown Author"],
      description: "Sorry, we couldn't retrieve the book information at this time. Please try again later."
    }
  };
};

// formata a api para o app 
export const formatBookData = (googleBookData: GoogleBookSearchResult) => {
  // pega o ISBN 
  let isbn = null;
  if (googleBookData.volumeInfo.industryIdentifiers && googleBookData.volumeInfo.industryIdentifiers.length > 0) {
    const isbnObject = googleBookData.volumeInfo.industryIdentifiers.find(
      id => id.type === 'ISBN_13' || id.type === 'ISBN_10'
    );
    isbn = isbnObject?.identifier || null;
  }
  
  // imagem da capa 
  let coverUrl = null;
  if (googleBookData.volumeInfo.imageLinks) {
    // tamanho q estiver disponivel 
    coverUrl = googleBookData.volumeInfo.imageLinks.thumbnail || 
               googleBookData.volumeInfo.imageLinks.smallThumbnail || null;
    
    // Converte p https se é http 
    if (coverUrl && coverUrl.startsWith('http:')) {
      coverUrl = coverUrl.replace('http:', 'https:');
    }
  }
  
  return {
    googleBookId: googleBookData.id,
    title: googleBookData.volumeInfo.title || 'Unknown Title',
    author: googleBookData.volumeInfo.authors?.[0] || 'Unknown Author',
    description: googleBookData.volumeInfo.description || 'No description available.',
    coverUrl: coverUrl,
    publishedDate: googleBookData.volumeInfo.publishedDate || null,
    pageCount: googleBookData.volumeInfo.pageCount || null,
    categories: googleBookData.volumeInfo.categories || [],
    isbn: isbn
  };
};

// formata os resultados da API 
export const formatSearchResults = (googleBooksData: GoogleBookSearchResponse) => {
  if (!googleBooksData.items || googleBooksData.items.length === 0) {
    return { items: [], totalItems: 0 };
  }
  
  try {
    const formattedItems = googleBooksData.items
      .filter(item => item && item.volumeInfo) 
      .map(item => ({
        googleBookId: item.id,
        title: item.volumeInfo.title || 'Título desconhecido',
        author: item.volumeInfo.authors?.[0] || 'Autor desconhecido',
        coverUrl: item.volumeInfo.imageLinks?.thumbnail || 
                  item.volumeInfo.imageLinks?.smallThumbnail || null
      }));
      
    return {
      items: formattedItems,
      totalItems: googleBooksData.totalItems
    };
  } catch (error) {
    return { items: [], totalItems: 0 };
  }
};