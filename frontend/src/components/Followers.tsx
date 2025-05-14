import { useState, useEffect } from 'react';
import {
  Box, Container, Heading, Text, VStack,
  Avatar, HStack, Button, useToast, Spinner, Center
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../services/api';

export default function Followers() {
  const [followers, setFollowers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const fetchFollowers = async () => {
      try {
        setLoading(true);
        const data = await userApi.getFollowers();
        
        // lista de quem o user segue 
        const following = await userApi.getFollowing();
        const followingIds = new Set(following.map((user: {id: string}) => user.id));
        
        // adiciona flag de já seguindo
        const enrichedData = data.map((follower: any) => ({
          ...follower,
          isFollowing: followingIds.has(follower.id)
        }));
        
        setFollowers(enrichedData);
      } catch (error) {
        console.error('Error fetching followers:', error);
        toast({
          title: 'Error fetching followers',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFollowers();
  }, [toast]);

  const handleFollowUser = async (userId: string) => {
    try {
      await userApi.followUser(userId);
      // Update da lista de seguidores 
      setFollowers(followers.map(follower => 
        follower.id === userId ? { ...follower, isFollowing: true } : follower
      ));
      
      toast({
        title: 'User followed successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error following user:', error);
      toast({
        title: 'Error following user',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleUnfollowUser = async (userId: string) => {
    try {
      await userApi.unfollowUser(userId);
      // Update lista de seguidores
      setFollowers(followers.map(follower => 
        follower.id === userId ? { ...follower, isFollowing: false } : follower
      ));
      
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
      
      <Heading size="lg" mb={6}>Seguidores</Heading>
      
      {loading ? (
        <Center py={10}>
          <Spinner size="xl" />
        </Center>
      ) : followers.length === 0 ? (
        <Box p={6} bg="white" borderRadius="lg" boxShadow="sm" textAlign="center">
          <Text>Você ainda não tem seguidores.</Text>
        </Box>
      ) : (
        <VStack spacing={4} align="stretch">
          {followers.map((user) => (
            <Box key={user.id} p={4} bg="white" borderRadius="lg" boxShadow="sm">
              <HStack spacing={4} justify="space-between">
                <HStack>
                  <Avatar 
                    size="md" 
                    name={user.username || user.email || 'User'} 
                    src={user.profilePicture}
                  />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold">
                      @{user.username || 'Usuário'}
                    </Text>
                  </VStack>
                </HStack>
                {user.isFollowing ? (
                  <Button 
                    size="sm"
                    colorScheme="red"
                    variant="outline"
                    onClick={() => handleUnfollowUser(user.id)}
                  >
                    Deixar de seguir
                  </Button>
                ) : (
                  <Button 
                    size="sm"
                    colorScheme="blue"
                    onClick={() => handleFollowUser(user.id)}
                  >
                    Seguir
                  </Button>
                )}
              </HStack>
            </Box>
          ))}
        </VStack>
      )}
    </Container>
  );
}
