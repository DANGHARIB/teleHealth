const Appointment = require("../models/Appointment");
const Availability = require("../models/Availability");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const User = require("../models/User");
const notificationService = require("../services/notificationService");
const paymentService = require("../services/paymentService");
const { sendAppointmentZoomLink } = require("../services/emailService");
const logger = require("../config/logger");

/**
 * Helper function to get all availability IDs for the same day for a doctor
 * Used to check if a patient already has an appointment with a doctor on the same day
 */
async function getAvailabilitiesForSameDay(dateString, doctorId) {
  try {
    // Get date parts for matching
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    // Find all availabilities for this doctor on the same day
    const availabilities = await Availability.find({
      doctor: doctorId,
      date: {
        $gte: new Date(year, month, day, 0, 0, 0),
        $lt: new Date(year, month, day + 1, 0, 0, 0)
      }
    }).select('_id');
    
    return availabilities.map(a => a._id);
  } catch (error) {
    console.error("Error getting same-day availabilities:", error);
    return [];
  }
}

// @desc    Créer un nouveau rendez-vous
// @route   POST /api/appointments
// @access  Private/Patient
exports.createAppointment = async (req, res) => {
  try {
    const {
      doctorId,
      availabilityId, // ID de la plage de disponibilité générale du médecin
      slotStartTime, // Heure de début du créneau de 30 min spécifique
      slotEndTime, // Heure de fin du créneau de 30 min spécifique
      price,
      duration,
      caseDetails,
    } = req.body;

    console.log("===== DÉBUT DE RÉSERVATION DE CRÉNEAU SPÉCIFIQUE =====");
    console.log(
      "Données reçues:",
      JSON.stringify(
        {
          doctorId,
          availabilityId,
          slotStartTime,
          slotEndTime,
          price,
          duration,
          caseDetails,
        },
        null,
        2,
      ),
    );

    if (!slotStartTime || !slotEndTime) {
      console.log("❌ Heures de début/fin du créneau manquantes");
      return res
        .status(400)
        .json({
          message: "Les heures de début et de fin du créneau sont requises",
        });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      console.log("❌ Médecin non trouvé:", doctorId);
      return res.status(404).json({ message: "Médecin non trouvé" });
    }
    console.log(
      "✅ Médecin trouvé:",
      doctor.full_name || `${doctor.first_name} ${doctor.last_name}`,
    );

    const availability = await Availability.findById(availabilityId);
    if (!availability) {
      console.log(
        "❌ Plage de disponibilité générale non trouvée:",
        availabilityId,
      );
      return res
        .status(404)
        .json({ message: "Plage de disponibilité générale non trouvée" });
    }
    console.log("✅ Plage de disponibilité générale trouvée:", {
      date: new Date(availability.date).toLocaleDateString("fr-FR"),
      startTimeBlock: availability.startTime,
      endTimeBlock: availability.endTime,
    });

    // Récupérer le patient actuel
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) {
      console.log("❌ Patient non trouvé:", req.user._id);
      return res.status(404).json({ message: "Patient non trouvé" });
    }
    console.log("✅ Patient trouvé:", patient._id);

    // Vérifier si ce MÊME patient a déjà un rendez-vous avec ce médecin le même jour
    const existingAppointmentForPatient = await Appointment.findOne({
      doctor: doctorId,
      patient: patient._id,
      "availability": { $in: await getAvailabilitiesForSameDay(availability.date, doctorId) },
      status: { $nin: ["cancelled", "rejected"] },
      paymentStatus: "completed" // Ne compte que les rendez-vous payés
    });

    if (existingAppointmentForPatient) {
      console.log("❌ Patient a déjà un rendez-vous pour cette date:", {
        patient: patient._id,
        date: new Date(availability.date).toLocaleDateString("fr-FR"),
        appointmentId: existingAppointmentForPatient._id,
      });
      return res.status(400).json({
        message: "Vous avez déjà un rendez-vous avec ce médecin pour cette date",
      });
    }

    // Vérifier si ce créneau spécifique est déjà réservé par quelqu'un d'autre
    const existingAppointmentForSlot = await Appointment.findOne({
      doctor: doctorId,
      availability: availabilityId,
      slotStartTime: slotStartTime,
      status: { $nin: ["cancelled", "rejected"] },
      $or: [
        { paymentStatus: "completed" }, // Rendez-vous payés
        { 
          paymentStatus: "pending", 
          createdAt: { $gt: new Date(Date.now() - 15 * 60 * 1000) } // Rendez-vous en attente depuis moins de 15 minutes (réduit de 30 à 15)
        }
      ]
    });

    if (existingAppointmentForSlot) {
      console.log("❌ Créneau spécifique déjà réservé:", {
        date: new Date(availability.date).toLocaleDateString("fr-FR"),
        slot: `${slotStartTime} - ${slotEndTime}`,
        appointmentId: existingAppointmentForSlot._id,
      });
      return res.status(400).json({
        message: "Ce créneau spécifique de 30 minutes est déjà réservé",
      });
    }

    console.log(
      "✅ Créneau spécifique disponible pour réservation:",
      `${new Date(availability.date).toLocaleDateString("fr-FR")} ${slotStartTime}-${slotEndTime}`,
    );

    const appointment = new Appointment({
      doctor: doctorId,
      patient: patient._id,
      availability: availabilityId, // Lien vers la plage de dispo générale
      slotStartTime, // Heure de début du créneau de 30 min
      slotEndTime, // Heure de fin du créneau de 30 min
      price: price || 28,
      duration: duration || 30,
      caseDetails: caseDetails || "Consultation standard",
      status: "pending",
      paymentStatus: "pending",
    });

    // NE PAS marquer le créneau comme réservé ici, cela sera fait lors du paiement
    // Le créneau ne sera réservé qu'après confirmation du paiement
    // On supprime cette partie du code:
    /*
    const specificAvailabilitySlot = await Availability.findById(availabilityId);
    if (!specificAvailabilitySlot) {
      console.log("❌ Erreur critique: Le créneau de disponibilité spécifique n'a pas été trouvé avant de le marquer comme réservé:", availabilityId);
      return res.status(500).json({ message: "Erreur lors de la mise à jour de la disponibilité." });
    }
    specificAvailabilitySlot.isBooked = true;
    await specificAvailabilitySlot.save();
    console.log("✅ Créneau de disponibilité spécifique marqué comme réservé:", availabilityId);
    */

    const createdAppointment = await appointment.save();
    console.log("✅ Rendez-vous (créneau de 30 min) créé avec succès:", {
      id: createdAppointment._id,
      date: new Date(availability.date).toLocaleDateString("fr-FR"),
      creneauReserve: `${createdAppointment.slotStartTime} - ${createdAppointment.slotEndTime}`,
      statut: "pending - en attente de paiement", // Ajout pour clarifier le statut
    });

    await notificationService.notifyAppointmentCreated(createdAppointment);
    await notificationService.scheduleAppointmentReminders(createdAppointment);

    console.log("===== FIN DE RÉSERVATION DE CRÉNEAU SPÉCIFIQUE =====");

    res.status(201).json(createdAppointment);
  } catch (error) {
    console.error(
      "❌ Erreur lors de la création du rendez-vous (créneau spécifique):",
      error,
    );
    res
      .status(500)
      .json({ message: "Erreur serveur lors de la création du rendez-vous" });
  }
};

