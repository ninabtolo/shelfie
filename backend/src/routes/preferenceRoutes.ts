import express from 'express';
import {
  getAllTropes,
  getUserPreferences,
  updateTropePreferences,
  updateCategoryPreferences,
  updateAuthorPreferences,
  searchAuthors,
  updateLanguagePreferences
} from '../controllers/preferenceController';

const router = express.Router();

// pega as tropes
router.get('/tropes', getAllTropes);

// pega as preferências
router.get('/user', getUserPreferences);

// update das preferências
router.post('/tropes', updateTropePreferences);
router.post('/categories', updateCategoryPreferences);
router.post('/authors', updateAuthorPreferences);
router.post('/languages', updateLanguagePreferences);

// procura por autores
router.get('/authors/search', searchAuthors);

export default router;
