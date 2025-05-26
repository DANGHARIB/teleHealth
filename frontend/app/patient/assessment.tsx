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
  id: number;
  questionText: string;
  type: 'YesNo' | 'MultiChoice' | 'Text';
  options: any; // Format varies based on type
  scoring: Record<string, string>;
}

interface PatientResponseItem {
  questionId: string;
  response: string | string[];
}

interface MultiChoiceOption {
  key: string;
  label: string;
}

const AssessmentScreen = () => {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<PatientResponseItem[]>([]);
  const [currentTextResponse, setCurrentTextResponse] = useState('');
  const [currentMultiChoiceResponse, setCurrentMultiChoiceResponse] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssessmentQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setError("User not authenticated. Please log in again.");
        setLoading(false);
        return;
      }

      console.log("Fetching assessment questions...");
      const response = await axios.get(`${API_URL}/questions/assessment`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log("Assessment API response:", JSON.stringify(response.data, null, 2));

      if (response.data.hasAnswered) {
        console.log("User has already answered assessment questions");
        router.replace('/(patient)/(tabs)');
        return;
      }
      
      if (response.data.questions && response.data.questions.length > 0) {
        console.log(`Received ${response.data.questions.length} questions`);
        console.log("First question sample:", JSON.stringify(response.data.questions[0], null, 2));
        
        // Log all question IDs to verify they're formatted correctly
        const questionIds = response.data.questions.map((q: Question) => q._id);
        console.log("Question IDs:", questionIds);
        
        setQuestions(response.data.questions);
      } else {
        setError("No assessment questions found. Please contact support.");
      }
    } catch (err: any) {
      console.error("Error loading questions:", err);
      if (err.response) {
        console.error("API Error response:", JSON.stringify(err.response.data, null, 2));
      }
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

      // Debug - Log the exact responses being sent
      console.log("---------------------------");
      console.log("ASSESSMENT SUBMISSION DEBUG");
      console.log("Endpoint:", `${API_URL}/questions/submit-responses`);
      console.log("Authorization token available:", !!token);
      console.log("Number of responses:", finalResponses.length);
      
      // Validate responses format before sending
      const validResponses = finalResponses.filter(resp => {
        const isValid = resp.questionId && (typeof resp.response === 'string' || Array.isArray(resp.response));
        if (!isValid) {
          console.error("Invalid response item:", resp);
        }
        return isValid;
      });
      
      console.log("Valid responses count:", validResponses.length);
      console.log("Response data:", JSON.stringify({ responses: validResponses }, null, 2));
      
      // Make sure we're sending the right structure
      // The backend expects: { responses: [{ questionId, response }] }
      const response = await axios.post(
        `${API_URL}/questions/submit-responses`, 
        { responses: validResponses },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log("Response status:", response.status);
      console.log("Response data:", JSON.stringify(response.data, null, 2));
      console.log("---------------------------");
      
      // Fetch the updated profile 
      try {
        const profileResponse = await axios.get(`${API_URL}/patients/profile`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log("Updated profile after assessment:", profileResponse.data);
        
        // Update the user info in AsyncStorage
        if (profileResponse.data) {
          await AsyncStorage.setItem('userInfo', JSON.stringify(profileResponse.data));
        }
      } catch (err) {
        console.error("Error fetching updated profile:", err);
      }
      
      return { success: true };
    } catch (error: any) {
      console.error("ERROR SUBMITTING RESPONSES:");
      console.error("Error object:", error);
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Response data:", JSON.stringify(error.response.data, null, 2));
      }
      setError(error.response?.data?.message || "Error submitting your responses. Please try again.");
      return { success: false, message: error.response?.data?.message || "Unknown error" };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessmentQuestions();
  }, []);

  const handleNextQuestion = () => {
    const currentQuestion = questions[currentQuestionIndex];
    let responseValue: string;

    if (currentQuestion.type === 'Text') {
      responseValue = currentTextResponse;
    } else if (currentQuestion.type === 'YesNo') {
      responseValue = currentTextResponse; 
    } else if (currentQuestion.type === 'MultiChoice') {
      responseValue = currentMultiChoiceResponse;
    } else {
      responseValue = '';
    }

    // Ensure we're using the correct property for the question ID
    const newResponse: PatientResponseItem = {
      questionId: currentQuestion._id,
      response: responseValue,
    };
    
    console.log(`Adding response for question ${currentQuestion._id}: ${JSON.stringify(responseValue)}`);
    
    const updatedResponses = [...responses, newResponse];
    setResponses(updatedResponses);

    setCurrentTextResponse('');
    setCurrentMultiChoiceResponse('');

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
      router.replace('/(patient)/(tabs)');
    } else {
      // L'erreur est déjà gérée et affichée par setError dans submitResponsesApi
      // On pourrait vouloir un feedback plus spécifique ici si nécessaire
      console.error("Failed to submit responses, see displayed error message.");
    }
  };
  
  const handleYesNoResponse = (response: 'Yes' | 'No') => {
    setCurrentTextResponse(response); 
  };

  const handleMultiChoiceResponse = (key: string) => {
    setCurrentMultiChoiceResponse(key);
  };

  // Fonction pour afficher les options MultiChoice
  const renderMultiChoiceOptions = (question: Question) => {
    // Si options est un tableau d'objets avec key et label
    if (Array.isArray(question.options) && question.options.length > 0 && typeof question.options[0] === 'object') {
      return question.options.map((option: MultiChoiceOption) => (
        <TouchableOpacity
          key={option.key}
          style={[
            styles.choiceButton, 
            currentMultiChoiceResponse === option.key && styles.choiceButtonSelected
          ]}
          onPress={() => handleMultiChoiceResponse(option.key)}
        >
          <Text style={[
            styles.choiceButtonText, 
            currentMultiChoiceResponse === option.key && styles.choiceButtonTextSelected
          ]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ));
    } 
    // Si options est une chaîne séparée par des virgules (ancien format)
    else if (typeof question.options === 'string') {
      return question.options.split(',').map((option, index) => {
        const trimmedOption = option.trim();
        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.choiceButton, 
              currentMultiChoiceResponse === trimmedOption && styles.choiceButtonSelected
            ]}
            onPress={() => handleMultiChoiceResponse(trimmedOption)}
          >
            <Text style={[
              styles.choiceButtonText, 
              currentMultiChoiceResponse === trimmedOption && styles.choiceButtonTextSelected
            ]}>
              {trimmedOption}
            </Text>
          </TouchableOpacity>
        );
      });
    }
    // Si nous n'avons pas d'options
    return <Text style={styles.errorText}>No options available for this question</Text>;
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
          <TouchableOpacity style={styles.actionButton} onPress={fetchAssessmentQuestions}>
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
          <TouchableOpacity style={styles.actionButton} onPress={() => router.replace('/(patient)/(tabs)')}>
            <Text style={styles.actionButtonText}>Go to Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = `${currentQuestionIndex + 1}/${questions.length}`;

  const isNextButtonDisabled = () => {
    if (loading) return true;
    
    if (currentQuestion.type === 'Text' && !currentTextResponse) return true;
    if (currentQuestion.type === 'YesNo' && !currentTextResponse) return true;
    if (currentQuestion.type === 'MultiChoice' && !currentMultiChoiceResponse) return true;
    
    return false;
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.wrapper}>
        <View style={styles.contentContainer}>
          <Text style={styles.mainTitle}>Basic Assessment{"\n"}to match you with{"\n"}the Best Doctor{"\n"}and Create your Profile</Text>
          <Text style={styles.progressText}>Question {progress}</Text>
          
          <View style={styles.questionWrapper}>
            <Text style={styles.questionLabel}>Question {currentQuestionIndex + 1}</Text>
            <Text style={styles.questionText}>{currentQuestion.questionText}</Text>
            
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

            {currentQuestion.type === 'MultiChoice' && (
              <View style={styles.multiChoiceContainer}>
                {renderMultiChoiceOptions(currentQuestion)}
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.actionButton, isNextButtonDisabled() && styles.actionButtonDisabled]}
            onPress={handleNextQuestion}
            disabled={isNextButtonDisabled()}
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
  questionText: {
    fontSize: 16,
    color: '#4A5568',
    marginBottom: 20,
    lineHeight: 22,
    width: '100%',
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