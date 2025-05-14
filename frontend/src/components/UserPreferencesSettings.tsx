import { useState, useEffect } from 'react';
import {
  Box, Heading, Switch, FormControl, FormLabel, 
  Text, Spinner, useToast, Button
} from '@chakra-ui/react';
import { recommendationApi } from '../services/api';

export default function UserPreferencesSettings() {
  const [automatedRecommendationsEnabled, setAutomatedRecommendationsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await recommendationApi.getRecommendationSettings();
        setAutomatedRecommendationsEnabled(settings.automatedRecommendationsEnabled);
      } catch (error: unknown) {
        console.error('Error fetching settings:', error);
        // Não exibir toast para usuários que ainda não configuraram preferências
        // A API pode retornar 404 ou outro código específico nesses casos
        const isHttpError = error && typeof error === 'object' && 'response' in error;
        if (!isHttpError || (isHttpError && (error as any).response?.status !== 404)) {
          toast({
            title: "Erro",
            description: "Não foi possível carregar suas configurações.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
        // Define recomendações como habilitadas por padrão
        setAutomatedRecommendationsEnabled(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [toast]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await recommendationApi.toggleAutomatedRecommendations(automatedRecommendationsEnabled);
      
      toast({
        title: "Sucesso",
        description: "Suas configurações foram atualizadas.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar suas configurações.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box textAlign="center" p={6}>
        <Spinner size="xl" color="purple.500" />
        <Text mt={4}>Carregando configurações...</Text>
      </Box>
    );
  }

  return (
    <Box p={6} bg="white" borderRadius="lg" boxShadow="md">
      <Heading size="md" mb={6}>Configurações de Recomendações</Heading>
      
      <FormControl display="flex" alignItems="center" mb={4}>
        <FormLabel htmlFor="automated-recommendations" mb="0">
          Recomendações Automáticas
        </FormLabel>
        <Switch
          id="automated-recommendations"
          isChecked={automatedRecommendationsEnabled}
          onChange={() => setAutomatedRecommendationsEnabled(!automatedRecommendationsEnabled)}
          colorScheme="purple"
        />
      </FormControl>
      
      <Text fontSize="sm" color="gray.600" mb={6}>
        Quando ativadas, as recomendações automáticas aparecerão na sua página inicial com sugestões 
        baseadas nas suas preferências e histórico de leitura.
      </Text>
      
      <Button
        colorScheme="purple"
        onClick={handleSaveSettings}
        isLoading={saving}
      >
        Salvar Configurações
      </Button>
    </Box>
  );
}
