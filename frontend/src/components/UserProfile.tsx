import { useState, useEffect, useRef } from 'react';
import { 
  Box, Container, Heading, Text, VStack, 
  Button, Flex, Avatar, Divider, Tabs, 
  TabList, TabPanels, Tab, TabPanel, useDisclosure,
  Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalCloseButton, ModalBody, ModalFooter,
  Input, HStack, useToast, Badge, Icon
} from '@chakra-ui/react';
import { FaSignOutAlt, FaBook, FaHeart, FaCamera, FaUserFriends } from 'react-icons/fa';
import { MdBookmarkBorder } from 'react-icons/md';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PreferenceForm from './PreferenceForm';
import UserPreferencesSettings from './UserPreferencesSettings';
import { preferenceApi, userApi } from '../services/api';

export default function UserProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch das preferências 
        const userPreferences = await preferenceApi.getUserPreferences();
        setPreferences(userPreferences);

        // Fetch perfil com contagem (seguindo, seguidores, livros)
        const profile = await userApi.getUserProfile();
        setUserProfile(profile);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handlePreferencesSaved = async () => {
    // Refresh das preferências dps de salvar
    try {
      setIsLoading(true);
      const userPreferences = await preferenceApi.getUserPreferences();
      setPreferences(userPreferences);
    } catch (error) {
      console.error('Error fetching updated preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // verifica o tamanho (5MB)
      if (file.size > 5 * 1024 * 1024) { 
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target?.result) {
          // resize caso necessário
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // dimensões máximas
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
            
            // mantem a proporção
            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            // pega a imagem comprimida como data URL
            const compressedImageUrl = canvas.toDataURL('image/jpeg', 0.7); // ajusta a qualidade
            setImageUrl(compressedImageUrl);
          };
          
          img.src = e.target.result.toString();
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSaveProfilePicture = async () => {
    if (!imageUrl) return;
    
    try {
      setUploadingImage(true);
      await userApi.updateProfilePicture({ profilePicture: imageUrl });
      
      const profile = await userApi.getUserProfile();
      setUserProfile(profile);
      
      toast({
        title: "Profile picture updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating profile picture:', error);
      toast({
        title: "Error updating profile picture",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleViewFollowers = () => {
    navigate('/followers');
  };

  const handleViewFollowing = () => {
    navigate('/following');
  };

  const handleFindUsers = () => {
    navigate('/search-users');
  };

  return (
    <Container maxW="container.xl" py={[4, 6, 8]}>
      <Box mb={[4, 6, 8]}>
        <Flex 
          direction={["column", "column", "row"]} 
          align={["center", "center", "flex-start"]} 
          mb={6}
          gap={[4, 5, 6]}
        >
          <Box position="relative" alignSelf={["center", "center", "flex-start"]}>
            <Avatar 
              size={["xl", "xl", "2xl"]} 
              name={user?.email || 'User'} 
              src={userProfile?.profilePicture || user?.photoURL || undefined}
              mb={[2, 2, 0]}
            />
            <Button
              position="absolute"
              bottom="0"
              right="0"
              size="sm"
              borderRadius="full"
              colorScheme="blue"
              onClick={onOpen}
            >
              <FaCamera />
            </Button>
          </Box>
          
          <Box textAlign={["center", "center", "left"]} width="full">
            <Heading size={["md", "lg"]}>Meu Perfil</Heading>
            <Text color="gray.600" mt={1} fontSize={["sm", "md"]}>@{userProfile?.username}</Text>
            <Text color="gray.500" fontSize={["xs", "sm"]} mt={0}>{user?.email}</Text>
            
            {userProfile && (
              <Flex 
                mt={4}
                direction="row"
                align="center"
                justifyContent={["center", "center", "flex-start"]}
                wrap="nowrap"
              >
                <Box mr={6} textAlign="center">
                  <Text fontSize="xs" color="gray.600">Seguindo</Text>
                  <Flex align="center" justifyContent="center">
                    <Text fontWeight="bold" fontSize="md" color="blue.500">{userProfile._count?.following || 0}</Text>
                    {userProfile._count?.following > 0 && (
                      <Badge 
                        colorScheme="blue" 
                        borderRadius="full" 
                        px={2}
                        ml={1}
                        fontSize="xs"
                        _hover={{ bg: "blue.200" }}
                        cursor="pointer"
                        onClick={handleViewFollowing}
                      >
                        VER
                      </Badge>
                    )}
                  </Flex>
                </Box>
                
                <Box mr={6} textAlign="center">
                  <Text fontSize="xs" color="gray.600">Seguidores</Text>
                  <Flex align="center" justifyContent="center">
                    <Text fontWeight="bold" fontSize="md" color="blue.500">{userProfile._count?.followers || 0}</Text>
                    {userProfile._count?.followers > 0 && (
                      <Badge 
                        colorScheme="purple" 
                        borderRadius="full" 
                        px={2}
                        ml={1}
                        fontSize="xs"
                        _hover={{ bg: "purple.200" }}
                        cursor="pointer"
                        onClick={handleViewFollowers}
                      >
                        VER
                      </Badge>
                    )}
                  </Flex>
                </Box>
                
                <Box textAlign="center">
                  <Text fontSize="xs" color="gray.600">Livros lidos</Text>
                  <Text fontWeight="bold" fontSize="md" textAlign="center">{userProfile._count?.books || 0}</Text>
                </Box>
              </Flex>
            )}
          </Box>
        </Flex>
        
        <Box mt={[4, 6, 8]}>
          <Flex 
            gap={[2, 3, 4]} 
            wrap="wrap" 
            justifyContent={["center", "center", "flex-start"]}
          >
            <Button 
              leftIcon={<FaBook />} 
              colorScheme="purple" 
              variant="outline"
              size={["sm", "md"]}
              onClick={() => navigate('/history')}
              mb={2}
              flexGrow={[1, 1, 0]}
              maxWidth={["45%", "45%", "auto"]}
              fontSize={["xs", "sm", "md"]}
              iconSpacing={[2, 2, 3]}
            >
              Histórico 
            </Button>
            <Button 
              leftIcon={<FaHeart />} 
              colorScheme="pink" 
              variant="outline"
              size={["sm", "md"]}
              onClick={() => navigate('/favorites')}
              mb={2}
              flexGrow={[1, 1, 0]}
              maxWidth={["45%", "45%", "auto"]}
            >
              Favoritos
            </Button>
            <Button 
              leftIcon={<FaUserFriends />} 
              colorScheme="teal" 
              variant="outline"
              size={["sm", "md"]}
              onClick={handleFindUsers}
              mb={2}
              flexGrow={[1, 1, 0]}
              maxWidth={["45%", "45%", "auto"]}
            >
              Procurar
            </Button>
            <Button 
              leftIcon={<Icon as={MdBookmarkBorder} />}
              colorScheme="blue"
              variant="outline"
              size={["sm", "md"]}
              onClick={() => navigate('/reading-list')}
              mb={2}
              flexGrow={[1, 1, 0]}
              maxWidth={["45%", "45%", "auto"]}
            >
              Lista de Leitura
            </Button>
            <Button 
              leftIcon={<FaSignOutAlt />} 
              colorScheme="red" 
              variant="outline"
              size={["sm", "md"]}
              onClick={handleLogout}
              mb={2}
              flexGrow={[1, 1, 0]}
              maxWidth={["45%", "45%", "auto"]}
            >
              Sair
            </Button>
          </Flex>
        </Box>
      </Box>
      
      <Divider my={[4, 5, 6]} />

      <Tabs colorScheme="purple" variant="enclosed" isFitted>
        <TabList>
          <Tab fontSize={["sm", "md"]}>Preferências de Leitura</Tab>
          <Tab fontSize={["sm", "md"]}>Configurações do App</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel p={[0, 3, 6]}>
            <Box 
              bg="white" 
              p={{ base: 0, sm: 4, md: 6 }} 
              borderRadius={{ base: 0, sm: "lg" }} 
              boxShadow={{ base: "none", sm: "md" }}
            >
              <PreferenceForm 
                initialPreferences={preferences}
                isLoading={isLoading} 
                onSaved={handlePreferencesSaved} 
              />
            </Box>
          </TabPanel>
          
          <TabPanel p={[2, 3, 6]}>
            <VStack spacing={[4, 6, 8]} align="stretch">
              <UserPreferencesSettings />
              
              <Box p={[3, 4, 6]} bg="white" borderRadius="lg" boxShadow="md">
                <Heading size={["sm", "md"]} mb={[3, 4, 6]}>Assistente de Recomendações</Heading>
                <Text mb={4} fontSize={["sm", "md"]}>
                  Converse com nossa IA para receber recomendações personalizadas de livros baseadas em interesses específicos.
                </Text>
                <Button
                  colorScheme="purple"
                  size={["sm", "md"]}
                  onClick={() => navigate('/recommendations/chat')}
                >
                  Abrir Assistente
                </Button>
              </Box>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Foto de Perfil</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={6}>
              {imageUrl && (
                <Avatar 
                  size="2xl" 
                  src={imageUrl} 
                />
              )}
              <Input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                display="none" 
                ref={fileInputRef} 
              />
              <Button 
                colorScheme="blue" 
                onClick={handleUploadClick}
                width="full"
              >
                Escolher Imagem
              </Button>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={4}>
              <Button variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button 
                colorScheme="blue" 
                onClick={handleSaveProfilePicture}
                isLoading={uploadingImage}
              >
                Salvar
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}
