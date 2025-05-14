import { Request, Response } from 'express';
import { prisma } from '../models/prismaClient';
import { getUserFromAuthToken } from '../services/firebaseAuth';
import { getBookById, formatBookData } from '../services/googleBooksService';

// pega as notificações do user 
export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const user = await getUserFromAuthToken(req);
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: user.uid },
      include: {
        fromUser: {
          select: {
            id: true,
            username: true, 
            profilePicture: true
          }
        },
        book: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json(notifications);
  } catch (error) {
    return res.status(500).json({ error: 'Error getting notifications' });
  }
};

// marca a notificação como lida
export const markNotificationAsRead = async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;
    const user = await getUserFromAuthToken(req);
    
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // confere se a notificação é do user mesmo 
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: user.uid
      }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });

    return res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    return res.status(500).json({ error: 'Error marking notification as read' });
  }
};

// marca todas as notificações como lidas
export const markAllNotificationsAsRead = async (req: Request, res: Response) => {
  try {
    const user = await getUserFromAuthToken(req);
    
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await prisma.notification.updateMany({
      where: { 
        userId: user.uid,
        isRead: false
      },
      data: { isRead: true }
    });

    return res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    return res.status(500).json({ error: 'Error marking all notifications as read' });
  }
};

// compartilhamento de livro
export const shareBook = async (req: Request, res: Response) => {
  try {
    const { googleBookId, toUserId, message } = req.body;
    const user = await getUserFromAuthToken(req);
    
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // verifica se o usuário de destino existe
    const recipient = await prisma.user.findUnique({
      where: { id: toUserId }
    });

    if (!recipient) {
      return res.status(404).json({ error: 'Recipient user not found' });
    }

    // pega o username de quem enviou 
    const sender = await prisma.user.findUnique({
      where: { id: user.uid },
      select: { username: true }
    });

    // acha o livro 
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

    // cria a notificação
    const notification = await prisma.notification.create({
      data: {
        type: 'BOOK_SHARE',
        message: message || "te recomendou um livro", 
        userId: toUserId,
        fromUserId: user.uid,
        bookId: book.id
      }
    });

    return res.status(201).json({ 
      message: 'Book shared successfully', 
      notification 
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error sharing book' });
  }
};

// seguir usuário
export const followUser = async (req: Request, res: Response) => {
  try {
    const { targetUserId } = req.body;
    const user = await getUserFromAuthToken(req);
    
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // vê se o user existe 
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    // cria notificação de follow
    await prisma.notification.create({
      data: {
        type: 'FOLLOW',
        message: "começou a te seguir", 
        userId: targetUserId,
        fromUserId: user.uid
      }
    });

    return res.status(200).json({ message: 'User followed successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Error following user' });
  }
};
