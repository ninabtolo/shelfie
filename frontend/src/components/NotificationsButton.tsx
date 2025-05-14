import { useState, useEffect } from 'react';
import {
  IconButton, Badge, Box, Popover, PopoverTrigger,
  PopoverContent, PopoverBody, PopoverArrow, PopoverCloseButton,
  VStack, Text, HStack, Avatar, Icon, useDisclosure, Button
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FaRegBell, FaBell, FaUserPlus, FaBook } from 'react-icons/fa';
import { notificationApi } from '../services/api';

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
    googleBookId: string;
    title?: string;
    author?: string;
    coverUrl?: string;
  } | null;
  createdAt: string;
}

export default function NotificationsButton() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await notificationApi.getUserNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await notificationApi.markAsRead(notification.id);
      setNotifications(prevNotifications => 
        prevNotifications.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => prev - 1);
    }
    
    onClose();
    
    // muda de acordo com o tipo de notificação
    if (notification.type === 'FOLLOW' && notification.fromUser) {
      navigate(`/user/${notification.fromUser.id}`);
    } else if (notification.type === 'BOOK_SHARE' && notification.book?.googleBookId) {
      navigate(`/books/${notification.book.googleBookId}`);
    }
  };

  const handleViewAll = () => {
    navigate('/notifications');
    onClose();
  };

  return (
    <Popover
      isOpen={isOpen}
      onOpen={onOpen}
      onClose={onClose}
      placement="bottom-end"
      closeOnBlur={true}
    >
      <PopoverTrigger>
        <Box position="relative">
          <IconButton
            aria-label="Notificações"
            icon={<Icon as={unreadCount > 0 ? FaBell : FaRegBell} />}
            variant="ghost"
            fontSize="20px"
          />
          {unreadCount > 0 && (
            <Badge
              position="absolute"
              top="-2px"
              right="-2px"
              colorScheme="red"
              borderRadius="full"
              fontSize="xs"
              paddingX={1}
              paddingY={0}
              minWidth="18px"
              textAlign="center"
            >
              {unreadCount}
            </Badge>
          )}
        </Box>
      </PopoverTrigger>
      <PopoverContent width="320px">
        <PopoverArrow />
        <PopoverCloseButton />
        <PopoverBody padding={4}>
          <Text fontWeight="bold" mb={3}>Notificações Recentes</Text>
          
          {notifications.length === 0 ? (
            <Text color="gray.500" textAlign="center" py={4}>
              Sem notificações ainda
            </Text>
          ) : (
            <VStack align="stretch" spacing={3} maxHeight="300px" overflowY="auto">
              {/* max 2 notificações */}
              {notifications.slice(0, 2).map(notification => (
                <Box
                  key={notification.id}
                  p={2}
                  bg={notification.isRead ? "white" : "purple.50"}
                  borderRadius="md"
                  cursor="pointer"
                  _hover={{ bg: "gray.50" }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <HStack spacing={3}>
                    <Avatar 
                      size="sm" 
                      src={notification.fromUser?.profilePicture || undefined} 
                      name={notification.fromUser?.username || 'User'} 
                    />
                    <Box flex="1">
                      <HStack>
                        <Icon 
                          as={notification.type === 'FOLLOW' ? FaUserPlus : FaBook} 
                          color={notification.type === 'FOLLOW' ? "blue.500" : "green.500"}
                          fontSize="xs"
                        />
                        <Text fontSize="xs" fontWeight="bold">
                          {notification.type === 'FOLLOW' ? 'Novo seguidor' : 'Recomendação'}
                        </Text>
                      </HStack>
                      <Text fontSize="sm" noOfLines={2} textAlign="left">
                        {notification.fromUser && (
                          <Text as="span" fontWeight="bold" mr={1}>@{notification.fromUser.username}</Text>
                        )}
                        {notification.type === 'FOLLOW' 
                          ? 'começou a te seguir'
                          : notification.message
                        }
                      </Text>
                      
                      {/* pega os detalhes do livro */}
                      {notification.type === 'BOOK_SHARE' && notification.book && (
                        <Box mt={1} bg="gray.50" p={2} borderRadius="sm">
                          <HStack>
                            {notification.book.coverUrl && (
                              <Box width="30px" height="45px">
                                <img
                                  src={notification.book.coverUrl}
                                  alt={notification.book.title}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    borderRadius: '2px'
                                  }}
                                />
                              </Box>
                            )}
                            <Box>
                              <Text fontSize="xs" fontWeight="medium" textAlign="left">
                                {notification.book.title || "Livro recomendado"}
                              </Text>
                              {notification.book.author && (
                                <Text fontSize="xs" color="gray.600" textAlign="left">
                                  por {notification.book.author}
                                </Text>
                              )}
                            </Box>
                          </HStack>
                        </Box>
                      )}
                    </Box>
                  </HStack>
                </Box>
              ))}
              
              {notifications.length > 2 && (
                <Box 
                  p={3} 
                  textAlign="center" 
                  bg="gray.50" 
                  borderRadius="md"
                  cursor="pointer"
                  _hover={{ bg: "gray.100" }}
                  onClick={handleViewAll}
                  mb={2} 
                >
                  <Text fontSize="sm" color="purple.600">
                    +{notifications.length - 2} mais notificações
                  </Text>
                </Box>
              )}
              
              <Button 
                size="sm" 
                colorScheme="purple" 
                variant="outline" 
                width="100%" 
                onClick={handleViewAll}
                py={4} 
                height="auto" 
                minHeight="32px" 
              >
                Ver todas notificações
              </Button>
            </VStack>
          )}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}
