const Question = require('../models/Question');
const PatientResponse = require('../models/PatientResponse');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { assessmentQuestions, recommendSpecializations } = require('../services/assessmentService');

// @desc    Obtenir toutes les questions
// @route   GET /api/questions
// @access  Public
exports.getQuestions = async (req, res) => {
  try {
    const { targetGroup, specialization } = req.query;
    
    let query = {};
    
    if (targetGroup) {
      query.targetGroup = targetGroup;
    }
    
    if (specialization) {
      query.specialization = specialization;
    }
    
    const questions = await Question.find(query);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get assessment questions for patient
// @route   GET /api/questions/assessment
// @access  Private/Patient
exports.getAssessmentQuestions = async (req, res) => {
  try {
    // First check if the user has already completed the assessment
    const existingResponses = await PatientResponse.find({ user: req.user._id });
    const patient = await Patient.findOne({ user: req.user._id });
    
    const hasCompletedAssessment = 
      (existingResponses.length > 0) || 
      (patient && patient.has_taken_assessment) ||
      (req.user.hasCompletedAssessment);
    
    if (hasCompletedAssessment) {
      console.log(`User ${req.user._id} has already completed assessment`);
      return res.json({ hasAnswered: true, questions: [] });
    }

    // Get questions from database
    console.log(`Fetching assessment questions for user ${req.user._id}`);
    const questions = await Question.find().sort({ id: 1 });
    
    // Log the number of questions returned
    console.log(`Returning ${questions.length} assessment questions`);
    
    res.json({ hasAnswered: false, questions });
  } catch (error) {
    console.error('Error fetching assessment questions:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtenir une question par ID
// @route   GET /api/questions/:id
// @access  Public
exports.getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ message: 'Question non trouvée' });
    }
    
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Créer une question
// @route   POST /api/questions
// @access  Private/Admin
exports.createQuestion = async (req, res) => {
  try {
    const { 
      questionText, 
      type, 
      options, 
      scoring,
      id,
      targetGroup 
    } = req.body;
    
    const question = await Question.create({
      questionText,
      type,
      options,
      scoring,
      id,
      targetGroup
    });
    
    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mettre à jour une question
// @route   PUT /api/questions/:id
// @access  Private/Admin
exports.updateQuestion = async (req, res) => {
  try {
    const { 
      questionText, 
      type, 
      options, 
      scoring,
      id,
      targetGroup 
    } = req.body;
    
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ message: 'Question non trouvée' });
    }
    
    question.questionText = questionText || question.questionText;
    question.type = type || question.type;
    question.options = options || question.options;
    question.scoring = scoring || question.scoring;
    question.id = id || question.id;
    question.targetGroup = targetGroup || question.targetGroup;
    
    const updatedQuestion = await question.save();
    
    res.json(updatedQuestion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Supprimer une question
// @route   DELETE /api/questions/:id
// @access  Private/Admin
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ message: 'Question non trouvée' });
    }
    
    await question.deleteOne();
    
    res.json({ message: 'Question supprimée' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Soumettre des réponses aux questions et générer des recommandations
// @route   POST /api/questions/submit-responses
// @access  Private/Patient
exports.submitResponses = async (req, res) => {
  try {
    console.log('=== SUBMIT RESPONSES START ===');
    console.log('User ID:', req.user._id);
    console.log('Request body:', JSON.stringify(req.body));
    
    const { responses } = req.body;
    
    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      console.error('Invalid responses format:', responses);
      return res.status(400).json({ message: 'Please provide valid responses' });
    }
    
    console.log(`Processing ${responses.length} responses...`);
    const savedResponses = [];
    
    // Transformer les réponses dans un format adapté au scoring
    const formattedResponses = {};
    
    for (const item of responses) {
      const { questionId, response } = item;
      
      if (!questionId) {
        console.error('Missing questionId in response item:', item);
        continue; // Skip this invalid item
      }
      
      console.log(`Processing response for question ${questionId}: ${JSON.stringify(response)}`);
      
      // Trouver la question complète pour obtenir l'ID numérique
      const question = await Question.findById(questionId);
      if (!question) {
        console.error(`Question with ID ${questionId} not found`);
        continue;
      }
      
      // Pour le calcul du score, on utilise l'id numérique (1, 2, 3...)
      formattedResponses[question.id] = response;
      
      // Ensure the response is a string for database storage
      const responseString = Array.isArray(response) ? response.join(', ') : response.toString();
      
      try {
        // Create a new PatientResponse document
        const patientResponseData = {
          user: req.user._id,
          question: questionId,
          response: responseString
        };
        
        console.log("Creating PatientResponse with data:", patientResponseData);
        
        const savedResponse = await PatientResponse.create(patientResponseData);
        
        console.log(`Saved response ID: ${savedResponse._id}`);
        savedResponses.push(savedResponse);
      } catch (error) {
        console.error(`Error saving response for question ${questionId}:`, error.message);
        
        // Try to provide more detailed error information
        if (error.name === 'ValidationError') {
          for (const field in error.errors) {
            console.error(`Validation error in field '${field}':`, error.errors[field].message);
          }
        } else if (error.name === 'CastError') {
          console.error(`Cast error: Could not cast ${error.path}=${error.value} to type ${error.kind}`);
        }
        
        // Continue processing other responses even if one fails
      }
    }
    
    console.log(`Successfully saved ${savedResponses.length} out of ${responses.length} responses`);

    // Calculer les recommandations de spécialisations
    console.log("Calculating specialization recommendations...");
    console.log("Formatted responses:", formattedResponses);
    const specializationRecommendations = recommendSpecializations(formattedResponses);
    console.log("Specialization recommendations:", specializationRecommendations);
    
    // Rechercher les médecins avec les spécialisations recommandées
    const recommendedDoctorIds = [];
    if (specializationRecommendations.length > 0) {
      // Obtenir les 3 meilleures spécialisations
      const topSpecializations = specializationRecommendations.slice(0, 3).map(r => r.specializationId);
      console.log("Top specializations:", topSpecializations);
      
      // Trouver les médecins correspondant à ces spécialisations
      const recommendedDoctors = await Doctor.find({
        specialization: { $in: topSpecializations }
      }).limit(5);
      
      console.log(`Found ${recommendedDoctors.length} recommended doctors`);
      recommendedDoctorIds.push(...recommendedDoctors.map(d => d._id));
    }

    // Mettre à jour le profil du patient avec les résultats
    const patient = await Patient.findOne({ user: req.user._id });
    if (patient) {
      patient.has_taken_assessment = true;
      patient.assessment_results = {
        specializations: specializationRecommendations,
        completed_at: new Date()
      };
      patient.recommended_doctors = recommendedDoctorIds;
      await patient.save();
      console.log('Patient assessment results and recommendations updated');
    } else {
      console.log('Patient not found for user ID:', req.user._id);
    }
    
    // Update assessment status in User model
    await User.findByIdAndUpdate(req.user._id, { hasCompletedAssessment: true });
    console.log('User hasCompletedAssessment updated to true');
    
    console.log('=== SUBMIT RESPONSES END ===');
    
    res.status(201).json({
      message: 'Responses submitted successfully',
      count: savedResponses.length,
      responses: savedResponses,
      recommendations: specializationRecommendations,
      recommendedDoctors: recommendedDoctorIds
    });
  } catch (error) {
    console.error('Error in submitResponses:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtenir les réponses d'un utilisateur
// @route   GET /api/questions/user-responses
// @access  Private
exports.getUserResponses = async (req, res) => {
  try {
    const responses = await PatientResponse.find({ user: req.user._id })
      .populate('question')
      .sort({ assessmentDate: -1 });
    
    res.json(responses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 