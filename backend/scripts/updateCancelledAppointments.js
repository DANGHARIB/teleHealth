/**
 * Script pour mettre à jour les rendez-vous annulés existants
 * Exécuter avec: node scripts/updateCancelledAppointments.js
 */

const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');

// Utiliser directement l'URI MongoDB
const mongoURI = 'mongodb://localhost:27017/medical-app'; // Ajustez selon votre configuration

// Connexion à la base de données
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connecté'))
.catch(err => {
  console.error('Erreur de connexion MongoDB:', err);
  process.exit(1);
});

const updateCancelledAppointments = async () => {
  try {
    // Trouver tous les rendez-vous annulés avec statut de paiement "pending"
    const appointments = await Appointment.find({
      status: 'cancelled',
      paymentStatus: 'pending'
    });

    console.log(`Trouvé ${appointments.length} rendez-vous annulés à mettre à jour`);

    // Mettre à jour le statut de paiement
    for (const appointment of appointments) {
      appointment.paymentStatus = 'refunded';
      await appointment.save();
      console.log(`Rendez-vous ${appointment._id} mis à jour`);
    }

    console.log('Mise à jour terminée');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    process.exit(1);
  }
};

updateCancelledAppointments(); 