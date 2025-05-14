import { useState, useEffect } from 'react';
import {
  Box, Heading, Text, Image, SimpleGrid, VStack,
  Spinner, useToast, Button, Flex, Divider
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { recommendationApi, bookApi, preferenceApi } from '../services/api';

interface Recommendation {
  googleBookId?: string;
  title: string;
  author: string;
  description: string;
  coverUrl?: string;
}

export default function AutomatedRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasUserActivity, setHasUserActivity] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserActivity = async () => {
      try {
        // checa se as recomendações estão on 
        let settings;
        try {
          settings = await recommendationApi.getRecommendationSettings();
        } catch (settingsError) {
          console.error('Error fetching recommendation settings:', settingsError);
          // Ignora erros 404 ou similares quando o usuário ainda não configurou
          setLoading(false);
          return;
        }
        
        if (!settings?.automatedRecommendationsEnabled) {
          setLoading(false);
          return;
        }

        // vê se o user tem avaliações ou preferências 
        const userHistory = await bookApi.getUserHistory();
        const userPreferences = await preferenceApi.getUserPreferences();
        
        const hasRatedBooks = userHistory && userHistory.length > 0;
        const hasPreferences = userPreferences && (
          (userPreferences.likedTropes && userPreferences.likedTropes.length > 0) || 
          (userPreferences.dislikedTropes && userPreferences.dislikedTropes.length > 0) || 
          (userPreferences.likedCategories && userPreferences.likedCategories.length > 0) || 
          (userPreferences.dislikedCategories && userPreferences.dislikedCategories.length > 0) || 
          (userPreferences.likedAuthors && userPreferences.likedAuthors.length > 0) || 
          (userPreferences.dislikedAuthors && userPreferences.dislikedAuthors.length > 0)
        );

        // só continua se tem avaliações/preferências 
        if (hasRatedBooks || hasPreferences) {
          setHasUserActivity(true);
          fetchRecommendations();
        } else {
          setHasUserActivity(false);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking user activity:', error);
        setLoading(false);
      }
    };

    const fetchRecommendations = async () => {
      try {
        const data = await recommendationApi.getAutomatedRecommendations();
        if (Array.isArray(data)) {
          setRecommendations(data);
        } else {
          console.error('Recommendations data is not an array:', data);
          // Apenas define o erro interno sem mostrar toast
          setError(null);
        }
      } catch (recommendationsError) {
        console.error('Error fetching recommendations data:', recommendationsError);
        // Não mostrar erro para usuário novo, apenas retornar silenciosamente
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    checkUserActivity();
  }, []);

  // handler para setar preferências 
  const handleSetPreferences = () => {
    navigate('/profile');
  };

  if (loading) {
    return (
      <Box textAlign="center" py={6}>
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="purple.500"
          size="xl"
        />
        <Text mt={4}>Verificando recomendações personalizadas...</Text>
      </Box>
    );
  }

  if (!hasUserActivity) {
    return (
      <Box py={8} textAlign="center">
        <Heading 
          size="lg" 
          mb={4}
          bgGradient="linear(to-r, purple.400, pink.400)"
          bgClip="text"
        >
          Recomendações Personalizadas
        </Heading>
        <Text mb={6} color="gray.600">
          Para receber recomendações personalizadas, você precisa avaliar livros ou definir suas preferências de leitura.
        </Text>
        <Button
          colorScheme="purple"
          onClick={handleSetPreferences}
        >
          Definir Preferências de Leitura
        </Button>
      </Box>
    );
  }

  // Modificar para não mostrar mensagens de erro
  if (error) {
    return null; // Não exibir mensagem de erro
  }

  if (recommendations.length === 0) {
    return null; // não renderiza nada se n tem preferência ou avaliação
  }

  const handleBookClick = (book: Recommendation) => {
    if (!book.googleBookId) {
      toast({
        title: "Informação do livro indisponível",
        description: "Não foi possível encontrar detalhes para este livro no momento.",
        status: "warning",
        duration: 3000,
        position: "top",
      });
      return;
    }
    
    navigate(`/books/${book.googleBookId}`);
  };

  return (
    <Box py={8}>
      <Heading 
        size="lg" 
        mb={6}
        bgGradient="linear(to-r, purple.400, pink.400)"
        bgClip="text"
      >
        Recomendações Para Você
      </Heading>
      
      <SimpleGrid columns={{ base: 2, md: 3, lg: 5 }} spacing={6}>
        {recommendations.map((book, index) => (
          <Box
            key={book.googleBookId || index}
            borderRadius="lg"
            overflow="hidden"
            bg="white"
            boxShadow="md"
            transition="all 0.3s"
            _hover={{ transform: "translateY(-5px)", boxShadow: "lg" }}
            onClick={() => book.googleBookId ? handleBookClick(book) : null}
            cursor={book.googleBookId ? "pointer" : "default"}
            height="100%"
          >
            <Flex direction="column" height="100%">
              <Box 
                p={3} 
                bg="gray.50" 
                height="200px" 
                display="flex" 
                alignItems="center" 
                justifyContent="center"
              >
                {book.coverUrl ? (
                  <Image
                    src={book.coverUrl}
                    alt={book.title}
                    maxHeight="100%"
                    objectFit="contain"
                  />
                ) : (
                  <Box
                    width="120px" 
                    height="180px" 
                    bg="gray.200" 
                    display="flex" 
                    alignItems="center" 
                    justifyContent="center"
                    borderRadius="sm"
                  >
                    <Text color="gray.500" fontSize="xs">Sem capa</Text>
                  </Box>
                )}
              </Box>
              
              <VStack p={4} spacing={1} align="start" flex="1">
                <Text fontWeight="bold" fontSize="sm" noOfLines={2}>
                  {book.title}
                </Text>
                
                <Text color="gray.600" fontSize="xs" noOfLines={1} mb={2}>
                  {book.author}
                </Text>
                
                <Divider mb={2} />
                
                <Text 
                  color="gray.700" 
                  fontSize="xs" 
                  noOfLines={4}
                  lineHeight="1.4"
                  css={{
                    display: '-webkit-box',
                    WebkitLineClamp: '4',
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {book.description ? book.description.replace(/<[^>]*>/g, '') : "Sem descrição disponível."}
                </Text>
              </VStack>
            </Flex>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
}
