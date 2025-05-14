import axios from 'axios';
import { auth } from '../firebase/config';

// cria a instância do axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Adiciona um interceptor de requisição para adicionar o token de autenticação
api.interceptors.request.use(async (config) => {
  try {
    const user = auth.currentUser;
    
    if (user) {
      const token = await user.getIdToken(true); // Força a atualização do token
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  } catch (error) {
    console.error('Error setting auth token:', error);
    return Promise.reject(error);
  }
}, (error) => {
  return Promise.reject(error);
});

// Adiciona um interceptor de resposta para lidar com erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('Authentication error. You might need to log in again.');
    }
    return Promise.reject(error);
  }
);

// livros 
export const bookApi = {
  search: async (query: string, startIndex = 0, maxResults = 10) => {
    try {
      console.log(`Making API request to search for: "${query}"`);
      const response = await api.get('/books/search', { 
        params: { query, startIndex, maxResults },
        timeout: 15000 
      });
      
      console.log(`Search response received:`, response.data);
      
      if (!response.data || (!response.data.items && !Array.isArray(response.data))) {
        console.error('Invalid search response format:', response.data);
        return { items: [], totalItems: 0 };
      }
      
      return response.data;
    } catch (error) {
      console.error('Book search error:', error);
      // Retorna um objeto padrão em caso de erro
      return { items: [], totalItems: 0 };
    }
  },
  
  getDetails: async (googleBookId: string) => {
    try {
      // Valida o googleBookId antes de mandar pro backend
      if (!googleBookId || typeof googleBookId !== 'string' || googleBookId.includes(' ')) {
        throw new Error('Invalid book ID format');
      }
      
      const response = await api.get(`/books/details/${googleBookId}`, {
        timeout: 10000 
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching book details for ID ${googleBookId}:`, error);
      return {
        googleBookId,
        title: "Book Information Unavailable",
        author: "Unknown",
        description: "Sorry, we couldn't retrieve the book information at this time. Please try again later.",
        coverUrl: "https://via.placeholder.com/128x192?text=Book+Unavailable",
        publishedDate: null,
        pageCount: null,
        categories: [],
        isbn: null,
        ratings: []
      };
    }
  },
  
  addToHistory: async (googleBookId: string, rating: number, review?: string) => {
    const response = await api.post('/books/addToHistory', {
      googleBookId,
      rating,
      review
    });
    return response.data;
  },
  
  toggleFavorite: async (googleBookId: string) => {
    const response = await api.post('/books/toggleFavorite', { googleBookId });
    return response.data;
  },
  
  getUserHistory: async () => {
    const response = await api.get('/books/history');
    return response.data;
  },
  
  getUserFavorites: async () => {
    const response = await api.get('/books/favorites');
    return response.data;
  },
  
  toggleReadingList: async (googleBookId: string) => {
    const response = await api.post('/books/reading-list/toggle', { googleBookId });
    return response.data;
  },
  
  // pega a lista de leitura do usuário
  getUserReadingList: async () => {
    const response = await api.get('/books/reading-list');
    return response.data;
  },

  // Add this new method
  removeFromHistory: async (googleBookId: string) => {
    const response = await api.delete(`/books/history/${googleBookId}`);
    return response.data;
  }
};

export const tropeApi = {
  markFavorite: async (tropeId: string) => {
    const response = await api.post('/tropes/markFavorite', { tropeId });
    return response.data;
  }
};

// preferencias 
export const preferenceApi = {
  getAllTropes: async () => {
    const response = await api.get('/preferences/tropes');
    return response.data;
  },
  
  getUserPreferences: async (silent = false) => {
    try {
      const response = await api.get('/preferences/user');
      return response.data;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      if (!silent) {
        throw error; 
      }
      return { likedTropes: [], dislikedTropes: [], likedCategories: [], dislikedCategories: [], likedAuthors: [], dislikedAuthors: [] };
    }
  },
  
  updateTropePreferences: async (data: { likedTropeIds: string[], dislikedTropeIds: string[] }) => {
    const response = await api.post('/preferences/tropes', data);
    return response.data;
  },
  
  updateCategoryPreferences: async (data: { likedCategories: string[], dislikedCategories: string[] }) => {
    const response = await api.post('/preferences/categories', data);
    return response.data;
  },
  
  updateAuthorPreferences: async (data: { likedAuthors: string[], dislikedAuthors: string[] }) => {
    const response = await api.post('/preferences/authors', data);
    return response.data;
  },
  
  searchCategories: async (query: string) => {
    const response = await api.get('/books/categories', { params: { query } });
    return response.data;
  },
  
  searchAuthors: async (query: string) => {
    const response = await api.get('/books/authors', { params: { query } });
    return response.data;
  },

  updateLanguagePreferences: async (data: { languages: string[] }) => {
    const response = await api.post('/preferences/languages', data);
    return response.data;
  }
};

// recomendações
export const recommendationApi = {
  getAutomatedRecommendations: async () => {
    const response = await api.get('/recommendations/automated');
    return response.data;
  },
  
  getChatRecommendation: async (message: string) => {
    const response = await api.post('/recommendations/chat', { message });
    return response.data;
  },
  
  toggleAutomatedRecommendations: async (enabled: boolean) => {
    const response = await api.post('/recommendations/settings', { 
      automatedRecommendationsEnabled: enabled 
    });
    return response.data;
  },
  
  getRecommendationSettings: async (silent = false) => {
    try {
      const response = await api.get('/recommendations/settings');
      return response.data;
    } catch (error) {
      console.error('Error getting recommendation settings:', error);
      if (!silent) {
        throw error;
      }
      return { automatedRecommendationsEnabled: true };
    }
  }
};

// user 
export const userApi = {
  checkUsernameAvailability: async (username: string) => {
    const response = await api.get(`/users/check-username?username=${encodeURIComponent(username)}`);
    return response.data.available;
  },

  updateUsername: async (username: string) => {
    const response = await api.post('/users/update-username', { username });
    return response.data;
  },

  getUserProfile: async (userId?: string) => {
    const url = userId ? `/users/profile/${userId}` : '/users/profile';
    const response = await api.get(url);
    return response.data;
  },

  updateProfilePicture: async (data: { profilePicture: string }) => {
    const response = await api.post('/users/profile-picture', data);
    return response.data;
  },

  followUser: async (targetUserId: string) => {
    const response = await api.post('/users/follow', { targetUserId });
    return response.data;
  },

  unfollowUser: async (targetUserId: string) => {
    const response = await api.post('/users/unfollow', { targetUserId });
    return response.data;
  },

  getFollowers: async () => {
    const response = await api.get('/users/followers');
    return response.data;
  },

  getFollowing: async () => {
    const response = await api.get('/users/following');
    return response.data;
  },

  searchUsers: async (query: string) => {
    const response = await api.get(`/users/search?query=${encodeURIComponent(query)}`);
    return response.data;
  }
};

// notificações
export const notificationApi = {
  getUserNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },
  
  markAsRead: async (notificationId: string) => {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },
  
  markAllAsRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },
  
  shareBook: async (googleBookId: string, toUserId: string, message?: string) => {
    const response = await api.post('/notifications/share-book', {
      googleBookId,
      toUserId,
      message
    });
    return response.data;
  }
};

export default api;
