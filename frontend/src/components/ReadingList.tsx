import { useEffect, useState } from 'react';
import {
  Box, Heading, Text, Image, SimpleGrid, VStack,
  Spinner, useToast, Button, Icon, Flex
} from '@chakra-ui/react';
import { MdBookmarkBorder } from 'react-icons/md';
import { bookApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface Book {
  id: string;
  googleBookId: string;
  title: string;
  author: string;
  coverUrl: string | null;
  publishedDate: string | null;
}

export default function ReadingList() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReadingList = async () => {
      try {
        const readingList = await bookApi.getUserReadingList();
        setBooks(readingList);
      } catch (error: unknown) {
        console.error('Error fetching reading list:', error);
        // mostra só o toast se o erro não for 404
        const isHttpError = error && typeof error === 'object' && 'response' in error;
        if (!isHttpError || (isHttpError && (error as any).response?.status !== 404)) {
          toast({
            title: "Erro",
            description: "Não foi possível carregar sua lista de leitura.",
            status: "error",
            duration: 5000,
            isClosable: true,
            position: "top"
          });
        }
        setBooks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReadingList();
  }, [toast]);

  const handleRemoveFromReadingList = async (e: React.MouseEvent, book: Book) => {
    e.stopPropagation(); 
    
    try {
      await bookApi.toggleReadingList(book.googleBookId);
      setBooks(books.filter(b => b.id !== book.id));
      
      toast({
        title: "Removido da lista de leitura",
        status: "success",
        duration: 3000,
        position: "top"
      });
    } catch (error) {
      console.error('Error removing from reading list:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover da lista de leitura.",
        status: "error",
        duration: 5000,
        position: "top"
      });
    }
  };

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
          Sua Lista de Leitura
        </Heading>
        <Text mb={6} color="gray.600">
          Você ainda não adicionou nenhum livro à sua lista de leitura
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
        Sua Lista de Leitura
      </Heading>

      <SimpleGrid columns={{ base: 2, md: 3, lg: 5 }} spacing={6}>
        {books.map(book => (
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
            <Button
              size="sm"
              position="absolute"
              top="5px"
              right="5px"
              borderRadius="full"
              colorScheme="blue"
              onClick={(e) => handleRemoveFromReadingList(e, book)}
              zIndex={2}
              width="32px"
              height="32px"
              p="0"
              minWidth="0"
            >
              <Icon as={MdBookmarkBorder} boxSize={4} />
            </Button>
            
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
                
                <Text color="gray.600" fontSize="xs" noOfLines={1}>
                  {book.author}
                </Text>
                
                {book.publishedDate && (
                  <Text color="gray.500" fontSize="xs">
                    {book.publishedDate.split('-')[0]}
                  </Text>
                )}
              </VStack>
            </Flex>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
}
