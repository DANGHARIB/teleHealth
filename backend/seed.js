const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db'); // Assurez-vous que ce chemin est correct

// Charger les variables d'env
dotenv.config({ path: './config/config.env' }); // Assurez-vous que ce chemin est correct

// Importer les modèles
const Specialization = require('./models/Specialization');
const Question = require('./models/Question');

// Se connecter à la DB
connectDB();

const specializationsData = [
  { name: 'Depression/Anxiety' },       // Corresponds à specializationId 1 dans votre SQL
  { name: 'Child Development' },        // Corresponds à specializationId 1 puis 2 dans votre SQL (utilisé 2 pour la Q3)
  { name: 'Emotional Support' },        // Corresponds à specializationId 3 dans votre SQL
  { name: 'PTSD/Trauma' },              // Corresponds à specializationId 4 dans votre SQL
  { name: 'Disability Support' }        // Corresponds à specializationId 5 dans votre SQL
];

const importData = async () => {
  try {
    // Supprimer les données existantes pour éviter les doublons
    await Specialization.deleteMany();
    await Question.deleteMany();
    console.log('Anciennes données supprimées...');

    // Insérer les spécialisations
    const createdSpecializations = await Specialization.insertMany(specializationsData);
    console.log('Spécialisations insérées...');

    // Mapper les noms de spécialisation aux ObjectIds créés
    const specializationMap = {};
    createdSpecializations.forEach(spec => {
      // Pour faire le lien avec les IDs de votre SQL pour les questions
      if (spec.name === 'Depression/Anxiety') specializationMap[1] = spec._id; // Utilisé par Q1, Q2
      if (spec.name === 'Child Development') specializationMap[2] = spec._id; // Utilisé par Q3, Q10 (remplace l'ancien ID 1 & 2 pour les questions enfants)
      if (spec.name === 'Emotional Support') specializationMap[3] = spec._id; // Utilisé par Q5, Q6
      if (spec.name === 'PTSD/Trauma') specializationMap[4] = spec._id;       // Utilisé par Q7, Q8
      if (spec.name === 'Disability Support') specializationMap[5] = spec._id; // Utilisé par Q9, Q11, Q12 (remplace l'ancien ID 5)
    });
    
    // Ajustement pour Q1 & Q2 et Q10: 
    // Dans votre dump SQL Q1, Q2 utilisent specId 1 (Depression/Anxiety), ce qui semble étrange pour "child".
    // Q10 utilise specId 2 (Child Development).
    // Je vais mapper Q1 et Q2 à 'Child Development' pour la cohérence, si vous voulez 'Depression/Anxiety' pour Q1, Q2, ajustez ci-dessous.
    // Pour l'instant, specId 1 de votre SQL n'est plus directement mappé à un nom ici, car les questions enfants semblent mieux aller avec "Child Development".
    // Si "Depression/Anxiety" peut aussi concerner des enfants, nous pourrions avoir besoin d'une spécialisation "Child Depression/Anxiety" ou lier Q1/Q2 à "Depression/Anxiety"
    // J'utilise l'ID 2 (Child Development) pour les questions enfants 1, 2, 9, 10.
    // J'utilise l'ID 1 (Depression/Anxiety) pour la question adulte 4.

    const questionsData = [
      { questionText: 'Does your child have difficulty focusing at school?', type: 'YesNo', options: null, specialization: specializationMap[2], targetGroup: 'child' }, // specId 1 (SQL) -> Child Development
      { questionText: 'How would you describe your child\'s behavior in social settings?', type: 'Text', options: null, specialization: specializationMap[2], targetGroup: 'child' }, // specId 1 (SQL) -> Child Development
      { questionText: 'Do you experience prolonged periods of sadness?', type: 'YesNo', options: null, specialization: specializationMap[1], targetGroup: 'adult' }, // specId 2 (SQL) -> Depression/Anxiety
      { questionText: 'Which of these symptoms do you experience often?', type: 'MultiChoice', options: 'Anxiety,Insomnia,Lack of interest,Excessive worry', specialization: specializationMap[1], targetGroup: 'adult' }, // specId 2 (SQL) -> Depression/Anxiety
      { questionText: 'Do you have trouble remembering recent events?', type: 'YesNo', options: null, specialization: specializationMap[3], targetGroup: 'adult' },
      { questionText: 'Have you experienced any of these symptoms?', type: 'MultiChoice', options: 'Headaches,Dizziness,Memory loss,Confusion,None', specialization: specializationMap[3], targetGroup: 'adult' },
      { questionText: 'Are you currently dealing with stress related to relationships or work?', type: 'YesNo', options: null, specialization: specializationMap[4], targetGroup: 'adult' },
      { questionText: 'What are your main coping strategies during emotional stress?', type: 'Text', options: null, specialization: specializationMap[4], targetGroup: 'adult' },
      { questionText: 'Has your child been diagnosed with a learning difficulty?', type: 'YesNo', options: null, specialization: specializationMap[5], targetGroup: 'child' }, // specId 5 (SQL) -> Disability Support (pour enfant)
      { questionText: 'Which challenges does your child face in school?', type: 'MultiChoice', options: 'Reading,Writing,Concentration,Socializing,None', specialization: specializationMap[5], targetGroup: 'child' }, // specId 5 (SQL) -> Disability Support (pour enfant)
      { questionText: 'Do you face challenges communicating verbally?', type: 'YesNo', options: null, specialization: specializationMap[5], targetGroup: 'disability' },
      { questionText: 'Do you require assistance with mobility?', type: 'YesNo', options: null, specialization: specializationMap[5], targetGroup: 'disability' },
    ];

    await Question.insertMany(questionsData);
    console.log('Questions insérées...');

    console.log('Données importées avec succès!');
    process.exit();
  } catch (error) {
    console.error(`Erreur lors de l'importation des données: ${error.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await Specialization.deleteMany();
    await Question.deleteMany();
    console.log('Données détruites avec succès!');
    process.exit();
  } catch (error) {
    console.error(`Erreur lors de la destruction des données: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
} 