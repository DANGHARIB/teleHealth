import React, { useState, useEffect } from 'react';
import {
  View, Text, Button, TextInput, StyleSheet, SafeAreaView, ActivityIndicator,
  Keyboard, TouchableWithoutFeedback, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
// Supposons que vous ayez un moyen de faire des appels API, par exemple un service api
// import api from '../../services/api'; // À adapter selon votre structure

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

  // TODO: Remplacer par votre véritable fonction d'appel API
  const fetchRandomQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simule un appel API
      // const response = await api.get('/questions/random/assessment');
      // Pour l'instant, utilisons des données mockées basées sur la description et la capture d'écran
      // IMPORTANT : Ceci est un placeholder. Remplacez par votre appel API réel.
      console.log("Appel API simulé pour /api/questions/random/assessment");
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simule la latence réseau
      
      // Simuler une réponse où l'utilisateur n'a pas encore répondu
      const mockApiResponse = {
        hasAnswered: false,
        questions: [
          { _id: '1', questionText: 'How would you describe your child\'s behavior at school?', type: 'Text' },
          { _id: '2', questionText: 'Do you experience prolonged periods of sadness?', type: 'YesNo' },
          { _id: '3', questionText: 'Which of these symptoms do you experience often?', type: 'MultiChoice', options: 'Anxiety,Insomnia,Lack of Interest,Excessive Worry' },
          { _id: '4', questionText: 'Do you have trouble remembering recent events?', type: 'YesNo' },
          { _id: '5', questionText: 'What are your main coping strategies during emotional distress?', type: 'Text' },
          { _id: '6', questionText: 'Are you currently dealing with stress related to your work or studies?', type: 'YesNo' },
        ] as Question[]
      };

      if (mockApiResponse.hasAnswered) {
        router.replace('/(tabs)/profile'); // Rediriger si déjà répondu
        return;
      }
      
      if (mockApiResponse.questions.length > 0) {
        setQuestions(mockApiResponse.questions);
      } else {
        // Si aucune question n'est retournée et qu'il n'a pas répondu, c'est un cas à gérer.
        // Peut-être rediriger vers le profil ou afficher un message.
        setError("Aucune question d'évaluation trouvée. Veuillez contacter le support.");
        // router.replace('/(tabs)/profile');
      }
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement des questions. Veuillez réessayer.");
      // Gérer l'erreur, peut-être offrir une option de réessayer
    } finally {
      setLoading(false);
    }
  };
  
  // TODO: Remplacer par votre véritable fonction d'appel API
  const submitResponsesApi = async (finalResponses: PatientResponseItem[]) => {
    try {
      console.log("Soumission des réponses:", finalResponses);
      // const response = await api.post('/questions/submit-responses', { responses: finalResponses });
      // console.log("Réponses soumises avec succès:", response.data);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simule la latence réseau
      return { success: true }; // Simule une réponse réussie
    } catch (error) {
      console.error("Erreur lors de la soumission des réponses:", error);
      setError("Erreur lors de la soumission de vos réponses. Veuillez réessayer.");
      return { success: false };
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
      // Pour YesNo, nous aurons besoin de boutons. Supposons que la réponse est stockée dans currentTextResponse pour l'instant.
      // Il faudra adapter l'UI pour YesNo (ex: 'Oui', 'Non')
      responseValue = currentTextResponse; // À changer
    } else if (currentQuestion.type === 'MultiChoice') {
      responseValue = currentMultiChoiceResponse;
    } else {
      responseValue = ''; // Ne devrait pas arriver
    }

    const newResponse: PatientResponseItem = {
      questionId: currentQuestion._id,
      response: responseValue,
    };
    const updatedResponses = [...responses, newResponse];
    setResponses(updatedResponses);

    // Réinitialiser les états de réponse pour la prochaine question
    setCurrentTextResponse('');
    setCurrentMultiChoiceResponse([]);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Fin du questionnaire
      handleSubmit(updatedResponses);
    }
  };

  const handleSubmit = async (finalResponses: PatientResponseItem[]) => {
    setLoading(true);
    const result = await submitResponsesApi(finalResponses);
    setLoading(false);
    if (result.success) {
      // Implémenter la logique d'association des docteurs ici ou sur le backend
      // Pour l'instant, rediriger vers le profil
      router.replace('/(tabs)/profile');
    } else {
      // Gérer l'échec de la soumission (par exemple, afficher un message d'erreur)
    }
  };
  
  const handleYesNoResponse = (response: 'Yes' | 'No') => {
    setCurrentTextResponse(response); // Utiliser currentTextResponse pour la simplicité, puis appeler next.
    // Pour une meilleure UX, on pourrait directement passer à la suivante après le clic.
    // Ici, on attendra que l'utilisateur clique sur "Next"
  };

  const toggleMultiChoiceResponse = (option: string) => {
    setCurrentMultiChoiceResponse(prev =>
      prev.includes(option) ? prev.filter(item => item !== option) : [...prev, option]
    );
  };


  if (loading && questions.length === 0) { // Afficher le chargement initial
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
    // Ce cas peut se produire si fetchRandomQuestions a un problème non couvert par le chargement initial
    // ou si l'API retourne hasAnswered:true et que la redirection n'a pas encore eu lieu
    return (
      <SafeAreaView style={styles.container}>
        <Text>Aucune question à afficher pour le moment.</Text>
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
                {/* Afficher la sélection pour confirmation avant de cliquer sur Next */}
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
              disabled={loading || (currentQuestion.type === 'Text' && !currentTextResponse && !currentMultiChoiceResponse.length) || (currentQuestion.type === 'YesNo' && !currentTextResponse) }
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