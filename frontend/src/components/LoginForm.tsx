import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase/config";
import { 
  Box, Button, Center, Container, Flex, FormControl, Heading, 
  Input, Text, useToast, VStack, InputGroup, InputLeftElement,
  usePrefersReducedMotion, FormErrorMessage
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { EmailIcon, LockIcon, AtSignIcon } from "@chakra-ui/icons";
import { userApi } from "../services/api";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const prefersReducedMotion = usePrefersReducedMotion();
  const toast = useToast();

  // animação de brilho 
  const sparkleAnimation = keyframes`
    0% { transform: scale(0); opacity: 0; }
    50% { transform: scale(1); opacity: 1; }
    100% { transform: scale(0); opacity: 0; }
  `;
  
  // animação p fazer o form flutuar
  const floatAnimation = keyframes`
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
  `;

  const sparkleAnimationStyle = prefersReducedMotion
    ? undefined
    : `${sparkleAnimation} 3s infinite`;
  
  const floatAnimationStyle = prefersReducedMotion
    ? undefined
    : `${floatAnimation} 6s ease-in-out infinite`;

  const handleUsernameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    
    if (!isLogin && newUsername.length >= 3) {
      setIsCheckingUsername(true);
      setUsernameError("");
      
      try {
        // evita a checagem em cada letra p não sobrecarregar o backend
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (newUsername.length < 3) {
          setUsernameError("Nome de usuário deve ter pelo menos 3 caracteres");
          setIsCheckingUsername(false);
          return;
        }
        
        // verifica caracteres 
        if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
          setUsernameError("Nome de usuário pode conter apenas letras, números e underscore");
          setIsCheckingUsername(false);
          return;
        }
        
        const isAvailable = await userApi.checkUsernameAvailability(newUsername);
        
        if (!isAvailable) {
          setUsernameError("Este nome de usuário já está em uso");
        }
      } catch (error) {
        console.error("Error checking username:", error);
      } finally {
        setIsCheckingUsername(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Valida os inputs 
    if (!isLogin) {
      if (username.length < 3) {
        toast({
          title: "Nome de usuário inválido",
          description: "O nome de usuário deve ter pelo menos 3 caracteres",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "top"
        });
        return;
      }
      
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        toast({
          title: "Nome de usuário inválido",
          description: "O nome de usuário pode conter apenas letras, números e underscore",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "top"
        });
        return;
      }
      
      if (usernameError) {
        toast({
          title: "Nome de usuário inválido",
          description: usernameError,
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "top"
        });
        return;
      }
    }
    
    setIsLoading(true);
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // chama o back p registrar o nome de usuário
        try {
          await userApi.updateUsername(username);
        } catch (error) {
          console.error("Error registering username:", error);
          toast({
            title: "Erro ao registrar nome de usuário",
            description: "Sua conta foi criada, mas houve um problema ao registrar seu nome de usuário.",
            status: "warning",
            duration: 5000,
            isClosable: true,
            position: "top"
          });
        }
      }
    } catch (error: any) {
      console.error("Login/registration error:", error);
      
      // tradução de mensagens 
      let errorMessage = "Ocorreu um erro. Por favor, tente novamente.";
      
      if (error.code === "auth/invalid-credential" || 
          error.code === "auth/wrong-password" || 
          error.message?.includes("invalid-credential") || 
          error.message?.includes("wrong-password")) {
        errorMessage = "Email ou senha incorretos. Por favor, verifique suas credenciais.";
      } else if (error.code === "auth/user-not-found" || error.message?.includes("user-not-found")) {
        errorMessage = "Usuário não encontrado. Verifique seu email ou crie uma conta.";
      } else if (error.code === "auth/email-already-in-use" || error.message?.includes("email-already-in-use")) {
        errorMessage = "Este email já está sendo utilizado por outra conta.";
      } else if (error.code === "auth/weak-password" || error.message?.includes("weak-password")) {
        errorMessage = "Sua senha é muito fraca. Por favor, escolha uma senha mais forte.";
      } else if (error.code === "auth/invalid-email" || error.message?.includes("invalid-email")) {
        errorMessage = "Email inválido. Por favor, verifique o formato do email.";
      } else if (error.code === "auth/too-many-requests" || error.message?.includes("too-many-requests")) {
        errorMessage = "Muitas tentativas de login. Por favor, tente novamente mais tarde.";
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Email necessário",
        description: "Por favor, digite seu email para redefinir sua senha",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top"
      });
      return;
    }

    setIsResettingPassword(true);
    
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top"
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top"
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  // gera o efeito de brilho
  const [sparkles, setSparkles] = useState<{top: string, left: string, delay: string}[]>([]);
  
  useEffect(() => {
    const newSparkles = [];
    for (let i = 0; i < 20; i++) {
      newSparkles.push({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 5}s`
      });
    }
    setSparkles(newSparkles);
  }, []);

  return (
    <Box 
      minH="100vh" 
      bgGradient="linear(to-b, blue.900, purple.900)"
      backgroundSize="cover"
      backgroundPosition="center"
      backgroundAttachment="fixed"
      position="relative"
      overflow="hidden"
      width="100vw"
    >
      {/* brilhos */}
      {sparkles.map((sparkle, index) => (
        <Box
          key={index}
          position="absolute"
          top={sparkle.top}
          left={sparkle.left}
          w="4px"
          h="4px"
          borderRadius="full"
          bg="brand.300"
          opacity="0"
          animation={sparkleAnimationStyle}
          style={{ animationDelay: sparkle.delay }}
        />
      ))}

      <Box
        position="absolute"
        top="5%"
        right="10%"
        w="150px"
        h="150px"
        borderRadius="full"
        bgGradient="radial(pink.300, purple.500)"
        opacity="0.1"
        filter="blur(40px)"
      />
      <Box
        position="absolute"
        bottom="10%"
        left="5%"
        w="200px"
        h="200px"
        borderRadius="full"
        bgGradient="radial(purple.300, blue.700)"
        opacity="0.15"
        filter="blur(60px)"
      />

      <Center minH="100vh">
        <Container maxW="md">
          <Box 
            bg="rgba(30, 20, 60, 0.5)" 
            p={8} 
            borderRadius="xl" 
            boxShadow="0 8px 32px rgba(0, 0, 0, 0.3)"
            backdropFilter="blur(10px)"
            border="1px solid rgba(255, 255, 255, 0.18)"
            position="relative"
            overflow="hidden"
            animation={floatAnimationStyle}
            transition="all 0.3s"
            _hover={{ 
              boxShadow: "0 8px 38px rgba(237, 100, 166, 0.4)", 
              transform: "scale(1.02)"
            }}
          >
            <Box
              position="absolute"
              top="0"
              right="0"
              borderTop="50px solid rgba(219, 184, 146, 0.7)" 
              borderLeft="50px solid transparent"
              zIndex="1"
            />

            <VStack spacing={7} align="center" position="relative">
              <Heading 
                as="h1" 
                fontSize="5xl" 
                bgGradient="linear(to-r, pink.400, purple.500)"
                bgClip="text"
                fontFamily="'Dancing Script', cursive"
                fontWeight="bold"
                letterSpacing="wider"
                textShadow="0px 2px 5px rgba(0,0,0,0.2)"
              >
                Shelfie
              </Heading>
              
              <Heading 
                as="h2" 
                size="md" 
                color="whiteAlpha.800"
                fontWeight="medium"
                fontFamily="'Quicksand', sans-serif"
                letterSpacing="1px"
              >
                {isLogin ? "Descubra a magia dos livros" : "Comece sua jornada literária"}
              </Heading>

              <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                <VStack spacing={5} width="100%">
                  <FormControl>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <EmailIcon color="brand.400" />
                      </InputLeftElement>
                      <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        bg="rgba(255, 255, 255, 0.1)"
                        color="white"
                        border="1px solid rgba(255, 255, 255, 0.2)"
                        _hover={{ 
                          borderColor: "brand.400",
                          boxShadow: "0 0 10px rgba(237, 100, 166, 0.3)" 
                        }}
                        _focus={{ 
                          borderColor: "brand.400",
                          boxShadow: "0 0 15px rgba(237, 100, 166, 0.5)" 
                        }}
                        _placeholder={{ color: "whiteAlpha.700" }}
                        transition="all 0.3s ease"
                      />
                    </InputGroup>
                  </FormControl>

                  {!isLogin && (
                    <FormControl isInvalid={!!usernameError}>
                      <InputGroup>
                        <InputLeftElement pointerEvents="none">
                          <AtSignIcon color="brand.400" />
                        </InputLeftElement>
                        <Input
                          placeholder="Nome de usuário"
                          value={username}
                          onChange={handleUsernameChange}
                          required
                          bg="rgba(255, 255, 255, 0.1)"
                          color="white"
                          border="1px solid rgba(255, 255, 255, 0.2)"
                          _hover={{ 
                            borderColor: "brand.400",
                            boxShadow: "0 0 10px rgba(237, 100, 166, 0.3)" 
                          }}
                          _focus={{ 
                            borderColor: "brand.400", 
                            boxShadow: "0 0 15px rgba(237, 100, 166, 0.5)" 
                          }}
                          _placeholder={{ color: "whiteAlpha.700" }}
                          transition="all 0.3s ease"
                        />
                      </InputGroup>
                      {usernameError && (
                        <FormErrorMessage color="pink.300">{usernameError}</FormErrorMessage>
                      )}
                      {!usernameError && username && username.length >= 3 && (
                        <Text fontSize="xs" color="pink.300" mt={1}>
                          {isCheckingUsername ? "Verificando disponibilidade..." : "Nome de usuário disponível"}
                        </Text>
                      )}
                    </FormControl>
                  )}

                  <FormControl>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <LockIcon color="brand.400" /> 
                      </InputLeftElement>
                      <Input
                        type="password"
                        placeholder="Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        bg="rgba(255, 255, 255, 0.1)"
                        color="white"
                        border="1px solid rgba(255, 255, 255, 0.2)"
                        _hover={{ 
                          borderColor: "brand.400",
                          boxShadow: "0 0 10px rgba(237, 100, 166, 0.3)" 
                        }}
                        _focus={{ 
                          borderColor: "brand.400",
                          boxShadow: "0 0 15px rgba(237, 100, 166, 0.5)" 
                        }}
                        _placeholder={{ color: "whiteAlpha.700" }}
                        transition="all 0.3s ease"
                      />
                    </InputGroup>
                  </FormControl>

                  {isLogin && (
                    <Flex width="100%" justify="flex-end" mb={-3}>
                      <Text
                        color="brand.200" 
                        cursor="pointer"
                        _hover={{ 
                          color: "pink.200",
                          textShadow: "0 0 5px rgba(246, 135, 179, 0.5)" 
                        }}
                        onClick={handleForgotPassword}
                        fontSize="sm"
                        fontWeight="medium"
                        transition="all 0.3s ease"
                      >
                        {isResettingPassword ? "Enviando..." : "Esqueci minha senha"}
                      </Text>
                    </Flex>
                  )}

                  <Button
                    type="submit"
                    bgGradient="linear(to-r, purple.500, brand.500)"
                    color="white"
                    width="full"
                    isLoading={isLoading}
                    _hover={{ 
                      bgGradient: "linear(to-r, purple.600, brand.600)",
                      transform: "translateY(-3px)",
                      boxShadow: "0 10px 20px -10px rgba(237, 100, 166, 0.7)" 
                    }}
                    _active={{
                      transform: "translateY(-1px)",
                      boxShadow: "0 5px 10px -5px rgba(237, 100, 166, 0.7)" 
                    }}
                    transition="all 0.2s ease"
                    fontSize="md"
                    py={6}
                    letterSpacing="wider"
                    boxShadow="0 5px 15px -5px rgba(237, 100, 166, 0.4)" 
                  >
                    {isLogin ? "Entrar no Mundo dos Livros" : "Começar Minha Jornada"}
                  </Button>
                </VStack>
              </form>
              
              <Flex width="100%" justify="center">
                <Text
                  color="brand.200" 
                  cursor="pointer"
                  _hover={{ 
                    color: "pink.200", 
                    textShadow: "0 0 5px rgba(246, 135, 179, 0.5)"
                  }}
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setUsernameError("");
                  }}
                  fontSize="sm"
                  fontWeight="medium"
                  transition="all 0.3s ease"
                >
                  {isLogin ? "Criar meu grimório pessoal" : "Já sou um membro da guilda de leitores"}
                </Text>
              </Flex>
              
              <Text fontSize="xs" color="whiteAlpha.700" textAlign="center" mt={2} fontStyle="italic">
                "Um livro é uma porta mágica para mundos infinitos"
              </Text>
            </VStack>
          </Box>
        </Container>
      </Center>
    </Box>
  );
}
