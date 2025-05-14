// /src/controllers/tropeController.ts

import { Request, Response } from 'express';
import { prisma } from '../models/prismaClient';
import { getUserFromAuthToken } from '../services/firebaseAuth';

export const markTropeFavorite = async (req: Request, res: Response) => {
  const { tropeId } = req.body;

  const user = await getUserFromAuthToken(req);

  if (!user) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  try {
    const trope = await prisma.trope.findUnique({
      where: { id: tropeId }
    });

    if (!trope) {
      return res.status(404).json({ error: 'Trope não encontrada' });
    }

    let dbUser = await prisma.user.findUnique({
      where: { id: user.uid }
    });

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          id: user.uid,
          email: user.email || '',
          username: user.username || '',
          password: '' 
        }
      });
    }

    await prisma.user.update({
      where: { id: user.uid },
      data: {
        tropes: {
          connect: { id: tropeId }
        }
      }
    });

    return res.status(200).json({ message: 'Trope marcada como favorita com sucesso' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao marcar a trope como favorita' });
  }
};
