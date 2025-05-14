// /src/index.ts

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import { authMiddleware } from './middleware/authMiddleware'; 
import { seedTropes } from './services/tropeService';

// carrega as variáveis de ambiente 
dotenv.config();

// inicia o app 
const app = express();

// pega as tropes 
seedTropes().catch(() => {});

// Middleware - só o front pode acessar
app.use(cors({
  origin: process.env.FRONTEND_URL, 
  credentials: true,
}));
// limite de 10mb de JSON 
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rotas 
app.use('/api', routes); // Usando o arquivo de rotas combinado

// pra que isso?????
app.get('/health', (_, res) => {
  res.status(200).json({ status: 'ok' });
});

// onde está rodando
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});