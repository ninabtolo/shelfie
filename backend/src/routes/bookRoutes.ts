// /src/routes/bookRoutes.ts

import express from 'express';
import { 
  searchGoogleBooks, 
  getBookDetails, 
  addBookToHistory,
  toggleBookFavorite,
  getUserReadHistory,
  getUserFavorites,
  getCommonCategories,
  getCommonAuthors,
  toggleReadingList,
  getUserReadingList,
  removeBookFromHistory
} from '../controllers/bookController';

const router = express.Router();

// rotas Google Books API
router.get('/search', searchGoogleBooks);
router.get('/details/:googleBookId', getBookDetails);
router.get('/categories', getCommonCategories);
router.get('/authors', getCommonAuthors);

// interações user/livros
router.post('/addToHistory', addBookToHistory);
router.post('/toggleFavorite', toggleBookFavorite);
router.get('/history', getUserReadHistory);
router.get('/favorites', getUserFavorites);
router.delete('/history/:googleBookId', removeBookFromHistory);

// lista de leitura
router.post('/reading-list/toggle', toggleReadingList);
router.get('/reading-list', getUserReadingList);

export default router;
