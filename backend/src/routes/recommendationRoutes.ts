import express from 'express';
import {
  getAutomatedRecommendations,
  getChatRecommendation,
  getRecommendationSettings,
  updateRecommendationSettings
} from '../controllers/recommendationController';

const router = express.Router();

router.get('/automated', getAutomatedRecommendations);
router.post('/chat', getChatRecommendation);
router.get('/settings', getRecommendationSettings);
router.post('/settings', updateRecommendationSettings);

export default router;
