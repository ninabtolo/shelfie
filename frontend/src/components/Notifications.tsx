import { useState, useEffect } from 'react';
import {
  Box, VStack, Text, Badge, HStack, Avatar, Icon,
  Button, Flex, useToast, Spinner, Center, Container, Heading
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FaRegBell, FaBell, FaUserPlus, FaBook, FaCheck, FaUserCheck } from 'react-icons/fa';
import { notificationApi, userApi } from '../services/api';

// Add this interface for the user object
interface User {
  id: string;
  username: string;
  email: string;
  profilePicture?: string | null;
}

interface Notification {
  id: string;
  type: string; // 'FOLLOW' ou 'BOOK_SHARE'
  message: string;
  isRead: boolean;
  fromUser?: {
    id: string;
    username: string;
    profilePicture?: string | null;
  } | null;
  book?: {
    id: string;
    googleBookId: string;
    title: string;
    author: string;
    coverUrl?: string | null;
  } | null;
  createdAt: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await notificationApi.getUserNotifications();
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
        
        const following = await userApi.getFollowing();
        // Use type assertion to ensure TypeScript recognizes this as a Set<string>
        const followingIdSet = new Set(following.map((user: User) => user.id)) as Set<string>;
        setFollowingIds(followingIdSet);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as notificações',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationApi.markAsRead(notificationId);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => prev - 1);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      
      toast({
        title: 'Sucesso',
        description: 'Todas as notificações foram marcadas como lidas',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }
    
    if (notification.type === 'FOLLOW' && notification.fromUser) {
      navigate(`/user/${notification.fromUser.id}`);
    } else if (notification.type === 'BOOK_SHARE' && notification.book?.googleBookId) {
      navigate(`/books/${notification.book.googleBookId}`);
    }
  };

  const handleFollowUser = async (userId: string) => {
    try {
      await userApi.followUser(userId);
      setFollowingIds(prev => new Set([...prev, userId]));
      
      toast({
        title: 'Seguindo usuário',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error following user:', error);
      toast({
        title: 'Erro ao seguir usuário',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Container maxW="container.lg" py={6}>
      <Flex 
        direction={{ base: "column", sm: "row" }}
        justify={{ base: "center", sm: "space-between" }}
        align={{ base: "center", sm: "center" }}
        gap={3}
        mb={6}
      >
        <HStack mb={{ base: 2, sm: 0 }}>
          <Icon 
            as={unreadCount > 0 ? FaBell : FaRegBell} 
            color={unreadCount > 0 ? "purple.500" : "gray.500"} 
            boxSize={6}
          />
          <Heading size={{ base: "md", sm: "lg" }}>Notificações</Heading>
          {unreadCount > 0 && (
            <Badge colorScheme="purple" borderRadius="full" px={2}>
              {unreadCount}
            </Badge>
          )}
        </HStack>
        
        {unreadCount > 0 && (
          <Button 
            size="sm" 
            leftIcon={<FaCheck />} 
            onClick={handleMarkAllAsRead}
            colorScheme="purple"
            width={{ base: "full", sm: "auto" }}
          >
            Marcar todas como lidas
          </Button>
        )}
      </Flex>

      {loading ? (
        <Center h="300px">
          <Spinner size="xl" color="purple.500" />
        </Center>
      ) : notifications.length === 0 ? (
        <Box 
          p={10} 
          textAlign="center" 
          bg="white" 
          borderRadius="lg" 
          boxShadow="sm"
        >
          <Text color="gray.500">Você não tem notificações ainda</Text>
        </Box>
      ) : (
        <VStack spacing={3} align="stretch">
          {notifications.map(notification => (
            <Box
              key={notification.id}
              p={4}
              bg={notification.isRead ? "white" : "purple.50"}
              borderRadius="md"
              boxShadow="sm"
              cursor="pointer"
              _hover={{ boxShadow: "md" }}
              onClick={() => handleNotificationClick(notification)}
              borderLeft={notification.isRead ? undefined : "4px solid"}
              borderLeftColor="purple.400"
            >
              <HStack spacing={4} align="start">
                <Avatar 
                  size="md" 
                  src={notification.fromUser?.profilePicture || undefined} 
                  name={notification.fromUser?.username || 'User'} 
                  bg="purple.500"
                />
                
                <Box flex="1">
                  <Flex justify="space-between" align="center">
                    <HStack>
                      <Icon 
                        as={notification.type === 'FOLLOW' ? FaUserPlus : FaBook} 
                        color={notification.type === 'FOLLOW' ? "blue.500" : "green.500"}
                      />
                      <Text fontWeight="bold">
                        {notification.type === 'FOLLOW' ? 'Novo seguidor' : 'Recomendação de livro'}
                      </Text>
                    </HStack>
                    <Text fontSize="xs" color="gray.500">
                      {formatDate(notification.createdAt)}
                    </Text>
                  </Flex>
                  
                  <Box mt={1}>
                    <Text textAlign="left">
                      {notification.fromUser && (
                        <Text as="span" fontWeight="bold" mr={1}>@{notification.fromUser.username}</Text>
                      )}
                      {notification.type === 'FOLLOW' 
                        ? 'começou a te seguir'
                        : notification.message
                      }
                    </Text>
                  </Box>
                  
                  {notification.type === 'FOLLOW' && 
                   notification.fromUser && 
                   !followingIds.has(notification.fromUser.id) && (
                    <Button
                      mt={2}
                      size="sm"
                      leftIcon={<Icon as={FaUserPlus} />}
                      colorScheme="blue"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFollowUser(notification.fromUser!.id);
                      }}
                    >
                      Seguir de volta
                    </Button>
                  )}
                  
                  {notification.type === 'FOLLOW' && 
                   notification.fromUser && 
                   followingIds.has(notification.fromUser.id) && (
                    <Badge mt={2} colorScheme="green" display="inline-flex" alignItems="center">
                      <Icon as={FaUserCheck} mr={1} /> Já segue
                    </Badge>
                  )}
                  
                  {notification.type === 'BOOK_SHARE' && notification.book && (
                    <HStack mt={3} bg="gray.50" p={2} borderRadius="md">
                      {notification.book.coverUrl && (
                        <Box width="40px" height="60px">
                          <img 
                            src={notification.book.coverUrl} 
                            alt={notification.book.title}
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover',
                              borderRadius: '4px'
                            }}
                          />
                        </Box>
                      )}
                      <Box>
                        <Text fontWeight="medium" fontSize="sm" textAlign="left">
                          {notification.book.title}
                        </Text>
                        <Text fontSize="xs" color="gray.600" textAlign="left">
                          por {notification.book.author}
                        </Text>
                      </Box>
                    </HStack>
                  )}
                </Box>
              </HStack>
            </Box>
          ))}
        </VStack>
      )}
    </Container>
  );
}
