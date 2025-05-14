import { useState, useEffect } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box, Flex, Link, Icon, Text, Button, HStack, 
  IconButton, Menu, MenuButton, MenuList, MenuItem,
  Avatar, useDisclosure, Drawer, DrawerBody, DrawerHeader,
  DrawerOverlay, DrawerContent, DrawerCloseButton, VStack,
  MenuDivider, Image
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { HamburgerIcon, ChevronDownIcon, SearchIcon } from '@chakra-ui/icons';
import { FaBook, FaHeart, FaHistory, FaUser, FaBookmark, FaBell, FaSignOutAlt } from 'react-icons/fa';
import NotificationsButton from './NotificationsButton';
import { userApi } from '../services/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null); 

  // pega a data do user quando o componente é montado
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (user) {
          const profile = await userApi.getUserProfile();
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleLogout = async () => {
    setIsLogoutLoading(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLogoutLoading(false);
    }
  };

  // ve se o link está ativo
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { label: 'Buscar', path: '/search' },
    { label: 'Histórico', path: '/history' },
    { label: 'Favoritos', path: '/favorites' },
    { label : 'Recomendações', path: '/recommendations/chat' },
    { label: 'Lista', path: '/reading-list' },
  ];

  const NavLinks = () => (
    <>
      {navItems.map((item) => (
        <Link
          key={item.path}
          as={RouterLink}
          to={item.path}
          display="flex"
          alignItems="center"
          p={2}
          fontWeight={isActive(item.path) ? "bold" : "medium"}
          color={isActive(item.path) ? "purple.500" : "gray.600"}
          _hover={{ color: "purple.500" }}
          borderBottom={isActive(item.path) ? "2px solid" : "none"}
          borderColor="purple.500"
        >
          <Icon 
            as={
              item.path === '/search' ? SearchIcon : 
              item.path === '/history' ? FaHistory : 
              item.path === '/favorites' ? FaHeart : 
              item.path === '/reading-list' ? FaBookmark : 
              FaBook
            } 
            mr={2} 
          />
          <Text>{item.label}</Text>
        </Link>
      ))}
    </>
  );

  if (!user) return null;

  return (
    <Box
      as="nav"
      bg="white"
      boxShadow="sm"
      position="sticky"
      top="0"
      zIndex="sticky"
    >
      <Flex
        h="60px"
        alignItems="center"
        justifyContent="space-between"
        px={{ base: 4, md: 6 }}
        maxW="1200px"
        mx="auto"
      >
        <RouterLink to="/">
          <Flex alignItems="center">
            <Image src="/shelfie_icon.png" alt="Shelfie Logo" boxSize={6} mr={2} />
            <Text 
              fontFamily="'Dancing Script', cursive"
              fontWeight="bold"
              fontSize="2xl"
              bgGradient="linear(to-r, purple.400, pink.400)" 
              bgClip="text"
            >
              Shelfie
            </Text>
          </Flex>
        </RouterLink>

        <HStack spacing={6} display={{ base: 'none', md: 'flex' }}>
          <NavLinks />
        </HStack>

        <HStack spacing={3}>
          <NotificationsButton />

          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<ChevronDownIcon />}
              variant="ghost"
              _hover={{ bg: 'gray.100' }}
            >
              <HStack>
                <Avatar 
                  size="sm" 
                  name={userProfile?.username || user?.email || 'User'} 
                  src={userProfile?.profilePicture || user?.photoURL}
                  bg="purple.500"
                />
                <Text 
                  fontWeight="medium" 
                  display={{ base: 'none', md: 'block' }}
                >
                  {userProfile?.username ? `@${userProfile.username}` : (user?.email?.split('@')[0] || 'User')}
                </Text>
              </HStack>
            </MenuButton>
            <MenuList>
              <MenuItem 
                as={RouterLink} 
                to="/profile" 
                icon={<Icon as={FaUser} />}
              >
                Meu Perfil
              </MenuItem>
              <MenuItem
                as={RouterLink}
                to="/notifications"
                icon={<Icon as={FaBell} />}
              >
                Minhas Notificações
              </MenuItem>
              <MenuDivider />
              <MenuItem 
                onClick={handleLogout} 
                isDisabled={isLogoutLoading}
                _hover={{ 
                  color: "red.500",
                  boxShadow: "none",
                  outline: "none",
                  border: "none",
                  rounded: "none"
                }}
                icon={<Icon as={FaSignOutAlt} />}
              >
                Sair
              </MenuItem>
            </MenuList>
          </Menu>

          <IconButton
            aria-label="Open menu"
            icon={<HamburgerIcon />}
            variant="ghost"
            display={{ base: 'flex', md: 'none' }}
            onClick={onOpen}
          />
        </HStack>
      </Flex>

      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Menu</DrawerHeader>
          <DrawerBody>
            <VStack align="stretch" spacing={4}>
              <NavLinks />
              <Button as={RouterLink} to="/notifications" leftIcon={<Icon as={FaBell} />}>
                Notificações
              </Button>
              <Button onClick={handleLogout} isLoading={isLogoutLoading}>
                Sair
              </Button>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}
