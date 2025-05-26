/**
 * Script pour mettre à jour les questions d'évaluation
 * Supprime les anciennes questions et ajoute les nouvelles
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Question = require('../models/Question');
const { assessmentQuestions } = require('../services/assessmentService');

// Charger les variables d'environnement
dotenv.config();

// Définir l'URL MongoDB (utiliser la variable d'environnement ou une valeur par défaut)
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb+srv://zeraawiserena:HScNMIbm1J3dR83V@tabeeboucom.wtwleh9.mongodb.net/?retryWrites=true&w=majority&appName=Tabeeboucom';

console.log('Tentative de connexion à MongoDB avec URI:', MONGODB_URI);

// Connecter à MongoDB
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✓ Connecté à MongoDB');
    
    try {
      // 1. Supprimer toutes les questions existantes
      console.log('Suppression des anciennes questions...');
      await Question.deleteMany({});
      console.log('✓ Anciennes questions supprimées');
      
      // 2. Ajouter les nouvelles questions
      console.log('Ajout des nouvelles questions...');
      
      for (const question of assessmentQuestions) {
        await Question.create(question);
        console.log(`✓ Question ajoutée: ${question.id} - ${question.questionText.substring(0, 50)}...`);
      }
      
      console.log(`✓ ${assessmentQuestions.length} nouvelles questions ajoutées avec succès`);
      
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour des questions:', error);
    } finally {
      // Fermer la connexion
      mongoose.connection.close();
      console.log('Connexion à MongoDB fermée');
    }
  })
  .catch(error => {
    console.error('❌ Erreur de connexion à MongoDB:', error);
  }); 