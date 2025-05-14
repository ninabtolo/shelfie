import express from 'express';
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  shareBook 
} from '../controllers/notificationController';

const router = express.Router();

router.get('/', getUserNotifications);
router.patch('/:notificationId/read', markNotificationAsRead);
router.patch('/read-all', markAllNotificationsAsRead);
router.post('/share-book', shareBook);

export default router;
