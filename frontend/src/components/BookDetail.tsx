import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Button, Flex, Heading, Text, Image, VStack, HStack,
  Spinner, useToast, Badge, Divider, Icon, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure,
  FormControl, FormLabel, Textarea, Select, Center, useColorModeValue, 
  ModalFooter, Input, Avatar 
} from '@chakra-ui/react';
import { StarIcon, AddIcon, CheckIcon, ChevronLeftIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { FaHeart, FaRegHeart, FaUserFriends, FaShare } from 'react-icons/fa';
import { MdBookmarkBorder, MdBookmark } from 'react-icons/md';
import { bookApi, userApi, notificationApi } from '../services/api';
import { auth } from '../firebase/config'; 

interface User {
  id: string;
  email: string;
  username: string;
  profilePicture?: string;
}

interface BookDetail {
  id: string;
  googleBookId: string;
  title: string;
  author: string;
  description: string;
  coverUrl: string | null;
  publishedDate: string | null;
  pageCount: number | null;
  categories: string[];
  isbn: string | null;
  ratings: {
    rating: number;
    review: string | null;
    user: {
      email: string;
      username: string; 
    };
    createdAt: string;
  }[];
}

// Also define interfaces for favorite and reading list items
interface BookListItem {
  googleBookId: string;
}

export default function BookDetail() {
  const { googleBookId } = useParams<{ googleBookId: string }>();
  const [book, setBook] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInReadingList, setIsInReadingList] = useState(false);
  const [isInHistory, setIsInHistory] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [review, setReview] = useState('');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [followedUsers, setFollowedUsers] = useState<string[]>([]); 
  const [followingUsers, setFollowingUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const { 
    isOpen: isShareOpen, 
    onOpen: onShareOpen, 
    onClose: onShareClose 
  } = useDisclosure();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const {
    isOpen: isRemoveConfirmOpen,
    onOpen: onRemoveConfirmOpen,
    onClose: onRemoveConfirmClose
  } = useDisclosure();
  
  const toast = useToast();
  const navigate = useNavigate();

  const bgColor = useColorModeValue('white', 'gray.800');
  const cardShadow = useColorModeValue('lg', 'dark-lg');
  
  const stripHtmlTags = (html: string) => {
    return html.replace(/<[^>]*>/g, '');
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!googleBookId) return;
      
      try {
        setLoading(true);
        const bookData = await bookApi.getDetails(googleBookId);
        setBook(bookData);
        
        // vê se já leu o livro 
        if (bookData.ratings && bookData.ratings.length > 0) {
          // pega o email da autenticação
          const currentUserEmail = auth.currentUser?.email;
          
          // acha a avaliação do user
          const currentUserRating = bookData.ratings.find((rating: { 
            user: { email: string; }; 
            rating: number;
            review: string | null;
          }) => 
            rating.user && rating.user.email === currentUserEmail
          );
          
          if (currentUserRating) {
            setUserRating(currentUserRating.rating);
            setReview(currentUserRating.review || '');
            setIsInHistory(true); 
          } else {
            // Reseta os valores se n tiver desse user 
            setUserRating(0);
            setReview('');
            setIsInHistory(false);
          }
        } else {
          // livros sem avaliação
          setUserRating(0);
          setReview('');
          setIsInHistory(false);
        }
        
        try {
          // favoritos 
          // não mostra erros p quem acabou de criar conta no site 
          const favorites = await bookApi.getUserFavorites();
          setIsFavorite(favorites.some((fav: BookListItem) => fav.googleBookId === googleBookId));
        } catch (error) {
          console.error('Could not fetch favorites - likely a new user:', error);
          setIsFavorite(false);
        }

        try {
          // lista de leitura 
          // não mostra erros p quem acabou de criar conta no site 
          const readingList = await bookApi.getUserReadingList();
          setIsInReadingList(readingList.some((item: BookListItem) => item.googleBookId === googleBookId));
        } catch (error) {
          console.error('Could not fetch reading list - likely a new user:', error);
          setIsInReadingList(false);
        }

        try {
          // quem tá seguindo 
          const following = await userApi.getFollowing();
          setFollowedUsers(following.map((user: User) => user.username)); 
        } catch (error) {
          console.error('Could not fetch following - likely a new user:', error);
          setFollowedUsers([]);
        }
      } catch (error) {
        console.error('Error fetching book details:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os detalhes do livro.",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "top"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [googleBookId, toast]);

  useEffect(() => {
    const fetchFollowing = async () => {
      try {
        const following = await userApi.getFollowing();
        setFollowingUsers(following);
        setFilteredUsers(following);
      } catch (error) {
        console.error('Error fetching following users:', error);
      }
    };
    
    fetchFollowing();
  }, []);
  
  // reseta o estado do modal de compartilhar - p mostrar os users novamente qdo eu n escolho um 
  const resetShareModalState = () => {
    setSearchUsername('');
    setSelectedUser('');
    setShareMessage('');
    setFilteredUsers(followingUsers); 
  };

  // resta o modal quaando fecha 
  const handleShareModalClose = () => {
    resetShareModalState();
    onShareClose();
  };

  // seleção de user no modal 
  const handleUserSelect = (userId: string, username: string) => {
    setSelectedUser(userId);
    setSearchUsername(username);
    setFilteredUsers([]); 
  };

  const handleShareBook = async () => {
    if (!book || !selectedUser) return;
    
    try {
      setIsSharing(true);
      
      await notificationApi.shareBook(
        book.googleBookId,
        selectedUser,
        shareMessage || `Olha esse livro que eu encontrei: ${book.title}`
      );
      
      onShareClose();
      resetShareModalState();
      
      toast({
        title: "Livro compartilhado com sucesso",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top"
      });
    } catch (error) {
      console.error('Error sharing book:', error);
      
      toast({
        title: "Erro",
        description: "Não foi possível compartilhar o livro. Tente novamente.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top"
      });
    } finally {
      setIsSharing(false);
    }
  };

  // mostra a avaliação de quem vc segue primeiro 
  const sortedRatings = book?.ratings ? [...book.ratings].sort((a, b) => {
    const aIsFollowed = followedUsers.includes(a.user.username);
    const bIsFollowed = followedUsers.includes(b.user.username);
    
    if (aIsFollowed && !bIsFollowed) return -1; 
    if (!aIsFollowed && bIsFollowed) return 1;  
    
    // se vc segue varias pessoas, organiza por data
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }) : [];

  const handleToggleFavorite = async () => {
    if (!book) return;
    
    try {
      await bookApi.toggleFavorite(book.googleBookId);
      setIsFavorite(!isFavorite);
      
      toast({
        title: isFavorite ? "Removido dos favoritos" : "Adicionado aos favoritos",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top"
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os favoritos.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top"
      });
    }
  };

  const handleAddToHistory = async () => {
    if (!book || userRating === 0) return;
    
    try {
      await bookApi.addToHistory(book.googleBookId, userRating, review);
      
      setIsInHistory(true);
      
      toast({
        title: isInHistory ? "Atualizado com sucesso" : "Registrado com sucesso",
        description: isInHistory ? "Livro atualizado no seu histórico de leitura." : "Livro adicionado ao seu histórico de leitura.",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top"
      });
      
      onClose();
    } catch (error) {
      console.error('Error adding to history:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o livro ao histórico.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top"
      });
    }
  };

  const handleRemoveFromHistory = async () => {
    if (!book) return;
    
    try {
      await bookApi.removeFromHistory(book.googleBookId);
      
      setIsInHistory(false);
      setUserRating(0);
      setReview('');
      
      toast({
        title: "Removido da estante",
        description: "Livro removido do seu histórico de leitura.",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top"
      });
    } catch (error) {
      console.error('Error removing from history:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o livro da estante.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top"
      });
    }
  };

  const handleToggleReadingList = async () => {
    if (!book) return;
    
    try {
      await bookApi.toggleReadingList(book.googleBookId);
      setIsInReadingList(!isInReadingList);
      
      toast({
        title: isInReadingList ? "Removido da lista de leitura" : "Adicionado à lista de leitura",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top"
      });
    } catch (error) {
      console.error('Error toggling reading list:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a lista de leitura.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top"
      });
    }
  };

  const handleEstanteClick = () => {
    if (isInHistory) {
      // se tá no historico, abre o modal de confirmação de exclusão
      onRemoveConfirmOpen();
    } else {
      // se n está no historico, abre o modal p add 
      onOpen();
    }
  };

  if (loading) {
    return (
      <Center h="50vh">
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="purple.500"
          size="xl"
        />
      </Center>
    );
  }

  if (!book) {
    return (
      <Box p={5} textAlign="center">
        <Heading size="lg">Livro não encontrado</Heading>
        <Button mt={4} onClick={() => navigate('/search')}>
          Voltar para busca
        </Button>
      </Box>
    );
  }

  return (
    <Box maxW="1200px" mx="auto" p={5}>
      <Button 
        leftIcon={<ChevronLeftIcon />} 
        onClick={() => navigate(-1)}
        mb={6}
        variant="ghost"
        color="purple.600"
        _hover={{ bg: 'purple.50' }}
      >
        Voltar
      </Button>

      <Box 
        bg={bgColor} 
        borderRadius="lg" 
        overflow="hidden" 
        boxShadow={cardShadow}
        p={{ base: 4, md: 6 }}
      >
        <Flex 
          direction={{ base: 'column', md: 'row' }} 
          gap={{ base: 6, md: 10 }}
        >
          {/* Book Cover */}
          <Center 
            minW={{ base: '100%', md: '250px' }} 
            maxH="380px" 
            bg="gray.50"
            borderRadius="md"
            p={3}
          >
            {book.coverUrl ? (
              <Image 
                src={book.coverUrl} 
                alt={book.title}
                maxH="100%"
                objectFit="contain"
                borderRadius="md"
                boxShadow="md"
              />
            ) : (
              <Box 
                width="180px" 
                height="280px" 
                bg="gray.200" 
                display="flex" 
                alignItems="center" 
                justifyContent="center"
                borderRadius="md"
              >
                <Text color="gray.500">Sem capa</Text>
              </Box>
            )}
          </Center>

          {/* Book Info */}
          <VStack align="start" flex="1" spacing={4}>
            <Heading size="xl">{book.title}</Heading>
            
            <Heading size="md" fontWeight="normal" color="gray.700">
              {book.author}
            </Heading>
            
            <HStack spacing={4}>
              {book.publishedDate && (
                <Badge colorScheme="purple" px={3} py={1} borderRadius="full">
                  {book.publishedDate.split('-')[0]}
                </Badge>
              )}
              
              {book.pageCount && (
                <Badge colorScheme="blue" px={3} py={1} borderRadius="full">
                  {book.pageCount} páginas
                </Badge>
              )}

              {book.isbn && (
                <Badge colorScheme="gray" px={3} py={1} borderRadius="full">
                  ISBN: {book.isbn}
                </Badge>
              )}
            </HStack>

            {book.categories && book.categories.length > 0 && (
              <Box>
                <HStack spacing={2} flexWrap="wrap">
                  {book.categories.map((category, index) => (
                    <Badge 
                      key={index} 
                      bg="purple.100" 
                      color="purple.800" 
                      borderRadius="full"
                      px={2} 
                      py={1} 
                      fontSize="xs"
                      mb={2}
                    >
                      {category}
                    </Badge>
                  ))}
                </HStack>
              </Box>
            )}
            
            <Divider />
            
            <Box width="100%">
              <Box 
                maxH={isDescriptionExpanded ? "200px" : "auto"} 
                overflowY={isDescriptionExpanded ? "auto" : "hidden"}
                pr={isDescriptionExpanded ? 2 : 0}
              >
                <Text 
                  fontSize="md" 
                  noOfLines={isDescriptionExpanded ? undefined : 6} 
                  color="gray.700"
                  textAlign="left"
                >
                  {book.description ? stripHtmlTags(book.description) : "Sem descrição disponível."}
                </Text>
              </Box>
              {book.description && book.description.length > 300 && (
                <Button 
                  variant="link" 
                  colorScheme="purple" 
                  size="sm" 
                  mt={1}
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  rightIcon={isDescriptionExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                >
                  {isDescriptionExpanded ? "Ler menos" : "Ler mais"}
                </Button>
              )}
            </Box>
            
            <Divider />
            
            <HStack spacing={4} wrap="wrap">
              <Button
                leftIcon={isInHistory ? <CheckIcon /> : <AddIcon />}
                colorScheme={isInHistory ? "purple" : "gray"}
                variant={isInHistory ? "solid" : "outline"}
                onClick={handleEstanteClick}
                mb={2}
              >
                {isInHistory ? "Adicionado à Estante" : "Adicionar à Estante"}
              </Button>
              
              <Button
                colorScheme={isFavorite ? "pink" : "gray"}
                variant={isFavorite ? "solid" : "outline"}
                leftIcon={isFavorite ? <Icon as={FaHeart} /> : <Icon as={FaRegHeart} />}
                onClick={handleToggleFavorite}
                mb={2}
              >
                {isFavorite ? "Favorito" : "Favoritar"}
              </Button>
              
              <Button
                colorScheme={isInReadingList ? "blue" : "gray"}
                variant={isInReadingList ? "solid" : "outline"}
                leftIcon={isInReadingList ? <Icon as={MdBookmark} /> : <Icon as={MdBookmarkBorder} />}
                onClick={handleToggleReadingList}
                mb={2}
              >
                {isInReadingList ? "Na Lista" : "Quero Ler"}
              </Button>
              
              <Button
                leftIcon={<Icon as={FaShare} />}
                colorScheme="teal"
                variant="outline"
                onClick={onShareOpen}
                mb={2}
              >
                Compartilhar
              </Button>
            </HStack>
          </VStack>
        </Flex>
      </Box>
      
      <Box mt={10}>
        <Heading size="lg" mb={4}>
          Avaliações
        </Heading>
        
        {sortedRatings && sortedRatings.length > 0 ? (
          <VStack spacing={4} align="stretch">
            {sortedRatings.map((rating, index) => {
              const isFollowed = followedUsers.includes(rating.user.username);
              
              return (
                <Box 
                  key={index}
                  p={4}
                  bg={isFollowed ? "purple.50" : bgColor}
                  borderRadius="md"
                  boxShadow="sm"
                  borderLeft={isFollowed ? "4px solid" : "none"}
                  borderLeftColor="purple.400"
                >
                  <Flex justify="space-between" mb={2}>
                    <HStack>
                      <Text fontWeight="bold">@{rating.user.username}</Text>
                      {isFollowed && (
                        <Badge colorScheme="purple" display="flex" alignItems="center">
                          <Icon as={FaUserFriends} mr={1} fontSize="xs" /> Seguindo
                        </Badge>
                      )}
                      <HStack>
                        {Array(5).fill('').map((_, i) => (
                          <StarIcon 
                            key={i} 
                            color={i < rating.rating ? 'yellow.400' : 'gray.300'} 
                          />
                        ))}
                      </HStack>
                    </HStack>
                    <Text fontSize="sm" color="gray.500">
                      {new Date(rating.createdAt).toLocaleDateString()}
                    </Text>
                  </Flex>
                  {rating.review && <Text textAlign="left">{rating.review}</Text>}
                </Box>
              );
            })}
          </VStack>
        ) : (
          <Box p={5} bg="gray.50" borderRadius="md" textAlign="center">
            <Text>Este livro ainda não possui avaliações.</Text>
          </Box>
        )}
      </Box>
      
      {/* modal de add no historico */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Adicionar à sua estante</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl mb={4} isRequired>
              <FormLabel>Sua avaliação</FormLabel>
              <Select 
                placeholder="Selecione uma nota" 
                value={userRating}
                onChange={(e) => setUserRating(Number(e.target.value))}
              >
                <option value="1">1 - Muito ruim</option>
                <option value="2">2 - Ruim</option>
                <option value="3">3 - Regular</option>
                <option value="4">4 - Bom</option>
                <option value="5">5 - Excelente</option>
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel>Sua opinião (opcional)</FormLabel>
              <Textarea 
                placeholder="Compartilhe o que você achou deste livro..."
                value={review}
                onChange={(e) => setReview(e.target.value)}
              />
            </FormControl>
            
            <Button
              mt={6}
              colorScheme="purple"
              leftIcon={<CheckIcon />}
              onClick={handleAddToHistory}
              isDisabled={userRating === 0}
              width="full"
            >
              Salvar
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* modal de compartilhar */}
      <Modal isOpen={isShareOpen} onClose={handleShareModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Compartilhar com um amigo</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl mb={4} isRequired>
              <FormLabel>Buscar e selecionar usuário: <span style={{ color: 'red' }}>*</span></FormLabel>
              <Box position="relative">
                <Input 
                  placeholder="Digite o nome de usuário..."
                  value={searchUsername}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchUsername(value);
                    
                    if (!selectedUser || value !== followingUsers.find(u => u.id === selectedUser)?.username) {
                      if (!value.trim()) {
                        setFilteredUsers(followingUsers);
                      } else {
                        const filtered = followingUsers.filter(user => 
                          user.username.toLowerCase().includes(value.toLowerCase())
                        );
                        setFilteredUsers(filtered);
                      }
                    }

                    if (!value.trim()) {
                      setSelectedUser('');
                    }
                  }}
                  mb={filteredUsers.length > 0 && searchUsername && !selectedUser ? 0 : 3}
                  onClick={() => {
                    if (!selectedUser) {
                      if (searchUsername) {
                        const filtered = followingUsers.filter(user => 
                          user.username.toLowerCase().includes(searchUsername.toLowerCase())
                        );
                        setFilteredUsers(filtered);
                      } else {
                        setFilteredUsers(followingUsers);
                      }
                    }
                  }}
                />
                
                {searchUsername && filteredUsers.length > 0 && !selectedUser && (
                  <Box 
                    position="absolute" 
                    zIndex="dropdown"
                    bg="white"
                    width="100%" 
                    mt={1}
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="md"
                    boxShadow="md"
                    maxH="200px"
                    overflowY="auto"
                  >
                    {filteredUsers.map(user => (
                      <HStack 
                        key={user.id} 
                        p={3} 
                        _hover={{ bg: "purple.50" }}
                        cursor="pointer"
                        bg={selectedUser === user.id ? "purple.100" : "white"}
                        onClick={() => handleUserSelect(user.id, user.username)}
                      >
                        <Avatar size="sm" name={user.username} src={user.profilePicture} />
                        <Text>@{user.username}</Text>
                      </HStack>
                    ))}
                  </Box>
                )}
              </Box>
              
              {searchUsername && filteredUsers.length === 0 && !selectedUser && (
                <Text color="red.500" fontSize="sm" mt={2}>
                  Nenhum usuário encontrado com esse nome
                </Text>
              )}
              
              {selectedUser && (
                <HStack mt={3} p={2} borderWidth="1px" borderRadius="md" bg="purple.50">
                  <Avatar size="sm" name={followingUsers.find(u => u.id === selectedUser)?.username} 
                          src={followingUsers.find(u => u.id === selectedUser)?.profilePicture} />
                  <Text>@{followingUsers.find(u => u.id === selectedUser)?.username}</Text>
                </HStack>
              )}
            </FormControl>
            
            <FormControl>
              <FormLabel>Mensagem (opcional):</FormLabel>
              <Textarea 
                placeholder="Adicione uma mensagem personalizada..."
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
              />
            </FormControl>
          </ModalBody>
          
          <ModalFooter>
            <Button mr={3} onClick={handleShareModalClose}>Cancelar</Button>
            <Button
              colorScheme="teal"
              onClick={handleShareBook}
              isLoading={isSharing}
              isDisabled={!selectedUser}
            >
              Compartilhar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* modal de exclusão */}
      <Modal isOpen={isRemoveConfirmOpen} onClose={onRemoveConfirmClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Remover da Estante</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text>
              Tem certeza que deseja remover "{book?.title}" da sua estante?
            </Text>
            <Text mt={2} fontSize="sm" color="gray.600">
              Sua avaliação e comentários sobre este livro serão excluídos.
            </Text>
          </ModalBody>
          
          <ModalFooter>
            <Button mr={3} onClick={onRemoveConfirmClose}>
              Cancelar
            </Button>
            <Button 
              colorScheme="red" 
              onClick={() => {
                handleRemoveFromHistory();
                onRemoveConfirmClose();
              }}
            >
              Remover
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
