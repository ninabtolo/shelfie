import { useState, useEffect } from 'react';
import {
  IconButton, Badge, Box, Popover,
  PopoverTrigger, PopoverContent, PopoverHeader, 
  PopoverBody, PopoverArrow, PopoverCloseButton,
  VStack, Text, Button, Divider, useToast,
  Flex, Spinner
} from '@chakra-ui/react';
import { BellIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { notificationApi } from '../services/api';

export interface Notification {
  id: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  bookId?: string;
  bookTitle?: string;
}

export default function NotificationBadge() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    fetchNotifications();
    
    // procurando as notificações a cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationApi.getUserNotifications();
      setNotifications(data);
      
      // calcula as n lidas - add explicit type to notification parameter
      const unread = data.filter((notification: Notification) => !notification.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      
      // Update do estado local
      setNotifications(notifications.map(notif => 
        notif.id === id ? {...notif, isRead: true} : notif // Changed from `read` to `isRead`
      ));
      
      // Update da contagem de n lidas
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      
      setNotifications(notifications.map(notif => ({...notif, isRead: true}))); // Changed from `read` to `isRead`
      
      // seta a contagem para 0
      setUnreadCount(0);
      
      toast({
        title: "Notificações",
        description: "Todas as notificações foram marcadas como lidas.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    // navega pro link do livro
    if (notification.bookId) {
      navigate(`/books/${notification.bookId}`);
    }
  };

  return (
    <Popover placement="bottom-end">
      <PopoverTrigger>
        <Box position="relative" display="inline-block">
          <IconButton
            aria-label="Notificações"
            icon={<BellIcon />}
            variant="ghost"
            fontSize="20px"
            colorScheme="purple"
          />
          {unreadCount > 0 && (
            <Badge
              position="absolute"
              top="-2px"
              right="-2px"
              borderRadius="full"
              bg="red.500"
              color="white"
              fontSize="xs"
              fontWeight="bold"
              px={2}
              py={1}
              minWidth="20px"
              textAlign="center"
            >
              {unreadCount}
            </Badge>
          )}
        </Box>
      </PopoverTrigger>
      <PopoverContent width="350px" maxH="500px" overflowY="auto">
        <PopoverArrow />
        <PopoverCloseButton />
        <PopoverHeader fontWeight="bold">
          <Flex justify="space-between" align="center">
            <Text>Notificações</Text>
            {notifications.length > 0 && (
              <Button size="xs" colorScheme="purple" onClick={markAllAsRead}>
                Marcar todas como lidas
              </Button>
            )}
          </Flex>
        </PopoverHeader>
        <PopoverBody p={0}>
          {loading ? (
            <Flex justify="center" py={4}>
              <Spinner size="md" color="purple.500" />
            </Flex>
          ) : notifications.length === 0 ? (
            <Box p={6} textAlign="center">
              <Text color="gray.500">Nenhuma notificação.</Text>
            </Box>
          ) : (
            <VStack divider={<Divider />} spacing={0} align="stretch">
              {notifications.map((notification) => (
                <Box 
                  key={notification.id} 
                  p={4} 
                  bg={notification.isRead ? "white" : "purple.50"} // Changed from `read` to `isRead`
                  cursor={notification.bookId ? "pointer" : "default"}
                  onClick={() => notification.bookId && handleNotificationClick(notification)}
                  _hover={notification.bookId ? { bg: "gray.50" } : {}}
                >
                  <Text fontWeight={notification.isRead ? "normal" : "bold"} textAlign="left"> // Changed from `read` to `isRead`
                    {notification.message}
                  </Text>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    {new Date(notification.createdAt).toLocaleString()}
                  </Text>
                  {!notification.isRead && ( // Changed from `read` to `isRead`
                    <Button 
                      size="xs" 
                      mt={2} 
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                    >
                      Marcar como lida
                    </Button>
                  )}
                </Box>
              ))}
            </VStack>
          )}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}
