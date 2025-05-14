import { Request, Response, NextFunction } from 'express';
import { getUserFromAuthToken } from '../services/firebaseAuth';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getUserFromAuthToken(req);
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }
    
    // Adiciona o usuário ao objeto de requisição
    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Authentication error' });
  }
};
