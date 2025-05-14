import { useEffect, useState } from 'react';
import {
  Box, Heading, Text, Image, SimpleGrid, VStack,
  Spinner, HStack, useToast, Button, Flex
} from '@chakra-ui/react';
import { StarIcon } from '@chakra-ui/icons';
import { bookApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface BookHistory {
  id: string;
  googleBookId: string;
  title: string;
  author: string;
  coverUrl: string | null;
  ratings: {
    rating: number;
    review: string | null;
    createdAt: string;
  }[];
}

export default function ReadHistory() {
  const [books, setBooks] = useState<BookHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReadHistory = async () => {
      try {
        const history = await bookApi.getUserHistory();
        setBooks(history);
      } catch (error) {
        console.error('Error fetching read history:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar seu histórico de leitura.",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "top"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReadHistory();
  }, [toast]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" h="50vh">
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="purple.500"
          size="xl"
        />
      </Box>
    );
  }

  if (books.length === 0) {
    return (
      <Box p={6} textAlign="center">
        <Heading 
          size="lg" 
          mb={4} 
          bgGradient="linear(to-r, purple.400, pink.400)" 
          bgClip="text"
        >
          Seu Histórico de Leitura
        </Heading>
        <Text mb={6} color="gray.600">
          Você ainda não adicionou nenhum livro ao seu histórico
        </Text>
        <Button 
          colorScheme="purple" 
          onClick={() => navigate('/search')}
        >
          Explorar Livros
        </Button>
      </Box>
    );
  }

  return (
    <Box p={6} maxW="1200px" mx="auto">
      <Heading 
        size="xl" 
        mb={8} 
        bgGradient="linear(to-r, purple.400, pink.400)" 
        bgClip="text"
        textAlign="center"
      >
        Seu Histórico de Leitura
      </Heading>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {books.map(book => {
          const userRating = book.ratings?.[0];
          
          return (
            <Box
              key={book.id}
              borderRadius="lg"
              overflow="hidden"
              bg="white"
              boxShadow="md"
              transition="all 0.3s"
              _hover={{ transform: "translateY(-5px)", boxShadow: "lg" }}
              onClick={() => navigate(`/books/${book.googleBookId}`)}
              cursor="pointer"
              height="100%"
              position="relative"
            >
              <Flex>
                <Box p={3} bg="gray.50" width="120px" height="180px" display="flex" alignItems="center" justifyContent="center">
                  {book.coverUrl ? (
                    <Image
                      src={book.coverUrl}
                      alt={book.title}
                      maxHeight="100%"
                      objectFit="contain"
                    />
                  ) : (
                    <Box
                      width="100px" 
                      height="150px" 
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
                
                <VStack p={4} spacing={2} align="start" flex="1">
                  <Text fontWeight="bold" fontSize="md" noOfLines={2}>
                    {book.title}
                  </Text>
                  
                  <Text color="gray.600" fontSize="sm" noOfLines={1}>
                    {book.author}
                  </Text>
                  
                  {userRating && (
                    <>
                      <HStack spacing={1} mt={1}>
                        {Array(5).fill('').map((_, i) => (
                          <StarIcon 
                            key={i} 
                            color={i < userRating.rating ? 'yellow.400' : 'gray.300'} 
                            boxSize={3}
                          />
                        ))}
                      </HStack>
                      
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        Lido em {new Date(userRating.createdAt).toLocaleDateString()}
                      </Text>
                    </>
                  )}
                </VStack>
              </Flex>
              
              {userRating?.review && (
                <Box p={3} borderTop="1px solid" borderColor="gray.100">
                  <Text fontSize="sm" color="gray.600" noOfLines={2}>
                    "{userRating.review}"
                  </Text>
                </Box>
              )}
            </Box>
          );
        })}
      </SimpleGrid>
    </Box>
  );
}
