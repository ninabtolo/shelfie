import { useState } from 'react';
import {
  Box, Container, Heading, Text, VStack,
  Avatar, HStack, Button, useToast,
  Input, InputGroup, InputRightElement,
  Spinner, Center, 
} from '@chakra-ui/react';
import { FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../services/api';

export default function UserSearch() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<{
    id: string;
    username: string;
    profilePicture?: string;
    isFollowing: boolean;
  }[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const results = await userApi.searchUsers(query);
      
      // mapa dos resultados para incluir o estado de seguir
      setUsers(results.map((user: {id: string; username: string; profilePicture?: string}) => ({
        ...user,
        isFollowing: false
      })));
      
      setSearched(true);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "Error searching users",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUser = async (userId: string) => {
    try {
      await userApi.followUser(userId);
      // update pra mostrar que o usuário está sendo seguido
      setUsers(users.map(user => 
        user.id === userId ? { ...user, isFollowing: true } : user
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
      // update pra mostrar que o usuário não está mais sendo seguido
      setUsers(users.map(user => 
        user.id === userId ? { ...user, isFollowing: false } : user
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
      
      <Heading size="lg" mb={6}>Encontrar Usuários</Heading>
      
      <Box mb={6}>
        <InputGroup size="lg">
          <Input
            placeholder="Buscar por nome de usuário"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <InputRightElement>
            <Button
              h="1.75rem"
              size="sm"
              onClick={handleSearch}
              disabled={!query.trim() || loading}
            >
              {loading ? <Spinner size="sm" /> : <FaSearch />}
            </Button>
          </InputRightElement>
        </InputGroup>
      </Box>
      
      {loading ? (
        <Center py={10}>
          <Spinner size="xl" />
        </Center>
      ) : searched && users.length === 0 ? (
        <Box p={6} bg="white" borderRadius="lg" boxShadow="sm" textAlign="center">
          <Text>Nenhum usuário encontrado para "{query}"</Text>
        </Box>
      ) : (
        <VStack spacing={4} align="stretch">
          {users.map((user) => (
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
                    colorScheme="purple"
                    variant="solid"
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
