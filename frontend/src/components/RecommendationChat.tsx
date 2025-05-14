import { useState, useRef, useEffect } from 'react';
import {
  Box, Text, Input, Button, VStack, HStack, Avatar,
  Flex, useToast, Heading} from '@chakra-ui/react';
import { ArrowForwardIcon } from '@chakra-ui/icons';
import ReactMarkdown from 'react-markdown';
import { recommendationApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function RecommendationChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Olá! Eu sou sua assistente de recomendações de livros. Me conte o que você está procurando, e posso sugerir alguns títulos para você. Você pode pedir recomendações baseadas em seus interesses: 'Me recomende livros de fantasia com protagonista feminina', perguntar sobre sua lista de leitura: 'Qual livro da minha lista para ler você recomenda que eu leia primeiro?' ou buscar algo similar: 'Quero ler algo como Harry Potter, mas para adultos'",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const navigate = useNavigate();

  // vai sozinho pro final da lista de mensagens 
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // add as mensagens do usuário
    const userMessage = {
      text: input,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    try {
      // chama a API de recomendações
      const response = await recommendationApi.getChatRecommendation(input);
      
      // resposta da ia
      const aiMessage = {
        text: response.recommendation,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting recommendation:', error);
      
      toast({
        title: "Erro",
        description: "Não foi possível obter recomendações no momento.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      
      // msg de erro 
      setMessages(prev => [...prev, {
        text: "Desculpe, não consegui gerar recomendações no momento. Por favor, tente novamente mais tarde.",
        isUser: false,
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      w="100%" 
      maxW="800px" 
      mx="auto" 
      p={4} 
      borderWidth="1px" 
      borderRadius="lg" 
      boxShadow="md"
      bg="white"
      height="600px"
      display="flex"
      flexDirection="column"
    >
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md">Assistente de Recomendações</Heading>
      </Flex>
      
      <Box 
        flex="1" 
        overflowY="auto" 
        px={2}
        py={2}
        css={{
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            width: '10px',
            background: '#f1f1f1',
            borderRadius: '24px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#c2c2c2',
            borderRadius: '24px',
          }
        }}
      >
        <VStack spacing={4} align="stretch" pb={2}> 
          {messages.map((msg, index) => (
            <Flex 
              key={index} 
              justify={msg.isUser ? "flex-end" : "flex-start"}
            >
              {!msg.isUser && (
                <Avatar 
                  size="sm" 
                  bg="purple.500" 
                  mr={2} 
                  name="AI Assistant"
                />
              )}
              
              <Box
                maxW="80%"
                bg={msg.isUser ? "purple.500" : "gray.100"}
                color={msg.isUser ? "white" : "gray.800"}
                borderRadius="lg"
                px={4}
                py={3}
              >
                {msg.isUser ? (
                  <Text>{msg.text}</Text>
                ) : (
                  <Box 
                    className="markdown-content" 
                    textAlign="left"
                    sx={{
                      'p': {
                        lineHeight: '1.7',
                        marginBottom: '0.5rem'
                      },
                      'h1, h2, h3, h4, h5, h6': {
                        marginTop: '1.5rem',
                        marginBottom: '0.75rem',
                        fontWeight: 'bold'
                      },
                      'ul, ol': {
                        paddingLeft: '1rem',
                        marginBottom: '1rem'
                      },
                      'li': {
                        marginBottom: '0.4rem'
                      }
                    }}
                  >
                    <ReactMarkdown 
                      components={{
                        a: ({ node, ...props }) => {
                          const href = props.href || '';
                          return (
                            <Text
                              as="span"
                              color="purple.500"
                              fontWeight="medium"
                              textDecoration="underline"
                              cursor="pointer"
                              onClick={(e) => {
                                e.preventDefault();
                                if (href.startsWith('/books/')) {
                                  const bookId = href.replace('/books/', '');
                                  navigate(`/books/${bookId}`);
                                } else {
                                  window.open(href, '_blank');
                                }
                              }}
                            >
                              {props.children}
                            </Text>
                          );
                        }
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </Box>
                )}
              </Box>
              
              {msg.isUser && (
                <Avatar 
                  size="sm" 
                  ml={2} 
                  name="User" 
                />
              )}
            </Flex>
          ))}
          <div ref={messagesEndRef} />
        </VStack>
      </Box>
      
      <HStack mt={4}>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Me recomende um livro..."
          onKeyPress={(e) => e.key === 'Enter' && !loading && handleSendMessage()}
          disabled={loading}
        />
        <Button
          colorScheme="purple"
          onClick={handleSendMessage}
          isLoading={loading}
          disabled={loading || !input.trim()}
          rightIcon={<ArrowForwardIcon />}
        >
          Enviar
        </Button>
      </HStack>
    </Box>
  );
}
