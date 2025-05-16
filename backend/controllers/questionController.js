const Question = require('../models/Question');
const PatientResponse = require('../models/PatientResponse');

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