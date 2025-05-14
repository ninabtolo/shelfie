import express from 'express';
import * as BookController from '../controllers/bookController';
import * as UserController from '../controllers/userController';
import * as TropeController from '../controllers/tropeController';
import * as RecommendationController from '../controllers/recommendationController';
import * as PreferenceController from '../controllers/preferenceController';
import * as NotificationController from '../controllers/notificationController';

const router = express.Router();

// rotas de livros
router.get('/books/search', BookController.searchGoogleBooks);
router.get('/books/:googleBookId', BookController.getBookDetails);
router.post('/books/history', BookController.addBookToHistory);
router.post('/books/favorite', BookController.toggleBookFavorite);
router.post('/books/reading-list', BookController.toggleReadingList);
router.get('/books/history', BookController.getUserReadHistory);
router.get('/books/reading-list', BookController.getUserReadingList);
router.get('/books/favorites', BookController.getUserFavorites);
router.get('/books/categories', BookController.getCommonCategories);
router.get('/books/authors', BookController.getCommonAuthors);

// rotas do usuário
router.post('/users/register', UserController.registerUser);
router.patch('/users/profile-picture', UserController.updateProfilePicture);
router.post('/users/follow', UserController.followUser);
router.post('/users/unfollow', UserController.unfollowUser);
router.get('/users/followers', UserController.getFollowers);
router.get('/users/following', UserController.getFollowing);
router.get('/users/profile/:userId?', UserController.getUserProfile);
router.get('/users/search', UserController.searchUsers);

// rotas de tropes 
router.post('/tropes/favorite', TropeController.markTropeFavorite);

// rotas de recomendações
router.get('/recommendations/automated', RecommendationController.getAutomatedRecommendations);
router.post('/recommendations/chat', RecommendationController.getChatRecommendation);
router.get('/recommendations/settings', RecommendationController.getRecommendationSettings);
router.patch('/recommendations/settings', RecommendationController.updateRecommendationSettings);

// rotas de preferências
router.get('/preferences/tropes', PreferenceController.getAllTropes);
router.get('/preferences', PreferenceController.getUserPreferences);
router.patch('/preferences/tropes', PreferenceController.updateTropePreferences);
router.patch('/preferences/categories', PreferenceController.updateCategoryPreferences);
router.patch('/preferences/authors', PreferenceController.updateAuthorPreferences);
router.get('/preferences/authors/search', PreferenceController.searchAuthors);

// rotas de notificações
router.get('/notifications', NotificationController.getUserNotifications);
router.patch('/notifications/:notificationId/read', NotificationController.markNotificationAsRead);
router.patch('/notifications/read-all', NotificationController.markAllNotificationsAsRead);
router.post('/notifications/share-book', NotificationController.shareBook);

export default router;