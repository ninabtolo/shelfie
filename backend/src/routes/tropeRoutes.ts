// /src/routes/tropeRoutes.ts

import express from 'express';
import { markTropeFavorite } from '../controllers/tropeController';

const router = express.Router();

router.post('/markFavorite', markTropeFavorite);

export default router;
