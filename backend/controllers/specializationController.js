const Specialization = require('../models/Specialization');

// @desc    Obtenir toutes les spécialisations
// @route   GET /api/specializations
// @access  Public
exports.getSpecializations = async (req, res) => {
  try {
    const specializations = await Specialization.find({});
    res.json(specializations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtenir une spécialisation par ID
// @route   GET /api/specializations/:id
// @access  Public
exports.getSpecializationById = async (req, res) => {
  try {
    const specialization = await Specialization.findById(req.params.id);
    
    if (!specialization) {
      return res.status(404).json({ message: 'Spécialisation non trouvée' });
    }
    
    res.json(specialization);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Créer une spécialisation
// @route   POST /api/specializations
// @access  Private/Admin
exports.createSpecialization = async (req, res) => {
  try {
    const { name } = req.body;
    
    const existingSpecialization = await Specialization.findOne({ name });
    if (existingSpecialization) {
      return res.status(400).json({ message: 'Cette spécialisation existe déjà' });
    }
    
    const specialization = await Specialization.create({ name });
    res.status(201).json(specialization);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mettre à jour une spécialisation
// @route   PUT /api/specializations/:id
// @access  Private/Admin
exports.updateSpecialization = async (req, res) => {
  try {
    const { name } = req.body;
    
    const specialization = await Specialization.findById(req.params.id);
    
    if (!specialization) {
      return res.status(404).json({ message: 'Spécialisation non trouvée' });
    }
    
    specialization.name = name || specialization.name;
    
    const updatedSpecialization = await specialization.save();
    res.json(updatedSpecialization);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Supprimer une spécialisation
// @route   DELETE /api/specializations/:id
// @access  Private/Admin
exports.deleteSpecialization = async (req, res) => {
  try {
    const specialization = await Specialization.findById(req.params.id);
    
    if (!specialization) {
      return res.status(404).json({ message: 'Spécialisation non trouvée' });
    }
    
    await specialization.deleteOne();
    res.json({ message: 'Spécialisation supprimée' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 