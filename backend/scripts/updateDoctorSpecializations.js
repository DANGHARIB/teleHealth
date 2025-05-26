/**
 * Script pour mettre à jour les médecins existants et convertir leurs spécialisations de chaîne à ID MongoDB
 * 
 * Utilisation: node updateDoctorSpecializations.js
 */

const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');
const Specialization = require('../models/Specialization');
const { specializations } = require('../services/assessmentService');
const config = require('../config/config');
const logger = require('../config/logger');

// Correspondances entre les noms de spécialisation et les IDs
const specializationNameToId = {
  "Emotional Support": specializations.EMOTIONAL_SUPPORT,
  "Disability Support": specializations.DISABILITY_SUPPORT,
  "PTSD/Trauma": specializations.PTSD_TRAUMA,
  "Child Development": specializations.CHILD_DEVELOPMENT,
  "Depression/Anxiety": specializations.DEPRESSION_ANXIETY
};

// Correspondance inverse pour le logging
const idToName = {};
Object.entries(specializationNameToId).forEach(([name, id]) => {
  idToName[id] = name;
});

async function updateDoctorSpecializations() {
  try {
    // Connexion à la base de données
    await mongoose.connect(config.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    logger.info('MongoDB connecté');

    // Récupérer tous les médecins
    const doctors = await Doctor.find({});
    logger.info(`Trouvé ${doctors.length} médecins à mettre à jour`);

    // Pour chaque médecin, mettre à jour la spécialisation
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const doctor of doctors) {
      try {
        // Si la spécialisation est déjà un ObjectId, on la garde
        if (mongoose.Types.ObjectId.isValid(doctor.specialization)) {
          const specExists = await Specialization.findById(doctor.specialization);
          if (specExists) {
            logger.info(`Le médecin ${doctor._id} a déjà une spécialisation valide: ${specExists.name} (${doctor.specialization})`);
            skippedCount++;
            continue;
          }
        }

        // Si c'est une chaîne, chercher l'ID correspondant
        if (typeof doctor.specialization === 'string' && doctor.specialization) {
          // Chercher directement dans notre mapping
          const specializationId = specializationNameToId[doctor.specialization];
          
          if (specializationId) {
            doctor.specialization = specializationId;
            await doctor.save();
            logger.info(`Médecin ${doctor._id} mis à jour: spécialisation "${doctor.specialization}" -> ID: ${specializationId} (${idToName[specializationId]})`);
            updatedCount++;
          } else {
            // Si le nom de la spécialisation ne correspond pas exactement, chercher dans la base de données
            const spec = await Specialization.findOne({ name: { $regex: new RegExp(doctor.specialization, 'i') } });
            
            if (spec) {
              doctor.specialization = spec._id;
              await doctor.save();
              logger.info(`Médecin ${doctor._id} mis à jour: spécialisation "${doctor.specialization}" -> ID: ${spec._id} (${spec.name})`);
              updatedCount++;
            } else {
              // Créer une nouvelle spécialisation si elle n'existe pas
              const newSpec = await Specialization.create({ name: doctor.specialization });
              doctor.specialization = newSpec._id;
              await doctor.save();
              logger.info(`Nouvelle spécialisation créée: ${doctor.specialization} (${newSpec._id}) et assignée au médecin ${doctor._id}`);
              updatedCount++;
            }
          }
        } else {
          logger.warn(`Le médecin ${doctor._id} n'a pas de spécialisation définie ou valide`);
          skippedCount++;
        }
      } catch (error) {
        logger.error(`Erreur lors de la mise à jour du médecin ${doctor._id}: ${error.message}`);
        errorCount++;
      }
    }

    logger.info(`Mise à jour terminée: ${updatedCount} médecins mis à jour, ${skippedCount} médecins ignorés, ${errorCount} erreurs`);
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour des spécialisations des médecins: ${error.message}`);
  } finally {
    // Fermer la connexion à la base de données
    mongoose.connection.close();
    logger.info('Connexion à la base de données fermée');
  }
}

// Exécuter le script
updateDoctorSpecializations(); 