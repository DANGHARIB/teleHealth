const Availability = require('../models/Availability');
const Doctor = require('../models/Doctor');

// @desc    Créer une disponibilité
// @route   POST /api/availability
// @access  Private/Doctor
exports.createAvailability = async (req, res) => {
  try {
    const { date, startTime, endTime } = req.body;
    
    // Vérifier si le médecin existe
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: 'Profil de médecin non trouvé' });
    }
    
    // Créer la disponibilité
    const availability = new Availability({
      doctor: doctor._id,
      date,
      startTime,
      endTime,
      isBooked: false
    });
    
    const createdAvailability = await availability.save();
    
    res.status(201).json(createdAvailability);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtenir toutes les disponibilités d'un médecin
// @route   GET /api/availability/doctor/:id
// @access  Public
exports.getDoctorAvailability = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const { date, isBooked } = req.query;
    
    let query = { doctor: doctorId };
    
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      query.date = { $gte: startDate, $lte: endDate };
    }
    
    if (isBooked !== undefined) {
      query.isBooked = isBooked === 'true';
    }
    
    const availabilities = await Availability.find(query).sort({ date: 1, startTime: 1 });
    
    res.json(availabilities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtenir mes disponibilités (médecin connecté)
// @route   GET /api/availability/my-availability
// @access  Private/Doctor
exports.getMyAvailability = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id });
    
    if (!doctor) {
      return res.status(404).json({ message: 'Profil de médecin non trouvé' });
    }
    
    const { date, isBooked } = req.query;
    
    let query = { doctor: doctor._id };
    
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      query.date = { $gte: startDate, $lte: endDate };
    }
    
    if (isBooked !== undefined) {
      query.isBooked = isBooked === 'true';
    }
    
    const availabilities = await Availability.find(query).sort({ date: 1, startTime: 1 });
    
    res.json(availabilities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mettre à jour une disponibilité
// @route   PUT /api/availability/:id
// @access  Private/Doctor
exports.updateAvailability = async (req, res) => {
  try {
    const { date, startTime, endTime, isBooked } = req.body;
    
    const availability = await Availability.findById(req.params.id);
    
    if (!availability) {
      return res.status(404).json({ message: 'Disponibilité non trouvée' });
    }
    
    // Vérifier si le médecin est autorisé
    const doctor = await Doctor.findOne({ user: req.user._id });
    
    if (!doctor || doctor._id.toString() !== availability.doctor.toString()) {
      return res.status(403).json({ message: 'Non autorisé à modifier cette disponibilité' });
    }
    
    // Ne pas permettre la modification si déjà réservée
    if (availability.isBooked && (date || startTime || endTime)) {
      return res.status(400).json({ message: 'Impossible de modifier une disponibilité déjà réservée' });
    }
    
    if (date) availability.date = date;
    if (startTime) availability.startTime = startTime;
    if (endTime) availability.endTime = endTime;
    if (isBooked !== undefined) availability.isBooked = isBooked;
    
    const updatedAvailability = await availability.save();
    
    res.json(updatedAvailability);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Supprimer une disponibilité
// @route   DELETE /api/availability/:id
// @access  Private/Doctor
exports.deleteAvailability = async (req, res) => {
  try {
    const availability = await Availability.findById(req.params.id);
    
    if (!availability) {
      return res.status(404).json({ message: 'Disponibilité non trouvée' });
    }
    
    // Vérifier si le médecin est autorisé
    const doctor = await Doctor.findOne({ user: req.user._id });
    
    if (!doctor || doctor._id.toString() !== availability.doctor.toString()) {
      return res.status(403).json({ message: 'Non autorisé à supprimer cette disponibilité' });
    }
    
    // Ne pas permettre la suppression si déjà réservée
    if (availability.isBooked) {
      return res.status(400).json({ message: 'Impossible de supprimer une disponibilité déjà réservée' });
    }
    
    await availability.deleteOne();
    
    res.json({ message: 'Disponibilité supprimée' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Créer plusieurs disponibilités à la fois
// @route   POST /api/availability/batch
// @access  Private/Doctor
exports.createBatchAvailability = async (req, res) => {
  try {
    const { availabilities } = req.body;
    
    if (!availabilities || !Array.isArray(availabilities) || availabilities.length === 0) {
      return res.status(400).json({ message: 'Veuillez fournir des disponibilités valides' });
    }
    
    // Vérifier si le médecin existe
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: 'Profil de médecin non trouvé' });
    }
    
    const createdAvailabilities = [];
    
    for (const item of availabilities) {
      const { date, startTime, endTime } = item;
      
      const availability = new Availability({
        doctor: doctor._id,
        date,
        startTime,
        endTime,
        isBooked: false
      });
      
      const createdAvailability = await availability.save();
      createdAvailabilities.push(createdAvailability);
    }
    
    res.status(201).json({
      message: 'Disponibilités créées avec succès',
      availabilities: createdAvailabilities
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 