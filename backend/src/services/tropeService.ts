import { prisma } from '../models/prismaClient';

interface TropeData {
  name: string;
  description: string;
  category: 'Romance' | 'SciFiFantasy' | 'Drama';
}

const tropesData: TropeData[] = [
  // tropes de romance
  { name: "Enemies to Lovers", description: "Inimigos que se apaixonam", category: "Romance" },
  { name: "Friends to Lovers", description: "Amigos que viram casal", category: "Romance" },
  { name: "Fake Dating", description: "Relacionamento de mentira que vira real", category: "Romance" },
  { name: "Grumpy x Sunshine", description: "Mal-humorado com pessoa radiante", category: "Romance" },
  { name: "Forced Proximity", description: "Obrigados a conviver juntos — tipo viagem ou confinamento", category: "Romance" },
  { name: "Only One Bed", description: "Só tem uma cama! e agora?...", category: "Romance" },
  { name: "Love Triangle", description: "Triângulo amoroso", category: "Romance" },
  { name: "Second Chance Romance", description: "Reconciliação com ex ou amor antigo", category: "Romance" },
  { name: "Slow Burn", description: "Relacionamento que demora a acontecer", category: "Romance" },
  { name: "Forbidden Love", description: "Amor proibido — por regras, família, sociedade etc.", category: "Romance" },
  { name: "Childhood Friends", description: "Amizade de infância que vira romance", category: "Romance" },
  { name: "Marriage of Convenience", description: "Casamento por contrato ou interesse", category: "Romance" },
  { name: "Soulmates", description: "Almas gêmeas ou destino", category: "Romance" },
  { name: "Age Gap", description: "Diferença de idade considerável", category: "Romance" },
  { name: "Workplace Romance", description: "Romance no trabalho", category: "Romance" },
  { name: "Opposites Attract", description: "Personalidades opostas se atraem", category: "Romance" },
  { name: "Mutual Pining", description: "Ambos apaixonados, mas sem saber do outro", category: "Romance" },
  
  // tropes de sci/fi ou fantasia 
  { name: "Chosen One", description: "O escolhido pra salvar o mundo", category: "SciFiFantasy" },
  { name: "Found Family", description: "Grupo que vira uma família real, mesmo sem laços de sangue", category: "SciFiFantasy" },
  { name: "Dystopian Society", description: "Sociedade distópica/controladora", category: "SciFiFantasy" },
  { name: "Time Travel", description: "Viagem no tempo", category: "SciFiFantasy" },
  { name: "Parallel Worlds", description: "Mundos paralelos ou alternativos", category: "SciFiFantasy" },
  { name: "Post-Apocalyptic Survival", description: "Sobrevivência após o fim do mundo", category: "SciFiFantasy" },
  { name: "Space Romance", description: "Amor entre as estrelas, literalmente", category: "SciFiFantasy" },
  { name: "Superpowered Romance", description: "Um ou ambos com poderes", category: "SciFiFantasy" },
  { name: "Artificial Intelligence Love", description: "Romance com IA/androides", category: "SciFiFantasy" },
  { name: "Royal x Rebel", description: "Membro da realeza se apaixona por alguém do povo ou rebelde", category: "SciFiFantasy" },
  
  // tropes de drama 
  { name: "Unreliable Narrator", description: "Narrador que mente ou distorce a história", category: "Drama" },
  { name: "Dual Timeline", description: "Duas linhas temporais entrelaçadas", category: "Drama" },
  { name: "Revenge Plot", description: "Trama de vingança", category: "Drama" },
  { name: "Mystery Lover", description: "Um dos dois tem um segredo perigoso", category: "Drama" },
  { name: "Coming of Age", description: "Amadurecimento e descobertas da juventude", category: "Drama" },
  { name: "Redemption Arc", description: "Personagem busca redenção", category: "Drama" },
  { name: "Whodunnit", description: "Quem é o culpado? estilo mistério", category: "Drama" },
];

export const seedTropes = async () => {
  try {
    // Create todas as tropes 
    for (const trope of tropesData) {
      await prisma.trope.upsert({
        where: { name: trope.name },
        update: {
          description: trope.description,
          category: trope.category
        },
        create: trope
      });
    }
  } catch (error) {
    // Mantém silêncio no caso de erro
  }
};

export const getAllTropes = async () => {
  return prisma.trope.findMany({
    orderBy: { name: 'asc' }
  });
};