// @desc    Obtenir tous les rendez-vous (pour admin)
// @route   GET /api/appointments
// @access  Private/Admin
exports.getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({})
      .populate("doctor", "full_name")
      .populate({
        path: "patient",
        select: "first_name last_name",
        populate: { path: "user", select: "fullName email" },
      })
      .populate("availability")
      .sort({ createdAt: -1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtenir les rendez-vous d'un patient
// @route   GET /api/appointments/patient
// @access  Private/Patient
exports.getPatientAppointments = async (req, res) => {
  try {
    console.log(
      "Tentative de récupération des rendez-vous pour l'utilisateur:",
      req.user._id,
    );

    // Récupérer l'ID du patient
    const patient = await Patient.findOne({ user: req.user._id });
    console.log(
      "Patient trouvé:",
      patient ? patient._id : "Patient non trouvé",
    );

    if (!patient) {
      return res.status(404).json({ message: "Patient non trouvé" });
    }

    const { status } = req.query;
    console.log("Filtre par statut:", status || "aucun filtre");

    let query = { patient: patient._id };

    // Filtrer par statut si spécifié
    if (status) {
      query.status = status;
    }

    console.log("Requête de recherche:", JSON.stringify(query));

    const appointments = await Appointment.find(query)
      .populate({
        path: "doctor",
        select: "first_name last_name full_name",
      })
      .populate({
        path: "availability",
        select: "date startTime endTime",
      })
      .sort({ createdAt: -1 });

    console.log("Rendez-vous trouvés:", appointments.length);

    res.status(200).json(appointments);
  } catch (error) {
    console.error("Erreur lors de la récupération des rendez-vous:", error);
    res
      .status(500)
      .json({
        message: "Erreur serveur lors de la récupération des rendez-vous",
      });
  }
};

// @desc    Obtenir les rendez-vous d'un médecin
// @route   GET /api/appointments/doctor
// @access  Private/Doctor
exports.getDoctorAppointments = async (req, res) => {
  try {
    console.log(
      "Tentative de récupération des rendez-vous pour le médecin:",
      req.user._id,
    );

    const doctor = await Doctor.findOne({ user: req.user._id });
    console.log("Médecin trouvé:", doctor ? doctor._id : "Médecin non trouvé");

    if (!doctor) {
      return res.status(404).json({ message: "Médecin non trouvé" });
    }

    const { status } = req.query;
    console.log("Filtre par statut:", status || "aucun filtre");

    let query = { doctor: doctor._id };

    // Filtrer par statut si spécifié
    if (status) {
      query.status = status;
    }

    console.log("Requête de recherche:", JSON.stringify(query));

    const appointments = await Appointment.find(query)
      .populate({
        path: "patient",
        select: "first_name last_name",
      })
      .populate({
        path: "availability",
        select: "date startTime endTime",
      })
      .sort({ createdAt: -1 });

    console.log("Rendez-vous trouvés:", appointments.length);

    res.status(200).json(appointments);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des rendez-vous du médecin:",
      error,
    );
    res
      .status(500)
      .json({
        message: "Erreur serveur lors de la récupération des rendez-vous",
      });
  }
};

// @desc    Obtenir un rendez-vous par ID
// @route   GET /api/appointments/:id
// @access  Private
exports.getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("doctor", "full_name doctor_image")
      .populate({
        path: "patient",
        select: "first_name last_name",
        populate: { path: "user", select: "fullName email" },
      })
      .populate("availability");

    if (!appointment) {
      return res.status(404).json({ message: "Rendez-vous non trouvé" });
    }

    // Vérifier les autorisations
    const doctor = await Doctor.findOne({ user: req.user._id });
    const patient = await Patient.findOne({ user: req.user._id });

    if (
      req.user.role !== "Admin" &&
      (!doctor ||
        doctor._id.toString() !== appointment.doctor._id.toString()) &&
      (!patient ||
        patient._id.toString() !== appointment.patient._id.toString())
    ) {
      return res
        .status(403)
        .json({ message: "Non autorisé à accéder à ce rendez-vous" });
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mettre à jour le statut d'un rendez-vous
// @route   PUT /api/appointments/:id/status
// @access  Private
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status, sessionLink } = req.body;

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Rendez-vous non trouvé" });
    }

    // Vérifier les autorisations
    const doctor = await Doctor.findOne({ user: req.user._id });

    if (
      req.user.role !== "Admin" &&
      (!doctor || doctor._id.toString() !== appointment.doctor.toString())
    ) {
      return res
        .status(403)
        .json({ message: "Non autorisé à modifier ce rendez-vous" });
    }

    appointment.status = status || appointment.status;

    // Si un lien de session est fourni ou si le statut est mis à "scheduled" et qu'il n'y a pas de lien
    if (sessionLink) {
      appointment.sessionLink = sessionLink;
    } else if (status === "scheduled" && !appointment.sessionLink) {
      // Générer automatiquement un lien Zoom si passage au statut "scheduled"
      const zoomId = Math.random().toString(36).substring(2, 10);
      appointment.sessionLink = `https://zoom.us/j/${zoomId}`;
    }

    const updatedAppointment = await appointment.save();

    // Si le rendez-vous est passé à "scheduled" ou "confirmed" et a un lien de session, 
    // envoyer le lien par email
    if (
      (status === "scheduled" || status === "confirmed") && 
      updatedAppointment.sessionLink && 
      updatedAppointment.paymentStatus === "completed"
    ) {
      try {
        // Récupérer les informations complètes du rendez-vous
        const appointmentWithDetails = await Appointment.findById(updatedAppointment._id)
          .populate('availability')
          .populate({
            path: 'doctor',
            populate: { path: 'user', select: 'email' }
          })
          .populate({
            path: 'patient',
            populate: { path: 'user', select: 'email' }
          });
        
        if (appointmentWithDetails && 
            appointmentWithDetails.doctor && 
            appointmentWithDetails.doctor.user && 
            appointmentWithDetails.patient && 
            appointmentWithDetails.patient.user) {
          
          const doctorEmail = appointmentWithDetails.doctor.user.email;
          const patientEmail = appointmentWithDetails.patient.user.email;
          
          // Formater la date et l'heure du rendez-vous
          const appointmentDate = new Date(appointmentWithDetails.availability.date).toLocaleDateString('fr-FR');
          const appointmentTime = appointmentWithDetails.slotStartTime;
          
          // Envoyer les emails
          await sendAppointmentZoomLink(
            appointmentWithDetails,
            doctorEmail,
            patientEmail,
            updatedAppointment.sessionLink,
            appointmentDate,
            appointmentTime
          );
          
          logger.info(`Lien Zoom envoyé par email pour le rendez-vous ${updatedAppointment._id}`);
        }
      } catch (emailError) {
        logger.error(`Erreur lors de l'envoi du lien Zoom par email: ${emailError.message}`);
        // On continue même si l'envoi d'email échoue
      }
    }

    res.json(updatedAppointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Demander une reprogrammation de rendez-vous (par le médecin)
// @route   POST /api/appointments/:id/request-reschedule
// @access  Private/Doctor
exports.requestAppointmentReschedule = async (req, res) => {
  try {
    // Trouver le rendez-vous 
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: "Rendez-vous non trouvé" });
    }
    
    // Vérifier les autorisations
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor || doctor._id.toString() !== appointment.doctor.toString()) {
      return res.status(403).json({ message: "Non autorisé à demander la reprogrammation de ce rendez-vous" });
    }
    
    // Mettre à jour le statut du rendez-vous pour indiquer qu'une reprogrammation est demandée
    appointment.status = "reschedule_requested";
    await appointment.save();
    
    // Envoyer une notification au patient
    await notificationService.notifyRescheduleRequest(appointment._id);
    
    res.status(200).json({ 
      message: "Demande de reprogrammation envoyée avec succès", 
      appointment 
    });
  } catch (error) {
    console.error("Erreur lors de la demande de reprogrammation:", error);
    res.status(500).json({ 
      message: "Erreur serveur lors de la demande de reprogrammation" 
    });
  }
};

