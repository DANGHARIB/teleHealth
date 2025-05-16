import React, { useState, useEffect } from 'react';
import {
  View, Text, Button, TextInput, StyleSheet, SafeAreaView, ActivityIndicator,
  Keyboard, TouchableWithoutFeedback, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000/api';

// Interfaces pour les types de données
interface Question {
  _id: string;
  questionText: string;
  type: 'YesNo' | 'MultiChoice' | 'Text';
  options?: string; // Pour MultiChoice, les options seront une chaîne séparée par des virgules
}

interface PatientResponseItem {
  questionId: string;
  response: string | string[];
}

const AssessmentScreen = () => {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<PatientResponseItem[]>([]);
  const [currentTextResponse, setCurrentTextResponse] = useState('');
  const [currentMultiChoiceResponse, setCurrentMultiChoiceResponse] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRandomQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setError("Utilisateur non authentifié. Veuillez vous reconnecter.");
        // Optionnel: rediriger vers login si pas de token
        // router.replace('/patient/auth/login'); 
        setLoading(false);
        return;
      }

      // Remplacer par votre appel API réel pour fetchRandomQuestions
      // Assurez-vous d'envoyer le token dans les headers
      const response = await axios.get(`${API_URL}/questions/random/assessment`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.hasAnswered) {
        router.replace('/(tabs)/profile');
        return;
      }
      
      if (response.data.questions && response.data.questions.length > 0) {
        setQuestions(response.data.questions);
      } else {
        setError("Aucune question d'évaluation trouvée. Veuillez contacter le support.");
      }
    } catch (err: any) {
      console.error("Erreur lors du chargement des questions:", err);
      setError(err.response?.data?.message || "Erreur lors du chargement des questions. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };
  
  const submitResponsesApi = async (finalResponses: PatientResponseItem[]) => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setError("Utilisateur non authentifié. Impossible de soumettre les réponses.");
        setLoading(false);
        return { success: false, message: "Token manquant" };
      }

      console.log("Soumission des réponses réelles vers:", `${API_URL}/questions/submit-responses`);
      const response = await axios.post(`${API_URL}/questions/submit-responses`, 
        { responses: finalResponses },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      console.log("Réponses soumises avec succès:", response.data);
      return { success: true };
    } catch (error: any) {
      console.error("Erreur lors de la soumission des réponses:", error);
      setError(error.response?.data?.message || "Erreur lors de la soumission de vos réponses. Veuillez réessayer.");
      return { success: false, message: error.response?.data?.message || "Erreur inconnue" };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomQuestions();
  }, []);

  const handleNextQuestion = () => {
    const currentQuestion = questions[currentQuestionIndex];
    let responseValue: string | string[];

    if (currentQuestion.type === 'Text') {
      responseValue = currentTextResponse;
    } else if (currentQuestion.type === 'YesNo') {
      responseValue = currentTextResponse; 
    } else if (currentQuestion.type === 'MultiChoice') {
      responseValue = currentMultiChoiceResponse;
    } else {
      responseValue = '';
    }

    const newResponse: PatientResponseItem = {
      questionId: currentQuestion._id,
      response: responseValue,
    };
    const updatedResponses = [...responses, newResponse];
    setResponses(updatedResponses);

    setCurrentTextResponse('');
    setCurrentMultiChoiceResponse([]);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit(updatedResponses);
    }
  };

  const handleSubmit = async (finalResponses: PatientResponseItem[]) => {
    setLoading(true);
    const result = await submitResponsesApi(finalResponses);
    setLoading(false);
    if (result.success) {
      router.replace('/(tabs)/profile');
    } else {
      // L'erreur est déjà gérée et affichée par setError dans submitResponsesApi
      // On pourrait vouloir un feedback plus spécifique ici si nécessaire
      console.error("Échec de la soumission des réponses, voir message d'erreur affiché.");
    }
  };
  
  const handleYesNoResponse = (response: 'Yes' | 'No') => {
    setCurrentTextResponse(response); 
  };

  const toggleMultiChoiceResponse = (option: string) => {
    setCurrentMultiChoiceResponse(prev =>
      prev.includes(option) ? prev.filter(item => item !== option) : [...prev, option]
    );
  };

  if (loading && questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>Chargement des questions...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Réessayer" onPress={fetchRandomQuestions} />
      </SafeAreaView>
    );
  }

  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Aucune question à afficher pour le moment ou vous avez déjà répondu.</Text>
        <Button title="Aller au profil" onPress={() => router.replace('/(tabs)/profile')} />
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = `${currentQuestionIndex + 1}/${questions.length}`;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Basic Assessment</Text>
          <Text style={styles.progressText}>Question {progress}</Text>
          
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>{currentQuestion.questionText}</Text>
            
            {currentQuestion.type === 'Text' && (
              <TextInput
                style={styles.textInput}
                placeholder="Votre réponse"
                value={currentTextResponse}
                onChangeText={setCurrentTextResponse}
                multiline
              />
            )}

            {currentQuestion.type === 'YesNo' && (
              <View style={styles.yesNoContainer}>
                <Button title="Oui" onPress={() => { handleYesNoResponse('Yes'); }} />
                <Button title="Non" onPress={() => { handleYesNoResponse('No'); }} />
                {currentTextResponse && <Text style={styles.selectionText}>Sélection: {currentTextResponse}</Text>}
              </View>
            )}

            {currentQuestion.type === 'MultiChoice' && currentQuestion.options && (
              <View>
                {currentQuestion.options.split(',').map(option => (
                  <Button
                    key={option}
                    title={option}
                    onPress={() => toggleMultiChoiceResponse(option)}
                    color={currentMultiChoiceResponse.includes(option) ? '#007bff' : '#6c757d'}
                  />
                ))}
              </View>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title={currentQuestionIndex < questions.length - 1 ? 'Next' : 'Submit'}
              onPress={handleNextQuestion}
              disabled={loading || (currentQuestion.type === 'Text' && !currentTextResponse && !currentMultiChoiceResponse.length && currentQuestionIndex < questions.length) || (currentQuestion.type === 'YesNo' && !currentTextResponse && currentQuestionIndex < questions.length) }
            />
          </View>
          {loading && <ActivityIndicator style={{ marginTop: 20 }} />}
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a5f', // Bleu marine foncé
    marginBottom: 10,
    textAlign: 'center',
  },
  progressText: {
    fontSize: 16,
    color: '#546e7a', // Gris bleu
    marginBottom: 30,
    textAlign: 'center',
  },
  questionContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionText: {
    fontSize: 18,
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ced4da', // Bordure grise claire
    borderRadius: 5,
    padding: 15,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top', // Pour Android
    width: '100%',
    backgroundColor: '#f8f9fa',
  },
  yesNoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 10,
  },
  selectionText: {
    marginTop: 10,
    fontSize: 14,
    color: '#007bff',
    textAlign: 'center',
    width: '100%',
  },
  // Styles pour les boutons MultiChoice à améliorer (ex: Checkbox)
  // Les boutons actuels sont juste pour la fonctionnalité de base
  buttonContainer: {
    width: '80%',
    marginTop: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  }
});

export default AssessmentScreen; 