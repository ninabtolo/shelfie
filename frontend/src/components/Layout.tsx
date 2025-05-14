import { Outlet } from 'react-router-dom';
import { Box, Container, useColorModeValue } from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from './LoginForm';
import Navbar from './Navbar'; 

export default function Layout() {
  const { user } = useAuth();
  const bgColor = useColorModeValue('gray.50', 'gray.900');

  // login para não autenticados
  if (!user) {
    return <LoginForm />;
  }

  return (
    <Box bg={bgColor} minHeight="100vh">
      <Navbar />
      
      <Container maxW="container.xl" pt={5} pb={10}>
        <Outlet />
      </Container>
    </Box>
  );
}