// @desc    Reprogrammer un rendez-vous par le patient
// @route   PUT /api/appointments/:id/patient-reschedule
// @access  Private/Patient
exports.patientRescheduleAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params; // ID of the appointment to reschedule
    const {
      newAvailabilityId, // ID of the new general availability block
      newSlotStartTime,  // New specific 30-min start time
      newSlotEndTime,    // New specific 30-min end time
      // price and duration might be carried over or re-confirmed from doctor's profile/new availability
    } = req.body;

    console.log("===== DÉBUT REPROGRAMMATION PAR PATIENT =====");
    console.log("Appointment ID à reprogrammer:", appointmentId);
    console.log("Nouvelles données de slot:", JSON.stringify({ newAvailabilityId, newSlotStartTime, newSlotEndTime }, null, 2));

    if (!newAvailabilityId || !newSlotStartTime || !newSlotEndTime) {
      console.log("❌ Données du nouveau créneau manquantes");
      return res.status(400).json({ message: "Les détails du nouveau créneau sont requis." });
    }

    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) {
      console.log("❌ Patient non trouvé pour l'utilisateur:", req.user._id);
      return res.status(404).json({ message: "Patient non trouvé." });
    }
    console.log("✅ Patient identifié:", patient._id);

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      console.log("❌ Rendez-vous non trouvé:", appointmentId);
      return res.status(404).json({ message: "Rendez-vous non trouvé." });
    }
    console.log("✅ Rendez-vous trouvé:", appointment._id, "Status actuel:", appointment.status);

    if (appointment.patient.toString() !== patient._id.toString()) {
      console.log("❌ Accès non autorisé. Patient:", patient._id, "Propriétaire RDV:", appointment.patient);
      return res.status(403).json({ message: "Non autorisé à modifier ce rendez-vous." });
    }

    // Vérifier si le nouveau créneau est différent de l'ancien
    if (appointment.availability.toString() === newAvailabilityId && appointment.slotStartTime === newSlotStartTime) {
      console.log("❌ Le nouveau créneau est identique à l'ancien.");
      return res.status(400).json({ message: "Le nouveau créneau choisi est identique à l'actuel." });
    }
    
    const newAvailability = await Availability.findById(newAvailabilityId);
    if (!newAvailability) {
      console.log("❌ Nouvelle plage de disponibilité générale non trouvée:", newAvailabilityId);
      return res.status(404).json({ message: "Nouvelle plage de disponibilité non trouvée." });
    }
    console.log("✅ Nouvelle plage de disponibilité générale trouvée:", newAvailabilityId);

    // Vérifier si le nouveau créneau spécifique est déjà réservé
    const existingAppointmentForNewSlot = await Appointment.findOne({
      doctor: appointment.doctor, // Keep the same doctor
      availability: newAvailabilityId,
      slotStartTime: newSlotStartTime,
      status: { $nin: ["cancelled", "rejected"] },
      _id: { $ne: appointmentId }, // Exclure le rdv actuel en cours de modification
      $or: [
        { paymentStatus: "completed" },
        { paymentStatus: "pending", createdAt: { $gt: new Date(Date.now() - 30 * 60 * 1000) } }
      ]
    });

    if (existingAppointmentForNewSlot) {
      console.log("❌ Nouveau créneau spécifique déjà réservé:", {
        date: new Date(newAvailability.date).toLocaleDateString("fr-FR"),
        slot: `${newSlotStartTime} - ${newSlotEndTime}`,
        appointmentId: existingAppointmentForNewSlot._id,
      });
      return res.status(400).json({ message: "Ce nouveau créneau spécifique est déjà réservé." });
    }
    console.log("✅ Nouveau créneau spécifique disponible.");

    // Conserver l'ancienne date/heure pour la notification et libérer l'ancien créneau
    const oldAvailabilitySlot = await Availability.findById(appointment.availability);
    const oldDate = oldAvailabilitySlot ? oldAvailabilitySlot.date : "";
    const oldTime = appointment.slotStartTime; 

    if (oldAvailabilitySlot) {
      oldAvailabilitySlot.isBooked = false;
      await oldAvailabilitySlot.save();
      console.log("✅ Ancien créneau de disponibilité libéré:", oldAvailabilitySlot._id);
    }

    // Réserver le nouveau créneau (newAvailability a déjà été récupéré et vérifié)
    newAvailability.isBooked = true;
    await newAvailability.save();
    console.log("✅ Nouveau créneau de disponibilité marqué comme réservé:", newAvailability._id);

    // Mettre à jour le rendez-vous
    appointment.availability = newAvailabilityId;
    appointment.slotStartTime = newSlotStartTime;
    appointment.slotEndTime = newSlotEndTime;
    appointment.status = "rescheduled";
    // price and duration could be updated if they change with the new availability, e.g. from doctor's profile
    // appointment.price = newAvailability.price || appointment.price; // Example if price is on availability
    // appointment.duration = newAvailability.duration || appointment.duration; // Example

    const updatedAppointment = await appointment.save();
    console.log("✅ Rendez-vous reprogrammé avec succès par le patient:", updatedAppointment._id);

    // Envoyer des notifications
    await notificationService.notifyAppointmentRescheduledByPatient(updatedAppointment, oldDate, oldTime);
    await notificationService.scheduleAppointmentReminders(updatedAppointment);
    
    console.log("===== FIN REPROGRAMMATION PAR PATIENT =====");
    res.status(200).json(updatedAppointment);

  } catch (error) {
    console.error("❌ Erreur lors de la reprogrammation du rendez-vous par le patient:", error);
    res.status(500).json({ message: "Erreur serveur lors de la reprogrammation." });
  }
};

