import { useState, useEffect } from 'react';
import {
  Box, Container, Heading, Text, VStack,
  Avatar, HStack, Button, useToast, Spinner, Center
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../services/api';

export default function Following() {
  const [following, setFollowing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const fetchFollowing = async () => {
      try {
        setLoading(true);
        const data = await userApi.getFollowing();
        setFollowing(data);
      } catch (error) {
        console.error('Error fetching following users:', error);
        toast({
          title: 'Error fetching following users',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFollowing();
  }, [toast]);

  const handleUnfollowUser = async (userId: string) => {
    try {
      await userApi.unfollowUser(userId);
      // Remove o user da lista de seguindo
      setFollowing(following.filter(user => user.id !== userId));
      
      toast({
        title: 'User unfollowed successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast({
        title: 'Error unfollowing user',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="container.md" py={8}>
      <Button onClick={() => navigate(-1)} mb={6} variant="outline">Back</Button>
      
      <Heading size="lg" mb={6}>Seguindo</Heading>
      
      {loading ? (
        <Center py={10}>
          <Spinner size="xl" />
        </Center>
      ) : following.length === 0 ? (
        <Box p={6} bg="white" borderRadius="lg" boxShadow="sm" textAlign="center">
          <Text>Você não está seguindo ninguém ainda.</Text>
        </Box>
      ) : (
        <VStack spacing={4} align="stretch">
          {following.map((user) => (
            <Box key={user.id} p={4} bg="white" borderRadius="lg" boxShadow="sm">
              <HStack spacing={4} justify="space-between">
                <HStack>
                  <Avatar 
                    size="md" 
                    name={user.username} 
                    src={user.profilePicture}
                  />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold">@{user.username}</Text>
                  </VStack>
                </HStack>
                <Button 
                  size="sm"
                  colorScheme="red"
                  variant="outline"
                  onClick={() => handleUnfollowUser(user.id)}
                >
                  Deixar de seguir
                </Button>
              </HStack>
            </Box>
          ))}
        </VStack>
      )}
    </Container>
  );
}
