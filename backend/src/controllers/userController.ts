// /src/controllers/userController.ts

import { Request, Response } from 'express';
import { prisma } from '../models/prismaClient';
import { getUserFromAuthToken } from '../services/firebaseAuth';

export const registerUser = async (req: Request, res: Response) => {
  const { email, password, username, uid } = req.body;

  if (!uid) {
    return res.status(400).json({ error: 'Firebase UID is required' });
  }

  try {
    // vê se o email já existe
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUserByEmail) {
      return res.status(400).json({ error: 'Email já registrado' });
    }

    // vê se o username já existe
    const existingUserByUsername = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUserByUsername) {
      return res.status(400).json({ error: 'Nome de usuário já está em uso' });
    }

    const newUser = await prisma.user.create({
      data: {
        id: uid, // Use the Firebase UID as the user ID
        email,
        password,
        username,
      },
    });

    return res.status(201).json({ message: 'Usuário registrado com sucesso', user: newUser });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao registrar o usuário' });
  }
};

// vê se o username está disponível
export const checkUsernameAvailability = async (req: Request, res: Response) => {
  const { username } = req.query;
  
  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Username parameter is required' });
  }
  
  try {
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });
    
    return res.status(200).json({ available: !existingUser });
  } catch (error) {
    return res.status(500).json({ error: 'Error checking username availability' });
  }
};

// update da foto de perfil
export const updateProfilePicture = async (req: Request, res: Response) => {
  try {
    const user = await getUserFromAuthToken(req);
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { profilePicture } = req.body;
    if (!profilePicture) {
      return res.status(400).json({ error: 'Profile picture URL is required' });
    }

    let dbUser = await prisma.user.findUnique({
      where: { id: user.uid }
    });

    if (!dbUser) {
      
      dbUser = await prisma.user.create({
        data: {
          id: user.uid,
          email: user.email || '',
          username: user.username, 
          password: '',
          profilePicture
        }
      });
    } else {
      dbUser = await prisma.user.update({
        where: { id: user.uid },
        data: { profilePicture }
      });
    }

    return res.status(200).json({ message: 'Profile picture updated successfully', user: dbUser });
  } catch (error) {
    return res.status(500).json({ error: 'Error updating profile picture' });
  }
};

// segue um usuário
export const followUser = async (req: Request, res: Response) => {
  try {
    const user = await getUserFromAuthToken(req);
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { targetUserId } = req.body;
    if (!targetUserId) {
      return res.status(400).json({ error: 'Target user ID is required' });
    }

    // vê se o usuário alvo existe
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    // vê se já segue
    const currentUser = await prisma.user.findUnique({
      where: { id: user.uid },
      include: {
        following: {
          where: { id: targetUserId }
        }
      }
    });

    if (currentUser?.following.length) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    // add o relacionamento de seguir
    await prisma.user.update({
      where: { id: user.uid },
      data: {
        following: {
          connect: { id: targetUserId }
        }
      }
    });

    // cria a notificação
    const currentUserWithUsername = await prisma.user.findUnique({
      where: { id: user.uid },
      select: { username: true }
    });

    await prisma.notification.create({
      data: {
        type: 'FOLLOW',
        message: `${currentUserWithUsername?.username} começou a te seguir`,
        userId: targetUserId,
        fromUserId: user.uid
      }
    });

    return res.status(200).json({ message: 'User followed successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Error following user' });
  }
};

// Unfollow alguém
export const unfollowUser = async (req: Request, res: Response) => {
  try {
    const user = await getUserFromAuthToken(req);
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { targetUserId } = req.body;
    if (!targetUserId) {
      return res.status(400).json({ error: 'Target user ID is required' });
    }

    // Remove o relacionamento de seguir
    await prisma.user.update({
      where: { id: user.uid },
      data: {
        following: {
          disconnect: { id: targetUserId }
        }
      }
    });

    return res.status(200).json({ message: 'User unfollowed successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Error unfollowing user' });
  }
};

// pega o seguidores 
export const getFollowers = async (req: Request, res: Response) => {
  try {
    const user = await getUserFromAuthToken(req);
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userWithFollowers = await prisma.user.findUnique({
      where: { id: user.uid },
      include: {
        followers: {
          select: {
            id: true,
            email: true,
            username: true,
            profilePicture: true
          }
        }
      }
    });

    return res.status(200).json(userWithFollowers?.followers || []);
  } catch (error) {
    return res.status(500).json({ error: 'Error getting followers' });
  }
};

// pega quem o user segue 
export const getFollowing = async (req: Request, res: Response) => {
  try {
    const user = await getUserFromAuthToken(req);
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userWithFollowing = await prisma.user.findUnique({
      where: { id: user.uid },
      include: {
        following: {
          select: {
            id: true,
            email: true,
            username: true, 
            profilePicture: true
          }
        }
      }
    });

    return res.status(200).json(userWithFollowing?.following || []);
  } catch (error) {
    return res.status(500).json({ error: 'Error getting followed users' });
  }
};

// perfil do user 
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const user = await getUserFromAuthToken(req);
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const { userId } = req.params;
    const targetUserId = userId || user.uid;

    const userProfile = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        username: true, 
        profilePicture: true,
        _count: {
          select: {
            followers: true,
            following: true,
            books: true,
            favorites: true
          }
        }
      }
    });

    if (!userProfile) {
      return res.status(404).json({ error: 'User not found' });
    }

    // só mostra o email se for o próprio user
    const responseProfile = {
      ...userProfile,
      email: targetUserId === user.uid ? userProfile.email : undefined,
      isFollowing: false
    };

    // não entendi isso mas não funciona sem isso
    if (userId && userId !== user.uid) {
      const followCheck = await prisma.user.findFirst({
        where: {
          id: user.uid,
          following: {
            some: {
              id: userId
            }
          }
        }
      });
      responseProfile.isFollowing = !!followCheck;
    }

    return res.status(200).json(responseProfile);
  } catch (error) {
    return res.status(500).json({ error: 'Error getting user profile' });
  }
};

// pesquisa de usuários
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const user = await getUserFromAuthToken(req);
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { query } = req.query;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    // procura pelo username
    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: query,
          mode: 'insensitive'
        },
        id: {
          not: user.uid // não mostra o próprio user
        }
      },
      select: {
        id: true,
        username: true, 
        profilePicture: true
      },
      take: 10
    });

    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ error: 'Error searching users' });
  }
};

// Update do username
export const updateUsername = async (req: Request, res: Response) => {
  try {
    const user = await getUserFromAuthToken(req);
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Valida o username
    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long' });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscore' });
    }

    // vê se já tem esse username
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser && existingUser.id !== user.uid) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // cria ou atualiza o user
    let dbUser = await prisma.user.findUnique({
      where: { id: user.uid }
    });

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          id: user.uid,
          email: user.email || '',
          username,
          password: ''
        }
      });
    } else {
      dbUser = await prisma.user.update({
        where: { id: user.uid },
        data: { username }
      });
    }

    return res.status(200).json({ message: 'Username updated successfully', user: dbUser });
  } catch (error) {
    return res.status(500).json({ error: 'Error updating username' });
  }
};
