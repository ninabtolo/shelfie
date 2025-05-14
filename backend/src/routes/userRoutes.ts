// /src/routes/userRoutes.ts

import express, { Router } from 'express';
import { 
  registerUser, checkUsernameAvailability, updateUsername,
  getUserProfile, updateProfilePicture, 
  followUser, unfollowUser, getFollowers, getFollowing,
  searchUsers 
} from '../controllers/userController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// rotas públicas
router.post('/register', registerUser);
router.get('/check-username', checkUsernameAvailability);

// rotas protegidas
router.use(authMiddleware);
router.get('/profile', getUserProfile);
router.get('/profile/:userId', getUserProfile);
router.post('/profile-picture', updateProfilePicture);
router.post('/update-username', updateUsername);
router.post('/follow', followUser);
router.post('/unfollow', unfollowUser);
router.get('/followers', getFollowers);
router.get('/following', getFollowing);
router.get('/search', searchUsers);

export default router;
