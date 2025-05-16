const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Modèles
const { 
  User, 
  Doctor, 
  Patient, 
  Specialization, 
  Question 
} = require('../models');

// URL de connexion MongoDB
const MONGODB_URI = process.env.MONGODB_URI;

// Données initiales pour les spécialisations
const specializationData = [
  { name: 'Depression/Anxiety' },
  { name: 'Child Development' },
  { name: 'Emotional Support' },
  { name: 'PTSD/Trauma' },
  { name: 'Disability Support' }
];

// Données initiales pour les utilisateurs
const userData = [
  {
    fullName: 'Dr. Jane Doe',
    email: 'jane.doe@example.com',
    password: 'password123',
    role: 'Doctor',
    verified: true,
    profileStatus: 'pending'
  },
  {
    fullName: 'Dr. Michael Brown',
    email: 'michael.brown@example.com',
    password: 'password123',
    role: 'Doctor',
    verified: true,
    profileStatus: 'pending'
  },
  {
    fullName: 'Dr. Emily White',
    email: 'emily.white@example.com',
    password: 'password123',
    role: 'Doctor',
    verified: true,
    profileStatus: 'pending'
  },
  {
    fullName: 'Dr. Robert Green',
    email: 'robert.green@example.com',
    password: 'password123',
    role: 'Doctor',
    verified: true,
    profileStatus: 'pending'
  },
  {
    fullName: 'Elio Sarkis',
    email: 'elio@test.com',
    password: 'password123',
    role: 'Patient',
    verified: true,
    profileStatus: 'pending'
  }
];

// Données initiales pour les questions
const questionData = [
  {
    questionText: 'Does your child have difficulty focusing at school?',
    type: 'YesNo',
    targetGroup: 'child'
  },
  {
    questionText: 'How would you describe your child\'s behavior at school settings?',
    type: 'Text',
    targetGroup: 'child'
  },
  {
    questionText: 'Do you experience prolonged periods of sadness?',
    type: 'YesNo',
    targetGroup: 'adult'
  },
  {
    questionText: 'Which of these symptoms do you experience often?',
    type: 'MultiChoice',
    options: 'Anxiety,Insomnia,Lack of Interest,Excessive Worry,None',
    targetGroup: 'adult'
  },
  {
    questionText: 'Do you have trouble remembering recent events?',
    type: 'YesNo',
    targetGroup: 'adult'
  },
  {
    questionText: 'Have you experienced any of these symptoms?',
    type: 'MultiChoice',
    options: 'Headaches,Dizziness,Memory Loss,Confusion,None',
    targetGroup: 'adult'
  },
  {
    questionText: 'Are you currently dealing with stress related to relationships?',
    type: 'YesNo',
    targetGroup: 'adult'
  },
  {
    questionText: 'What are your main coping strategies during emotional stress?',
    type: 'Text',
    targetGroup: 'adult'
  },
  {
    questionText: 'Has your child been diagnosed with a learning difficulty?',
    type: 'YesNo',
    targetGroup: 'child'
  },
  {
    questionText: 'Which challenges does your child face in school?',
    type: 'MultiChoice',
    options: 'Reading,Writing,Concentration,Socialization,None',
    targetGroup: 'child'
  },
  {
    questionText: 'Do you face challenges communicating verbally?',
    type: 'YesNo',
    targetGroup: 'disability'
  },
  {
    questionText: 'Do you require assistance with mobility?',
    type: 'YesNo',
    targetGroup: 'disability'
  }
];

// Fonction pour peupler la base de données
const seedDatabase = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('MongoDB connecté pour le seeding');
    
    // Nettoyer la base de données
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Patient.deleteMany({});
    await Specialization.deleteMany({});
    await Question.deleteMany({});
    
    console.log('Base de données nettoyée');
    
    // Peupler les spécialisations
    const specializations = await Specialization.insertMany(specializationData);
    console.log(`${specializations.length} spécialisations créées`);
    
    // Associer les IDs de spécialisation
    const specializationIds = specializations.map(spec => spec._id);
    
    // Peupler les questions avec les spécialisations
    const questions = await Promise.all(
      questionData.map(async (q, index) => {
        // Répartir les questions entre les spécialisations
        const specIndex = index % specializationIds.length;
        q.specialization = specializationIds[specIndex];
        return q;
      })
    );
    
    await Question.insertMany(questions);
    console.log(`${questions.length} questions créées`);
    
    // Peupler les utilisateurs et profils
    for (const user of userData) {
      // Hasher le mot de passe
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.password, salt);
      
      // Créer l'utilisateur
      const newUser = await User.create({
        ...user,
        password: hashedPassword
      });
      
      // Créer le profil correspondant
      if (user.role === 'Doctor') {
        // Répartir les médecins entre les spécialisations
        const specIndex = Math.floor(Math.random() * specializationIds.length);
        
        await Doctor.create({
          user: newUser._id,
          full_name: user.fullName,
          specialization: specializationIds[specIndex],
          doctor_image: user.fullName === 'Dr. Jane Doe' ? 'uploads/dr_jane_doe.jpg' : null,
          about: user.fullName === 'Dr. Jane Doe' ? 'I help children reach developmental milestones.' : null,
          education: user.fullName === 'Dr. Jane Doe' ? 'PhD Child Development, University X' : null,
          experience: user.fullName === 'Dr. Jane Doe' ? 12 : 0,
          price: user.fullName === 'Dr. Jane Doe' ? 120 : 0,
          verified: true,
          dob: new Date('1980-02-15')
        });
      } else if (user.role === 'Patient') {
        await Patient.create({
          user: newUser._id,
          first_name: 'Elio',
          last_name: 'Sarkis',
          gender: 'Male',
          date_of_birth: new Date(),
          has_taken_assessment: true
        });
      }
    }
    
    console.log(`${userData.length} utilisateurs et profils créés`);
    
    console.log('Seeding terminé !');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors du seeding:', error);
    process.exit(1);
  }
};

seedDatabase(); 