/**
 * Script pour mettre à jour les spécialisations des questions et des médecins
 * À exécuter avec: node scripts/updateSpecializations.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Question = require('../models/Question');
const Doctor = require('../models/Doctor');
const Specialization = require('../models/Specialization');

// Charger les variables d'environnement
dotenv.config();

// URI de connexion MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://daneeliasgharib:dJPJGQxtto8hp8il@telehealth.1ji8cro.mongodb.net/?retryWrites=true&w=majority&appName=teleHealth';

// Connexion à MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connecté'))
  .catch(err => {
    console.error('Erreur de connexion MongoDB:', err);
    process.exit(1);
  });

// Liste des spécialisations communes
const SPECIALIZATIONS = [
  'Cardiology',
  'Neurology',
  'Dermatology',
  'Pediatrics',
  'Orthopedics',
  'Psychiatry',
  'General Medicine'
];

// Fonction principale
async function main() {
  try {
    console.log('Début de la mise à jour des spécialisations...');
    
    // 1. Créer ou récupérer les spécialisations
    const specializations = await createSpecializations();
    
    // 2. Mettre à jour les questions
    await updateQuestions(specializations);
    
    // 3. Mettre à jour les médecins
    await updateDoctors(specializations);
    
    console.log('Mise à jour terminée avec succès!');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    process.exit(1);
  }
}

// Créer ou récupérer les spécialisations
async function createSpecializations() {
  console.log('Création/récupération des spécialisations...');
  const specializations = [];
  
  for (const name of SPECIALIZATIONS) {
    let spec = await Specialization.findOne({ name });
    
    if (!spec) {
      spec = await Specialization.create({ name });
      console.log(`Spécialisation créée: ${name}`);
    } else {
      console.log(`Spécialisation existante: ${name}`);
    }
    
    specializations.push(spec);
  }
  
  return specializations;
}

// Mettre à jour les questions avec des spécialisations
async function updateQuestions(specializations) {
  console.log('Mise à jour des questions...');
  
  const questions = await Question.find({});
  console.log(`Trouvé ${questions.length} questions à mettre à jour`);
  
  for (let i = 0; i < questions.length; i++) {
    // Attribuer une spécialisation aléatoire à chaque question
    const randomIndex = Math.floor(Math.random() * specializations.length);
    const specialization = specializations[randomIndex];
    
    questions[i].specialization = specialization._id;
    await questions[i].save();
    
    console.log(`Question ${i+1}/${questions.length} mise à jour avec la spécialisation ${specialization.name}`);
  }
}

// Mettre à jour les médecins avec des spécialisations
async function updateDoctors(specializations) {
  console.log('Mise à jour des médecins...');
  
  const doctors = await Doctor.find({});
  console.log(`Trouvé ${doctors.length} médecins à mettre à jour`);
  
  for (let i = 0; i < doctors.length; i++) {
    // Attribuer 1-3 spécialisations aléatoires à chaque médecin
    const numSpecializations = Math.floor(Math.random() * 3) + 1;
    const doctorSpecializations = [];
    
    for (let j = 0; j < numSpecializations; j++) {
      const randomIndex = Math.floor(Math.random() * specializations.length);
      const specialization = specializations[randomIndex];
      
      if (!doctorSpecializations.includes(specialization._id)) {
        doctorSpecializations.push(specialization._id);
      }
    }
    
    doctors[i].specializations = doctorSpecializations;
    
    // Mettre également à jour le champ specialization avec le nom de la première spécialisation
    if (doctorSpecializations.length > 0) {
      const primarySpec = await Specialization.findById(doctorSpecializations[0]);
      doctors[i].specialization = primarySpec.name;
    }
    
    await doctors[i].save();
    
    console.log(`Médecin ${i+1}/${doctors.length} mis à jour avec ${doctorSpecializations.length} spécialisations`);
  }
}

// Exécuter le script
main(); 