// @desc    Annuler un rendez-vous
// @route   DELETE /api/appointments/:id
// @access  Private
exports.cancelAppointment = async (req, res) => {
  try {
    // Récupérer l'ID du patient
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: "Patient non trouvé" });
    }

    const appointmentId = req.params.id;

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      patient: patient._id,
    });

    if (!appointment) {
      return res.status(404).json({ message: "Rendez-vous non trouvé" });
    }

    // Vérifier si le rendez-vous peut être annulé (pas déjà passé)
    const availability = await Availability.findById(appointment.availability);
    const appointmentDate = new Date(
      `${availability.date}T${availability.startTime}`,
    );

    if (appointmentDate < new Date()) {
      return res
        .status(400)
        .json({ message: "Impossible d'annuler un rendez-vous passé" });
    }

    // Mettre à jour le statut du rendez-vous
    appointment.status = "cancelled";

    // Passer le statut de paiement à 'refunded'
    appointment.paymentStatus = "refunded";

    // Traiter le remboursement automatiquement
    try {
      // Utiliser le service de remboursement partiel (80%)
      await paymentService.processPartialRefund(appointmentId);
    } catch (refundError) {
      console.error("Erreur lors du remboursement:", refundError);
      // Continuer avec l'annulation même si le remboursement échoue
    }

    await appointment.save();

    // Libérer le créneau de disponibilité
    availability.isBooked = false;
    await availability.save();

    // Envoyer une notification au médecin
    await notificationService.notifyAppointmentCancelled(appointment);

    res.status(200).json({
      message: "Rendez-vous annulé avec succès",
      paymentStatus: "refunded",
    });
  } catch (error) {
    console.error("Erreur lors de l'annulation du rendez-vous:", error);
    res
      .status(500)
      .json({ message: "Erreur serveur lors de l'annulation du rendez-vous" });
  }
};
