import { useState } from 'react';
import { 
  Box, Input, Button, SimpleGrid, Image, Text, 
  Heading, Flex, Spinner, useToast, Container 
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { bookApi } from '../services/api';
import AutomatedRecommendations from './AutomatedRecommendations';

interface Book {
  googleBookId: string;
  title: string;
  author: string;
  coverUrl: string | null;
}

export default function BookSearch() {
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setBooks([]);
    
    try {
      console.log(`Searching for: ${query}`);
      const results = await bookApi.search(query);
      console.log('Search results:', results);
      
      if (!results || !results.items || results.items.length === 0) {
        console.log('No books found in search results');
        toast({
          title: "Sem resultados",
          description: "Nenhum livro encontrado. Tente outros termos de busca.",
          status: "info",
          duration: 5000,
          isClosable: true,
          position: "top"
        });
        setBooks([]);
      } else {
        // filtra itens invalidos 
        const validBooks = results.items.filter((book: any) => book && book.googleBookId && book.title);
        console.log(`Found ${validBooks.length} valid books`);
        setBooks(validBooks);
        
        if (validBooks.length === 0) {
          toast({
            title: "Sem resultados",
            description: "Nenhum livro encontrado. Tente outros termos de busca.",
            status: "info",
            duration: 5000,
            isClosable: true,
            position: "top"
          });
        }
      }
    } catch (error) {
      console.error('Error searching books:', error);
      toast({
        title: "Erro na busca",
        description: "Não foi possível realizar a busca. Tente novamente mais tarde.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top"
      });
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="container.xl" py={6}>
      <Box mb={10}>
        <Heading 
          size="xl" 
          mb={6}
          textAlign="center"
          bgGradient="linear(to-r, purple.400, pink.400)"
          bgClip="text"
        >
          Encontre seu próximo livro favorito
        </Heading>
        
        <Flex maxW="600px" mx="auto">
          <Input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busque por título, autor ou assunto..."
            size="lg"
            mr={2}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button 
            leftIcon={<SearchIcon />}
            colorScheme="purple" 
            size="lg" 
            onClick={handleSearch}
            isLoading={loading}
          >
            Buscar
          </Button>
        </Flex>
      </Box>

      {loading && (
        <Box display="flex" justifyContent="center" mt={10}>
          <Spinner size="xl" color="purple.500" />
        </Box>
      )}

      {!loading && books.length > 0 && (
        <Box mt={8}>
          <Heading size="lg" mb={4}>Resultados da Busca</Heading>
          <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 6 }} spacing={6}>
            {books.map((book) => (
              <Box
                key={book.googleBookId || `book-${Math.random()}`}
                borderRadius="lg"
                overflow="hidden"
                bg="white"
                boxShadow="md"
                transition="all 0.3s"
                _hover={{ transform: "translateY(-5px)", boxShadow: "lg" }}
                onClick={() => book.googleBookId && navigate(`/books/${book.googleBookId}`)}
                cursor="pointer"
              >
                <Box 
                  p={3} 
                  bg="gray.50" 
                  height="180px" 
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
                
                <Box p={4}>
                  <Text fontWeight="semibold" noOfLines={2} mb={1}>
                    {book.title}
                  </Text>
                  <Text fontSize="sm" color="gray.600" noOfLines={1}>
                    {book.author}
                  </Text>
                </Box>
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      )}

      {/* mostra as recomendações automáticas msm sem resultados */}
      {!loading && (books.length === 0 || !query.trim()) && (
        <AutomatedRecommendations />
      )}
    </Container>
  );
}
