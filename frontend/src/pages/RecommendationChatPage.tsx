import { Box, Heading, Text, Container } from '@chakra-ui/react';
import RecommendationChat from '../components/RecommendationChat';

export default function RecommendationChatPage() {
  return (
    <Container maxW="container.xl" py={8}>
      <Box textAlign="center" mb={8}>
        <Heading 
          size="xl" 
          mb={4}
          bgGradient="linear(to-r, purple.400, pink.400)"
          bgClip="text"
        >
          Assistente de Recomendações de Livros
        </Heading>
        <Text fontSize="lg" color="gray.600">
          Converse com nossa IA para receber recomendações personalizadas de livros!
        </Text>
      </Box>
      
      <RecommendationChat />
    </Container>
  );
}
