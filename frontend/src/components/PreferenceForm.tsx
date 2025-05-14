import { useEffect, useState, useRef } from 'react';
import {
  Box, Button, FormControl, FormLabel, Heading, 
  Text, Spinner, Flex, useToast,
  SimpleGrid, Tag, TagLabel, TagCloseButton,
  Input, Divider, Accordion, AccordionItem,
  AccordionButton, AccordionPanel, AccordionIcon,
  Checkbox, CheckboxGroup, Stack
} from '@chakra-ui/react';
import { preferenceApi } from '../services/api';

interface Trope {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface PreferenceFormProps {
  initialPreferences: any;
  isLoading: boolean;
  onSaved: () => void;
}

interface Language {
  id: string;
  code: string;
  name: string;
}

export default function PreferenceForm({ initialPreferences, isLoading, onSaved }: PreferenceFormProps) {
  const [allTropes, setAllTropes] = useState<Trope[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Preferences state
  const [likedTropes, setLikedTropes] = useState<Trope[]>([]);
  const [dislikedTropes, setDislikedTropes] = useState<Trope[]>([]);
  const [likedCategories, setLikedCategories] = useState<string[]>([]);
  const [dislikedCategories, setDislikedCategories] = useState<string[]>([]);
  const [likedAuthors, setLikedAuthors] = useState<string[]>([]);
  const [dislikedAuthors, setDislikedAuthors] = useState<string[]>([]);
  
  // Separate input states for each field
  const [likedCategoryInput, setLikedCategoryInput] = useState('');
  const [dislikedCategoryInput, setDislikedCategoryInput] = useState('');
  const [likedAuthorInput, setLikedAuthorInput] = useState('');
  const [dislikedAuthorInput, setDislikedAuthorInput] = useState('');
  
  // Search results state
  const [categorySearchResults, setCategorySearchResults] = useState<string[]>([]);
  const [authorSearchResults, setAuthorSearchResults] = useState<{id: string, name: string}[]>([]);
  
  // Ref for container to enable scrolling
  const formContainerRef = useRef<HTMLDivElement>(null);
  
  const toast = useToast();
  
  // Add state for languages
  const [languages, setLanguages] = useState<string[]>([]);
  
  useEffect(() => {
    const fetchTropes = async () => {
      try {
        const tropes = await preferenceApi.getAllTropes();
        setAllTropes(tropes);
      } catch (error: unknown) {
        console.error('Error fetching tropes:', error);
        // Apenas mostrar toast para erros que não sejam 404
        if (error instanceof Error) {
          toast({
            title: "Erro",
            description: "Não foi possível carregar as tropes.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTropes();
  }, [toast]);

  useEffect(() => {
    if (initialPreferences && !isLoading) {
      // Set liked tropes
      if (initialPreferences.likedTropes) {
        setLikedTropes(initialPreferences.likedTropes);
      }
      
      // Set disliked tropes
      if (initialPreferences.dislikedTropes) {
        setDislikedTropes(initialPreferences.dislikedTropes);
      }
      
      // Set categories
      if (initialPreferences.likedCategories) {
        setLikedCategories(initialPreferences.likedCategories.map((c: any) => c.name));
      }
      
      if (initialPreferences.dislikedCategories) {
        setDislikedCategories(initialPreferences.dislikedCategories.map((c: any) => c.name));
      }
      
      // Set authors
      if (initialPreferences.likedAuthors) {
        setLikedAuthors(initialPreferences.likedAuthors.map((a: any) => a.name));
      }
      
      if (initialPreferences.dislikedAuthors) {
        setDislikedAuthors(initialPreferences.dislikedAuthors.map((a: any) => a.name));
      }

      // Set languages
      if (initialPreferences.languages) {
        setLanguages(initialPreferences.languages.map((l: Language) => l.code));
      } else {
        // Default to Portuguese if no language is set
        setLanguages(['pt']);
      }
    }
  }, [initialPreferences, isLoading]);

  const handleToggleTrope = (trope: Trope, listType: 'liked' | 'disliked') => {
    if (listType === 'liked') {
      if (likedTropes.some(t => t.id === trope.id)) {
        setLikedTropes(likedTropes.filter(t => t.id !== trope.id));
      } else {
        setLikedTropes([...likedTropes, trope]);
        // Remove from disliked if present
        setDislikedTropes(dislikedTropes.filter(t => t.id !== trope.id));
      }
    } else {
      if (dislikedTropes.some(t => t.id === trope.id)) {
        setDislikedTropes(dislikedTropes.filter(t => t.id !== trope.id));
      } else {
        setDislikedTropes([...dislikedTropes, trope]);
        // Remove from liked if present
        setLikedTropes(likedTropes.filter(t => t.id !== trope.id));
      }
    }
  };

  // Search for categories based on input
  const handleCategorySearch = async (query: string, setInput: React.Dispatch<React.SetStateAction<string>>) => {
    setInput(query);
    
    if (query.length < 2) {
      setCategorySearchResults([]);
      return;
    }
    
    try {
      // Simulate category search - this would ideally call an API endpoint
      // We'll use some common book categories for demo purposes
      const commonCategories = [
        'Romance', 'Fantasy', 'Science Fiction', 'Mystery', 'Thriller',
        'Horror', 'Biography', 'History', 'Self-Help', 'Fiction', 
        'Non-Fiction', 'Cooking', 'Art', 'Travel', 'Children',
        'Young Adult', 'Poetry', 'Drama', 'Comics', 'Graphic Novel'
      ];
      
      const results = commonCategories.filter(
        cat => cat.toLowerCase().includes(query.toLowerCase())
      );
      
      setCategorySearchResults(results);
    } catch (error) {
      console.error('Error searching categories:', error);
      setCategorySearchResults([]);
    }
  };

  // Handle adding a category
  const handleAddCategory = (category: string, listType: 'liked' | 'disliked') => {
    const trimmedCategory = category.trim();
    if (!trimmedCategory) return;
    
    if (listType === 'liked') {
      if (!likedCategories.includes(trimmedCategory)) {
        setLikedCategories([...likedCategories, trimmedCategory]);
        // Remove from disliked if present
        setDislikedCategories(dislikedCategories.filter(c => c !== trimmedCategory));
      }
      setLikedCategoryInput(''); // Clear only the liked input
    } else {
      if (!dislikedCategories.includes(trimmedCategory)) {
        setDislikedCategories([...dislikedCategories, trimmedCategory]);
        // Remove from liked if present
        setLikedCategories(likedCategories.filter(c => c !== trimmedCategory));
      }
      setDislikedCategoryInput(''); // Clear only the disliked input
    }
    
    setCategorySearchResults([]);
  };

  const handleRemoveCategory = (category: string, listType: 'liked' | 'disliked') => {
    if (listType === 'liked') {
      setLikedCategories(likedCategories.filter(c => c !== category));
    } else {
      setDislikedCategories(dislikedCategories.filter(c => c !== category));
    }
  };

  const handleAuthorSearch = async (query: string, setInput: React.Dispatch<React.SetStateAction<string>>) => {
    setInput(query);
    
    if (query.length < 2) {
      setAuthorSearchResults([]);
      return;
    }
    
    try {
      const results = await preferenceApi.searchAuthors(query);
      setAuthorSearchResults(results);
    } catch (error) {
      console.error('Error searching authors:', error);
    }
  };

  const handleAddAuthor = (author: string, listType: 'liked' | 'disliked') => {
    const trimmedAuthor = author.trim();
    if (!trimmedAuthor) return;
    
    if (listType === 'liked') {
      if (!likedAuthors.includes(trimmedAuthor)) {
        setLikedAuthors([...likedAuthors, trimmedAuthor]);
        // Remove from disliked if present
        setDislikedAuthors(dislikedAuthors.filter(a => a !== trimmedAuthor));
      }
      setLikedAuthorInput(''); // Clear only the liked input
    } else {
      if (!dislikedAuthors.includes(trimmedAuthor)) {
        setDislikedAuthors([...dislikedAuthors, trimmedAuthor]);
        // Remove from liked if present
        setLikedAuthors(likedAuthors.filter(a => a !== trimmedAuthor));
      }
      setDislikedAuthorInput(''); // Clear only the disliked input
    }
    
    setAuthorSearchResults([]);
  };

  const handleRemoveAuthor = (author: string, listType: 'liked' | 'disliked') => {
    if (listType === 'liked') {
      setLikedAuthors(likedAuthors.filter(a => a !== author));
    } else {
      setDislikedAuthors(dislikedAuthors.filter(a => a !== author));
    }
  };

  const handleLanguageChange = (selectedLanguages: string[]) => {
    setLanguages(selectedLanguages);
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    
    try {
      // Save trope preferences
      await preferenceApi.updateTropePreferences({
        likedTropeIds: likedTropes.map(t => t.id),
        dislikedTropeIds: dislikedTropes.map(t => t.id)
      });
      
      // Save category preferences
      await preferenceApi.updateCategoryPreferences({
        likedCategories,
        dislikedCategories
      });
      
      // Save author preferences
      await preferenceApi.updateAuthorPreferences({
        likedAuthors,
        dislikedAuthors
      });
      
      // Save language preferences
      await preferenceApi.updateLanguagePreferences({
        languages
      });
      
      onSaved();
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar suas preferências.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || isLoading) {
    return (
      <Box textAlign="center" p={6}>
        <Spinner size="xl" color="purple.500" />
        <Text mt={4}>Carregando preferências...</Text>
      </Box>
    );
  }

  const groupedTropes = {
    Romance: allTropes.filter(t => t.category === 'Romance'),
    SciFiFantasy: allTropes.filter(t => t.category === 'SciFiFantasy'),
    Drama: allTropes.filter(t => t.category === 'Drama')
  };

  return (
    <Box 
      ref={formContainerRef} 
      maxH="70vh" 
      overflowY="auto" 
      px={{ base: 0, sm: 2, md: 2 }}
      py={{base: 4}} // Add consistent horizontal padding
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
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: '#a8a8a8',
        },
      }}
    >
      <Heading size="md" mb={4}>Minhas Preferências de Leitura</Heading>
      <Text mb={6} color="gray.600">
        Conte-nos sobre seus gostos literários para recebermos recomendações mais precisas.
      </Text>

      <Accordion defaultIndex={[0]} allowMultiple>
        {/* Language Section - Add this new section */}
        <AccordionItem>
          <AccordionButton py={3}>
            <Box flex="1" textAlign="left" fontWeight="bold">
              Idiomas
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            <Box mb={6}>
              <FormControl>
                <FormLabel fontWeight="medium">Em quais idiomas você lê livros?</FormLabel>
                <Text fontSize="sm" color="gray.600" mb={3}>
                  Suas recomendações serão filtradas por esses idiomas.
                </Text>
                
                <CheckboxGroup 
                  colorScheme="purple" 
                  value={languages} 
                  onChange={handleLanguageChange}
                >
                  <Stack spacing={3}>
                    <Checkbox value="pt">Português</Checkbox>
                    <Checkbox value="en">Inglês</Checkbox>
                  </Stack>
                </CheckboxGroup>
                
                {languages.length === 0 && (
                  <Text color="red.500" fontSize="sm" mt={2}>
                    Selecione pelo menos um idioma
                  </Text>
                )}
              </FormControl>
            </Box>
          </AccordionPanel>
        </AccordionItem>

        {/* Categories Section */}
        <AccordionItem>
          <AccordionButton py={3}>
            <Box flex="1" textAlign="left" fontWeight="bold">
              Categorias Literárias
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            <Box mb={6}>
              <FormControl mb={4} position="relative">
                <FormLabel fontWeight="medium">Categorias que eu gosto:</FormLabel>
                <Flex 
                  mb={2} 
                  direction={{ base: "column", md: "row" }} // Stack vertically on mobile
                  gap={{ base: 2, md: 0 }} // Add gap between elements on mobile
                >
                  <Input 
                    value={likedCategoryInput}
                    onChange={(e) => handleCategorySearch(e.target.value, setLikedCategoryInput)}
                    placeholder="Digite uma categoria (ex: Fantasia, Romance)"
                    mr={{ base: 0, md: 2 }} // Remove right margin on mobile
                    mb={{ base: 0, md: 0 }} // Add bottom margin on mobile
                  />
                  <Button 
                    onClick={() => handleAddCategory(likedCategoryInput, 'liked')}
                    colorScheme="green"
                    width={{ base: "full", md: "auto" }} // Full width on mobile
                  >
                    Adicionar
                  </Button>
                </Flex>
                
                {categorySearchResults.length > 0 && likedCategoryInput && (
                  <Box 
                    position="absolute" 
                    zIndex={2}
                    bg="white" 
                    width="calc(100% - 110px)" // Subtract the button width + margin
                    boxShadow="md" 
                    borderRadius="md"
                    mt={1}
                    maxH="200px"
                    overflowY="auto"
                  >
                    {categorySearchResults.map((category, index) => (
                      <Box 
                        key={index} 
                        p={2} 
                        _hover={{ bg: "gray.100" }}
                        cursor="pointer"
                        onClick={() => handleAddCategory(category, 'liked')}
                      >
                        {category}
                      </Box>
                    ))}
                  </Box>
                )}
                
                <Flex wrap="wrap" gap={2} mt={2}>
                  {likedCategories.map(category => (
                    <Tag 
                      key={category} 
                      size="md" 
                      borderRadius="full" 
                      variant="solid" 
                      colorScheme="green"
                    >
                      <TagLabel>{category}</TagLabel>
                      <TagCloseButton onClick={() => handleRemoveCategory(category, 'liked')} />
                    </Tag>
                  ))}
                </Flex>
              </FormControl>

              <FormControl position="relative">
                <FormLabel fontWeight="medium">Categorias que eu não gosto:</FormLabel>
                <Flex 
                  mb={2} 
                  direction={{ base: "column", md: "row" }} // Stack vertically on mobile
                  gap={{ base: 2, md: 0 }} // Add gap between elements on mobile
                >
                  <Input 
                    value={dislikedCategoryInput}
                    onChange={(e) => handleCategorySearch(e.target.value, setDislikedCategoryInput)}
                    placeholder="Digite uma categoria"
                    mr={{ base: 0, md: 2 }} // Remove right margin on mobile
                  />
                  <Button 
                    onClick={() => handleAddCategory(dislikedCategoryInput, 'disliked')}
                    colorScheme="red"
                    width={{ base: "full", md: "auto" }} // Full width on mobile
                  >
                    Adicionar
                  </Button>
                </Flex>
                
                {categorySearchResults.length > 0 && dislikedCategoryInput && (
                  <Box 
                    position="absolute" 
                    zIndex={2}
                    bg="white" 
                    width="calc(100% - 110px)" // Subtract the button width + margin
                    boxShadow="md" 
                    borderRadius="md"
                    mt={1}
                    maxH="200px"
                    overflowY="auto"
                  >
                    {categorySearchResults.map((category, index) => (
                      <Box 
                        key={index} 
                        p={2} 
                        _hover={{ bg: "gray.100" }}
                        cursor="pointer"
                        onClick={() => handleAddCategory(category, 'disliked')}
                      >
                        {category}
                      </Box>
                    ))}
                  </Box>
                )}
                
                <Flex wrap="wrap" gap={2} mt={2}>
                  {dislikedCategories.map(category => (
                    <Tag 
                      key={category} 
                      size="md" 
                      borderRadius="full" 
                      variant="solid" 
                      colorScheme="red"
                    >
                      <TagLabel>{category}</TagLabel>
                      <TagCloseButton onClick={() => handleRemoveCategory(category, 'disliked')} />
                    </Tag>
                  ))}
                </Flex>
              </FormControl>
            </Box>
          </AccordionPanel>
        </AccordionItem>

        {/* Authors Section */}
        <AccordionItem>
          <AccordionButton py={3}>
            <Box flex="1" textAlign="left" fontWeight="bold">
              Autores
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            <Box mb={6}>
              <FormControl mb={4} position="relative">
                <FormLabel fontWeight="medium">Autores que eu gosto:</FormLabel>
                <Flex 
                  mb={2} 
                  direction={{ base: "column", md: "row" }} // Stack vertically on mobile
                  gap={{ base: 2, md: 0 }} // Add gap between elements on mobile
                >
                  <Input 
                    value={likedAuthorInput}
                    onChange={(e) => handleAuthorSearch(e.target.value, setLikedAuthorInput)}
                    placeholder="Digite o nome de um autor"
                    mr={{ base: 0, md: 2 }} // Remove right margin on mobile
                  />
                  <Button 
                    onClick={() => handleAddAuthor(likedAuthorInput, 'liked')}
                    colorScheme="green"
                    width={{ base: "full", md: "auto" }} // Full width on mobile
                  >
                    Adicionar
                  </Button>
                </Flex>
                
                {authorSearchResults.length > 0 && likedAuthorInput && (
                  <Box 
                    position="absolute" 
                    zIndex={2}
                    bg="white" 
                    width="calc(100% - 110px)" // Subtract the button width + margin
                    boxShadow="md" 
                    borderRadius="md"
                    mt={1}
                    maxH="200px"
                    overflowY="auto"
                  >
                    {authorSearchResults.map(author => (
                      <Box 
                        key={author.id} 
                        p={2} 
                        _hover={{ bg: "gray.100" }}
                        cursor="pointer"
                        onClick={() => handleAddAuthor(author.name, 'liked')}
                      >
                        {author.name}
                      </Box>
                    ))}
                  </Box>
                )}
                
                <Flex wrap="wrap" gap={2} mt={2}>
                  {likedAuthors.map(author => (
                    <Tag 
                      key={author} 
                      size="md" 
                      borderRadius="full" 
                      variant="solid" 
                      colorScheme="green"
                    >
                      <TagLabel>{author}</TagLabel>
                      <TagCloseButton onClick={() => handleRemoveAuthor(author, 'liked')} />
                    </Tag>
                  ))}
                </Flex>
              </FormControl>

              <FormControl position="relative">
                <FormLabel fontWeight="medium">Autores que eu não gosto:</FormLabel>
                <Flex 
                  mb={2} 
                  direction={{ base: "column", md: "row" }} // Stack vertically on mobile
                  gap={{ base: 2, md: 0 }} // Add gap between elements on mobile
                >
                  <Input 
                    value={dislikedAuthorInput}
                    onChange={(e) => handleAuthorSearch(e.target.value, setDislikedAuthorInput)}
                    placeholder="Digite o nome de um autor"
                    mr={{ base: 0, md: 2 }} // Remove right margin on mobile
                  />
                  <Button 
                    onClick={() => handleAddAuthor(dislikedAuthorInput, 'disliked')}
                    colorScheme="red"
                    width={{ base: "full", md: "auto" }} // Full width on mobile
                  >
                    Adicionar
                  </Button>
                </Flex>
                
                {authorSearchResults.length > 0 && dislikedAuthorInput && (
                  <Box 
                    position="absolute" 
                    zIndex={2}
                    bg="white" 
                    width="calc(100% - 110px)" // Subtract the button width + margin
                    boxShadow="md" 
                    borderRadius="md"
                    mt={1}
                    maxH="200px"
                    overflowY="auto"
                  >
                    {authorSearchResults.map(author => (
                      <Box 
                        key={author.id} 
                        p={2} 
                        _hover={{ bg: "gray.100" }}
                        cursor="pointer"
                        onClick={() => handleAddAuthor(author.name, 'disliked')}
                      >
                        {author.name}
                      </Box>
                    ))}
                  </Box>
                )}
                
                <Flex wrap="wrap" gap={2} mt={2}>
                  {dislikedAuthors.map(author => (
                    <Tag 
                      key={author} 
                      size="md" 
                      borderRadius="full" 
                      variant="solid" 
                      colorScheme="red"
                    >
                      <TagLabel>{author}</TagLabel>
                      <TagCloseButton onClick={() => handleRemoveAuthor(author, 'disliked')} />
                    </Tag>
                  ))}
                </Flex>
              </FormControl>
            </Box>
          </AccordionPanel>
        </AccordionItem>

        {/* Tropes Section */}
        <AccordionItem>
          <AccordionButton py={3}>
            <Box flex="1" textAlign="left" fontWeight="bold">
              Tropes Literárias
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            {/* Romance Tropes */}
            <Box mb={6}>
              <Heading size="sm" mb={3}>Tropes de Romance</Heading>
              <Text mb={4} fontSize="sm" color="gray.600">
                Selecione as tropes que você gosta ou não gosta.
              </Text>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {groupedTropes.Romance.map(trope => (
                  <Box 
                    key={trope.id} 
                    p={3} 
                    borderWidth={1} 
                    borderRadius="md" 
                    borderColor={
                      likedTropes.some(t => t.id === trope.id) ? "green.400" :
                      dislikedTropes.some(t => t.id === trope.id) ? "red.400" : 
                      "gray.200"
                    }
                    bg={
                      likedTropes.some(t => t.id === trope.id) ? "green.50" :
                      dislikedTropes.some(t => t.id === trope.id) ? "red.50" : 
                      "white"
                    }
                  >
                    <Flex justify="space-between" align="center">
                      <Text fontWeight="medium">{trope.name}</Text>
                      <Flex>
                        <Button 
                          size="sm" 
                          colorScheme={likedTropes.some(t => t.id === trope.id) ? "green" : "gray"}
                          variant={likedTropes.some(t => t.id === trope.id) ? "solid" : "outline"}
                          onClick={() => handleToggleTrope(trope, 'liked')}
                          mr={1}
                        >
                          👍
                        </Button>
                        <Button 
                          size="sm" 
                          colorScheme={dislikedTropes.some(t => t.id === trope.id) ? "red" : "gray"}
                          variant={dislikedTropes.some(t => t.id === trope.id) ? "solid" : "outline"}
                          onClick={() => handleToggleTrope(trope, 'disliked')}
                        >
                          👎
                        </Button>
                      </Flex>
                    </Flex>
                    <Text fontSize="sm" color="gray.600" mt={1}>
                      {trope.description}
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>
            </Box>

            <Divider my={6} />

            {/* SciFi/Fantasy Tropes */}
            <Box mb={6}>
              <Heading size="sm" mb={3}>Tropes de Ficção Científica/Fantasia</Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {groupedTropes.SciFiFantasy.map(trope => (
                  <Box 
                    key={trope.id} 
                    p={3} 
                    borderWidth={1} 
                    borderRadius="md" 
                    borderColor={
                      likedTropes.some(t => t.id === trope.id) ? "green.400" :
                      dislikedTropes.some(t => t.id === trope.id) ? "red.400" : 
                      "gray.200"
                    }
                    bg={
                      likedTropes.some(t => t.id === trope.id) ? "green.50" :
                      dislikedTropes.some(t => t.id === trope.id) ? "red.50" : 
                      "white"
                    }
                  >
                    <Flex justify="space-between" align="center">
                      <Text fontWeight="medium">{trope.name}</Text>
                      <Flex>
                        <Button 
                          size="sm" 
                          colorScheme={likedTropes.some(t => t.id === trope.id) ? "green" : "gray"}
                          variant={likedTropes.some(t => t.id === trope.id) ? "solid" : "outline"}
                          onClick={() => handleToggleTrope(trope, 'liked')}
                          mr={1}
                        >
                          👍
                        </Button>
                        <Button 
                          size="sm" 
                          colorScheme={dislikedTropes.some(t => t.id === trope.id) ? "red" : "gray"}
                          variant={dislikedTropes.some(t => t.id === trope.id) ? "solid" : "outline"}
                          onClick={() => handleToggleTrope(trope, 'disliked')}
                        >
                          👎
                        </Button>
                      </Flex>
                    </Flex>
                    <Text fontSize="sm" color="gray.600" mt={1}>
                      {trope.description}
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>
            </Box>

            <Divider my={6} />

            {/* Drama/Narrative Tropes */}
            <Box mb={6}>
              <Heading size="sm" mb={3}>Tropes de Drama e Narrativa</Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {groupedTropes.Drama.map(trope => (
                  <Box 
                    key={trope.id} 
                    p={3} 
                    borderWidth={1} 
                    borderRadius="md" 
                    borderColor={
                      likedTropes.some(t => t.id === trope.id) ? "green.400" :
                      dislikedTropes.some(t => t.id === trope.id) ? "red.400" : 
                      "gray.200"
                    }
                    bg={
                      likedTropes.some(t => t.id === trope.id) ? "green.50" :
                      dislikedTropes.some(t => t.id === trope.id) ? "red.50" : 
                      "white"
                    }
                  >
                    <Flex justify="space-between" align="center">
                      <Text fontWeight="medium">{trope.name}</Text>
                      <Flex>
                        <Button 
                          size="sm" 
                          colorScheme={likedTropes.some(t => t.id === trope.id) ? "green" : "gray"}
                          variant={likedTropes.some(t => t.id === trope.id) ? "solid" : "outline"}
                          onClick={() => handleToggleTrope(trope, 'liked')}
                          mr={1}
                        >
                          👍
                        </Button>
                        <Button 
                          size="sm" 
                          colorScheme={dislikedTropes.some(t => t.id === trope.id) ? "red" : "gray"}
                          variant={dislikedTropes.some(t => t.id === trope.id) ? "solid" : "outline"}
                          onClick={() => handleToggleTrope(trope, 'disliked')}
                        >
                          👎
                        </Button>
                      </Flex>
                    </Flex>
                    <Text fontSize="sm" color="gray.600" mt={1}>
                      {trope.description}
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>
            </Box>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>

      <Flex justify="center" mt={8} mb={4}>
        <Button 
          colorScheme="purple" 
          size="lg" 
          onClick={handleSavePreferences}
          isLoading={saving}
          loadingText="Salvando..."
          px={8}
          isDisabled={languages.length === 0}
        >
          Salvar Preferências
        </Button>
      </Flex>
    </Box>
  );
}
