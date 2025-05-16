import React, { useState, useEffect } from 'react';
import {
  View, Text, Button, TextInput, StyleSheet, SafeAreaView, ActivityIndicator,
  Keyboard, TouchableWithoutFeedback, Platform, TouchableOpacity
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
        setError("User not authenticated. Please log in again.");
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
        setError("No assessment questions found. Please contact support.");
      }
    } catch (err: any) {
      console.error("Error loading questions:", err);
      setError(err.response?.data?.message || "Error loading questions. Please try again.");
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
        setError("User not authenticated. Cannot submit responses.");
        setLoading(false);
        return { success: false, message: "Missing token" };
      }

      console.log("Submitting actual responses to:", `${API_URL}/questions/submit-responses`);
      const response = await axios.post(`${API_URL}/questions/submit-responses`, 
        { responses: finalResponses },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      console.log("Responses submitted successfully:", response.data);
      return { success: true };
    } catch (error: any) {
      console.error("Error submitting responses:", error);
      setError(error.response?.data?.message || "Error submitting your responses. Please try again.");
      return { success: false, message: error.response?.data?.message || "Unknown error" };
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
      console.error("Failed to submit responses, see displayed error message.");
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
      <SafeAreaView style={styles.wrapper}>
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#0A1E42" />
          <Text style={styles.loadingText}>Loading questions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.wrapper}>
        <View style={styles.centeredContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.actionButton} onPress={fetchRandomQuestions}>
            <Text style={styles.actionButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.wrapper}>
        <View style={styles.centeredContainer}>
          <Text style={styles.infoText}>No questions to display at the moment, or you have already answered.</Text>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.replace('/(tabs)/profile')}>
            <Text style={styles.actionButtonText}>Go to Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = `${currentQuestionIndex + 1}/${questions.length}`;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.wrapper}>
        <View style={styles.contentContainer}>
          <Text style={styles.mainTitle}>Basic Assesment{"\n"}to match you with{"\n"}the Best Doctor{"\n"}and Create your Profile</Text>
          <Text style={styles.progressText}>Question {progress}</Text>
          
          <View style={styles.questionWrapper}>
            <Text style={styles.questionLabel}>Question {currentQuestionIndex + 1}</Text>
            {currentQuestion.type === 'Text' && (
              <TextInput
                style={styles.textInput}
                placeholder={`Answer for question ${currentQuestionIndex + 1}`}
                value={currentTextResponse}
                onChangeText={setCurrentTextResponse}
                multiline
              />
            )}

            {currentQuestion.type === 'YesNo' && (
              <View style={styles.yesNoContainer}>
                <TouchableOpacity 
                  style={[styles.choiceButton, currentTextResponse === 'Yes' && styles.choiceButtonSelected]} 
                  onPress={() => { handleYesNoResponse('Yes'); }}>
                  <Text style={[styles.choiceButtonText, currentTextResponse === 'Yes' && styles.choiceButtonTextSelected]}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.choiceButton, currentTextResponse === 'No' && styles.choiceButtonSelected]} 
                  onPress={() => { handleYesNoResponse('No'); }}>
                  <Text style={[styles.choiceButtonText, currentTextResponse === 'No' && styles.choiceButtonTextSelected]}>No</Text>
                </TouchableOpacity>
              </View>
            )}

            {currentQuestion.type === 'MultiChoice' && currentQuestion.options && (
              <View style={styles.multiChoiceContainer}>
                {currentQuestion.options.split(',').map(option => (
<<<<<<< HEAD
                  <View key={option} style={{ marginTop: 5, marginBottom: 5 }}>
                    <Button
                      title={option}
                      onPress={() => toggleMultiChoiceResponse(option)}
                      color={currentMultiChoiceResponse.includes(option) ? '#007bff' : '#6c757d'}
                    />
                  </View>
=======
                  <TouchableOpacity
                    key={option}
                    style={[styles.choiceButton, currentMultiChoiceResponse.includes(option) && styles.choiceButtonSelected]}
                    onPress={() => toggleMultiChoiceResponse(option)}
                  >
                    <Text style={[styles.choiceButtonText, currentMultiChoiceResponse.includes(option) && styles.choiceButtonTextSelected]}>{option.trim()}</Text>
                  </TouchableOpacity>
>>>>>>> 2046f736667140fac60a7467bc3c276e550e3ca0
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.actionButton, (loading || (currentQuestion.type === 'Text' && !currentTextResponse && currentQuestionIndex < questions.length) || (currentQuestion.type === 'YesNo' && !currentTextResponse && currentQuestionIndex < questions.length) ) && styles.actionButtonDisabled]}
            onPress={handleNextQuestion}
            disabled={loading || (currentQuestion.type === 'Text' && !currentTextResponse && !currentMultiChoiceResponse.length && currentQuestionIndex < questions.length) || (currentQuestion.type === 'YesNo' && !currentTextResponse && currentQuestionIndex < questions.length) }
          >
            {loading ? 
              <ActivityIndicator color="#FFFFFF" /> : 
              <Text style={styles.actionButtonText}>{currentQuestionIndex < questions.length - 1 ? 'Next' : 'Submit'}</Text>
            }
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0A1E42',
    textAlign: 'center',
    marginBottom: 10,
  },
  progressText: {
    fontSize: 18,
    color: '#0A1E42',
    marginBottom: 30,
    textAlign: 'center',
  },
  questionWrapper: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  questionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0A1E42',
    marginBottom: 15,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#111827',
    width: '100%',
    backgroundColor: '#FFFFFF',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  yesNoContainer: {
    width: '100%',
    marginTop: 10,
  },
  multiChoiceContainer: {
    width: '100%',
    marginTop: 10,
  },
  choiceButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  choiceButtonSelected: {
    backgroundColor: '#7BAFD4',
    borderColor: '#7BAFD4',
  },
  choiceButtonText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  choiceButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: '#7BAFD4',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    minHeight: 50,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionButtonDisabled: {
    backgroundColor: '#A0AEC0',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#546e7a',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
  },
  infoText: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
    color: '#333',
  }
});

export default AssessmentScreen; 