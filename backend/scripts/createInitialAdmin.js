const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');
const connectDB = require('../config/db');

dotenv.config();

/**
 * Script pour créer un compte administrateur initial
 * Le mot de passe sera automatiquement haché par le middleware pre-save du modèle User
 * Utiliser: node scripts/createInitialAdmin.js
 */
const createAdmin = async () => {
  try {
    // Connexion à la base de données en utilisant la fonction du projet
    await connectDB();
    console.log('MongoDB connecté - Prêt à créer l\'administrateur');

    // Paramètres de l'administrateur, à définir dans .env ou utiliser les valeurs par défaut
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@admin.com';
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'password';
    const adminName = process.env.INITIAL_ADMIN_NAME || 'Admin';
    
    // Vérifier si l'administrateur existe déjà
    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      console.log(`Utilisateur administrateur ${adminEmail} existe déjà`);
      
      // Mise à jour du mot de passe si nécessaire (réinitialisation)
      // Le middleware pre-save se chargera automatiquement du hachage
      existingUser.password = adminPassword;
      await existingUser.save(); // Laisser le middleware faire son travail
      
      console.log(`Mot de passe de l'administrateur réinitialisé.`);
      console.log(`Email: ${adminEmail}`);
      console.log(`Mot de passe: ${adminPassword}`);
      
      mongoose.connection.close();
      return;
    }

    // Création de l'administrateur avec mot de passe en clair
    // Le middleware pre-save du modèle User se chargera automatiquement du hachage
    const admin = new User({
      fullName: adminName,
      email: adminEmail,
      password: adminPassword, // Mot de passe en clair - sera haché par le middleware
      role: 'Admin',
      verified: true,
      profileStatus: 'approved'
    });
    
    // Sauvegarder normalement - le middleware pre-save hachera automatiquement le mot de passe
    await admin.save();

    console.log(`✅ Administrateur créé avec succès: ${admin.email}`);
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Mot de passe: ${adminPassword}`);
    console.log(`🔐 Le mot de passe a été automatiquement haché par le middleware`);
    console.log(`⚠️  N'oubliez pas de changer le mot de passe après la première connexion!`);
    
    // Vérification que le mot de passe a bien été haché
    const savedAdmin = await User.findOne({ email: adminEmail });
    console.log(`🧪 Vérification - Mot de passe haché: ${savedAdmin.password.startsWith('$2b$') ? 'OUI' : 'NON'}`);
    
    mongoose.connection.close();
  } catch (error) {
    console.error(`❌ Erreur lors de la création de l'administrateur: ${error.message}`);
    console.error(error);
    try {
      mongoose.connection.close();
    } catch (e) {
      // ignore
    }
  }
};

createAdmin();