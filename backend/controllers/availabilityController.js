const Availability = require('../models/Availability');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

const APPOINTMENT_DURATION = 30;

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
      date: new Date(date),
      startTime,
      endTime,
      isBooked: false
    });
    
    const createdAvailability = await availability.save();
    
    res.status(201).json(createdAvailability);
  } catch (error) {
    console.error('Erreur création disponibilité:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtenir les créneaux de 30 minutes disponibles pour un médecin à une date donnée
// @route   GET /api/availability/doctor/:id?date=YYYY-MM-DD
// @access  Public
exports.getDoctorAvailability = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const { date } = req.query;

    console.log('===== RECHERCHE DE CRÉNEAUX DE 30 MIN =====');
    console.log('Paramètres de recherche:', { doctorId, date });

    if (!date) {
      console.log('❌ Date manquante pour la recherche de créneaux');
      return res.status(400).json({ message: 'La date est requise pour obtenir les créneaux.' });
    }

    const targetDate = new Date(date);
    targetDate.setUTCHours(0, 0, 0, 0);

    const nextDay = new Date(targetDate);
    nextDay.setUTCDate(targetDate.getUTCDate() + 1);

    // 1. Récupérer les plages de disponibilité générales du médecin pour cette date
    const generalAvailabilities = await Availability.find({
      doctor: doctorId,
      date: {
        $gte: targetDate,
        $lt: nextDay
      }
    }).sort({ startTime: 1 });

    if (!generalAvailabilities.length) {
      console.log(`ℹ️ Aucune plage de disponibilité générale trouvée pour Dr ${doctorId} le ${date}`);
      return res.json([]);
    }
    console.log(`✅ ${generalAvailabilities.length} plage(s) de disponibilité générale trouvée(s) pour le ${date}.`);

    // 2. Récupérer tous les rendez-vous existants pour ce médecin à cette date
    // Ne considérer que les rendez-vous confirmés (non annulés) et payés 
    // pour permettre aux créneaux associés à des rendez-vous annulés d'être à nouveau disponibles
    const existingAppointments = await Appointment.find({
      doctor: doctorId,
      status: { $nin: ['cancelled', 'rejected'] }, // Exclure les rendez-vous annulés ou rejetés
      paymentStatus: 'completed' // Ne considérer que les rendez-vous payés
    }).populate('availability');

    const bookedSlotsForDate = new Set();
    existingAppointments.forEach(app => {
      if (app.availability && app.availability.date) {
        const appDate = new Date(app.availability.date);
        appDate.setUTCHours(0,0,0,0);
        if (appDate.toISOString().split('T')[0] === targetDate.toISOString().split('T')[0]) {
          bookedSlotsForDate.add(app.slotStartTime);
        }
      }
    });
    console.log(`ℹ️ ${bookedSlotsForDate.size} créneaux réservés actifs pour le ${date}:`, Array.from(bookedSlotsForDate));
    
    const allThirtyMinuteSlots = [];

    generalAvailabilities.forEach(availDoc => {
      console.log(`Traitement de la plage générale: ${availDoc.startTime} - ${availDoc.endTime} (ID: ${availDoc._id})`);
      const blockStartMinutes = timeToMinutes(availDoc.startTime);
      const blockEndMinutes = timeToMinutes(availDoc.endTime);

      for (let slotStart = blockStartMinutes; slotStart < blockEndMinutes; slotStart += APPOINTMENT_DURATION) {
        const slotStartTimeStr = minutesToTime(slotStart);
        const slotEndTimeStr = minutesToTime(slotStart + APPOINTMENT_DURATION);

        if (slotStart + APPOINTMENT_DURATION <= blockEndMinutes) {
          const isBooked = bookedSlotsForDate.has(slotStartTimeStr);
          allThirtyMinuteSlots.push({
            _id: `${availDoc._id}_${slotStartTimeStr}`,
            availabilityId: availDoc._id.toString(),
            startTime: slotStartTimeStr,
            endTime: slotEndTimeStr,
            available: !isBooked
          });
        }
      }
    });
    
    allThirtyMinuteSlots.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    console.log(`✅ ${allThirtyMinuteSlots.length} créneaux de 30 minutes générés pour Dr ${doctorId} le ${date}.`);
    console.log('===== FIN RECHERCHE DE CRÉNEAUX DE 30 MIN =====');
    
    res.json(allThirtyMinuteSlots);

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des créneaux de 30 minutes:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des créneaux.' });
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
    
    const { date } = req.query;
    
    let query = { doctor: doctor._id };
    
    if (date) {
      const targetDate = new Date(date);
      targetDate.setUTCHours(0,0,0,0);
      const nextDay = new Date(targetDate);
      nextDay.setUTCDate(targetDate.getUTCDate() + 1);
      query.date = { $gte: targetDate, $lt: nextDay };
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
    const { date, startTime, endTime } = req.body;
    
    const availability = await Availability.findById(req.params.id);
    
    if (!availability) {
      return res.status(404).json({ message: 'Disponibilité non trouvée' });
    }
    
    // Vérifier si le médecin est autorisé
    const doctor = await Doctor.findOne({ user: req.user._id });
    
    if (!doctor || doctor._id.toString() !== availability.doctor.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }
    
    if (date) availability.date = new Date(date);
    if (startTime) availability.startTime = startTime;
    if (endTime) availability.endTime = endTime;
    
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
      return res.status(403).json({ message: 'Non autorisé' });
    }
    
    // Vérifier s'il y a des RDV associés avant de supprimer
    const appointmentsCount = await Appointment.countDocuments({ availability: availability._id, status: { $ne: 'cancelled' } });
    if (appointmentsCount > 0) {
      return res.status(400).json({ message: 'Impossible de supprimer une disponibilité avec des rendez-vous actifs. Annulez ou reprogrammez les rendez-vous d\'abord.' });
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
    const { availabilities: batchData } = req.body;
    if (!batchData || !Array.isArray(batchData) || batchData.length === 0) {
      return res.status(400).json({ message: 'Veuillez fournir des disponibilités valides' });
    }
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: 'Profil de médecin non trouvé' });
    }
    const createdAvailabilities = [];
    for (const item of batchData) {
      const { date, startTime, endTime } = item;
      const availability = new Availability({
        doctor: doctor._id,
        date: new Date(date),
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
    console.error('Erreur createBatchAvailability:', error);
    res.status(500).json({ message: error.message });
  }
};

// Fonction utilitaire pour convertir l'heure en minutes
const timeToMinutes = (timeString) => {
  if (!timeString || typeof timeString !== 'string' || !timeString.includes(':')) {
    console.error('Invalid timeString for timeToMinutes:', timeString);
    return 0;
  }
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

// Fonction utilitaire pour convertir les minutes depuis minuit en heure (HH:MM)
const minutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}; 