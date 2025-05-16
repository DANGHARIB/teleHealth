const Question = require('../models/Question');
const PatientResponse = require('../models/PatientResponse');
const User = require('../models/User');

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
    
    const questions = await Question.find(query).populate('specialization', 'name');
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtenir 6 questions aléatoires
// @route   GET /api/questions/random
// @access  Private/Patient
exports.getRandomQuestions = async (req, res) => {
  try {
    // Vérifier d'abord si l'utilisateur a déjà répondu à des questions
    const existingResponses = await PatientResponse.find({ user: req.user._id });
    
    if (existingResponses.length > 0) {
      // L'utilisateur a déjà répondu, on peut retourner un statut spécial
      // ou simplement un tableau vide, ou rediriger.
      // Pour l'instant, retournons un message indiquant qu'il a déjà répondu.
      // Le frontend gérera la redirection vers le profil.
      return res.json({ hasAnswered: true, questions: [] });
    }

    // Si aucune réponse, récupérer 6 questions aléatoires
    // On pourrait vouloir filtrer par targetGroup si pertinent pour le patient,
    // mais pour l'instant, prenons parmi toutes les questions.
    const questions = await Question.aggregate([
      { $sample: { size: 6 } }
    ]);
    
    // On s'assure de peupler les informations de spécialisation si nécessaire
    // L'agrégation ne peuple pas automatiquement, donc il faut le faire manuellement si besoin
    // Pour cet exemple, $sample est suffisant, on peut ajouter $lookup si on veut les détails de la spécialisation
    // await Question.populate(questions, { path: 'specialization', select: 'name' });

    res.json({ hasAnswered: false, questions });
  } catch (error) {
    console.error('Error fetching random questions:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtenir une question par ID
// @route   GET /api/questions/:id
// @access  Public
exports.getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('specialization', 'name');
    
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
      specializationId, 
      targetGroup 
    } = req.body;
    
    const question = await Question.create({
      questionText,
      type,
      options,
      specialization: specializationId,
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
      specializationId, 
      targetGroup 
    } = req.body;
    
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ message: 'Question non trouvée' });
    }
    
    question.questionText = questionText || question.questionText;
    question.type = type || question.type;
    question.options = options || question.options;
    question.specialization = specializationId || question.specialization;
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

// @desc    Soumettre des réponses aux questions
// @route   POST /api/questions/submit-responses
// @access  Private/Patient
exports.submitResponses = async (req, res) => {
  try {
    const { responses } = req.body;
    
    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({ message: 'Veuillez fournir des réponses valides' });
    }
    
    const savedResponses = [];
    
    for (const item of responses) {
      const { questionId, response } = item;
      
      const savedResponse = await PatientResponse.create({
        user: req.user._id,
        question: questionId,
        response
      });
      
      savedResponses.push(savedResponse);
    }

    // Mettre à jour le statut de l'évaluation de l'utilisateur
    await User.findByIdAndUpdate(req.user._id, { hasCompletedAssessment: true });
    
    res.status(201).json({
      message: 'Réponses soumises avec succès',
      responses: savedResponses
    });
  } catch (error) {
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