import { Request, Response, NextFunction } from 'express';
import { getUserFromAuthToken } from '../src/services/firebaseAuth';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getUserFromAuthToken(req);
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
