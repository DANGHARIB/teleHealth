/**
 * Service pour gérer les questions d'évaluation et calculer les recommandations
 */

/**********************************************************************
 * 1. Doctor specializations (MongoDB _id values)
 *********************************************************************/
const specializations = {
  EMOTIONAL_SUPPORT : '68277ad1a509f09b51a8e84a',
  DISABILITY_SUPPORT: '68277ad1a509f09b51a8e84c',
  PTSD_TRAUMA       : '68277ad1a509f09b51a8e84b',
  CHILD_DEVELOPMENT : '68277ad1a509f09b51a8e849',
  DEPRESSION_ANXIETY: '68286253d9598f93465bbbbf',
};

/**********************************************************************
 * 2. Assessment questions (English) + scoring map
 *********************************************************************/
const assessmentQuestions = [
  /*  1 */ {
    id: 1,
    questionText:
      'During the past two weeks, have you felt sad or lost interest in most activities nearly every day?',
    type: 'YesNo',
    options: ['Yes', 'No'],
    scoring: { Yes: specializations.DEPRESSION_ANXIETY },
  },
  /*  2 */ {
    id: 2,
    questionText:
      'Do you often experience intense anxiety or panic attacks without a clear cause?',
    type: 'YesNo',
    options: ['Yes', 'No'],
    scoring: { Yes: specializations.DEPRESSION_ANXIETY },
  },
  /*  3 */ {
    id: 3,
    questionText:
      'Have you recently gone through a traumatic event that still affects you today?',
    type: 'YesNo',
    options: ['Yes', 'No'],
    scoring: { Yes: specializations.PTSD_TRAUMA },
  },
  /*  4 */ {
    id: 4,
    questionText:
      'Do you have recurring nightmares or flashbacks related to a past event?',
    type: 'YesNo',
    options: ['Yes', 'No'],
    scoring: { Yes: specializations.PTSD_TRAUMA },
  },
  /*  5 */ {
    id: 5,
    questionText:
      'Do you struggle to manage everyday emotions and feel you need support for daily stress?',
    type: 'YesNo',
    options: ['Yes', 'No'],
    scoring: { Yes: specializations.EMOTIONAL_SUPPORT },
  },
  /*  6 */ {
    id: 6,
    questionText:
      'Do you feel isolated or need someone to talk to regularly about your feelings?',
    type: 'YesNo',
    options: ['Yes', 'No'],
    scoring: { Yes: specializations.EMOTIONAL_SUPPORT },
  },
  /*  7 */ {
    id: 7,
    questionText:
      'Do you face physical challenges (mobility, daily tasks) that require specialised assistance?',
    type: 'YesNo',
    options: ['Yes', 'No'],
    scoring: { Yes: specializations.DISABILITY_SUPPORT },
  },
  /*  8 */ {
    id: 8,
    questionText:
      'Is your ability to communicate (speaking, reading, writing) limited by a disability?',
    type: 'YesNo',
    options: ['Yes', 'No'],
    scoring: { Yes: specializations.DISABILITY_SUPPORT },
  },
  /*  9 */ {
    id: 9,
    questionText:
      'Does your child struggle to reach age-appropriate developmental milestones?',
    type: 'YesNo',
    options: ['Yes', 'No'],
    scoring: { Yes: specializations.CHILD_DEVELOPMENT },
  },
  /* 10 */ {
    id: 10,
    questionText:
      'Does your child have difficulty concentrating or socialising with peers?',
    type: 'YesNo',
    options: ['Yes', 'No'],
    scoring: { Yes: specializations.CHILD_DEVELOPMENT },
  },
  /* 11 */ {
    id: 11,
    questionText:
      'Which of the following best describes your PRIMARY concern today?',
    type: 'MultiChoice',
    options: [
      { key: 'A', label: 'Persistent sadness or anxiety' },
      { key: 'B', label: 'Distressing memories of trauma' },
      { key: 'C', label: 'Need for emotional support' },
      { key: 'D', label: 'Physical or sensory limitations' },
      { key: 'E', label: 'Child learning/behaviour issues' },
    ],
    scoring: {
      A: specializations.DEPRESSION_ANXIETY,
      B: specializations.PTSD_TRAUMA,
      C: specializations.EMOTIONAL_SUPPORT,
      D: specializations.DISABILITY_SUPPORT,
      E: specializations.CHILD_DEVELOPMENT,
    },
  },
  /* 12 */ {
    id: 12,
    questionText:
      'What kind of help are you primarily looking for from a healthcare professional?',
    type: 'MultiChoice',
    options: [
      { key: 'A', label: 'Anxiety or depression management' },
      { key: 'B', label: 'Trauma-focused therapy' },
      { key: 'C', label: 'Regular emotional coaching' },
      { key: 'D', label: 'Rehabilitation or assistive advice' },
      { key: 'E', label: 'Child development assessment' },
    ],
    scoring: {
      A: specializations.DEPRESSION_ANXIETY,
      B: specializations.PTSD_TRAUMA,
      C: specializations.EMOTIONAL_SUPPORT,
      D: specializations.DISABILITY_SUPPORT,
      E: specializations.CHILD_DEVELOPMENT,
    },
  },
  /* 13 */ {
    id: 13,
    questionText:
      'Which sleep pattern best matches your situation?',
    type: 'MultiChoice',
    options: [
      { key: 'A', label: 'Insomnia or early waking with racing thoughts' },
      { key: 'B', label: 'Nightmares linked to past trauma' },
      { key: 'C', label: 'Sleep is fine; daytime emotions overwhelm me' },
      { key: 'D', label: 'Pain or limited mobility wakes me up' },
      { key: 'E', label: 'I am mainly concerned about my child sleep' },
    ],
    scoring: {
      A: specializations.DEPRESSION_ANXIETY,
      B: specializations.PTSD_TRAUMA,
      C: specializations.EMOTIONAL_SUPPORT,
      D: specializations.DISABILITY_SUPPORT,
      E: specializations.CHILD_DEVELOPMENT,
    },
  },
  /* 14 */ {
    id: 14,
    questionText:
      'When you feel stressed, which coping strategy do you use most often?',
    type: 'MultiChoice',
    options: [
      { key: 'A', label: 'Withdraw and lose interest in activities' },
      { key: 'B', label: 'Relive the event or avoid reminders' },
      { key: 'C', label: 'Talk it out for emotional relief' },
      { key: 'D', label: 'Depend on physical aids/adjustments' },
      { key: 'E', label: 'Seek advice for my child' },
    ],
    scoring: {
      A: specializations.DEPRESSION_ANXIETY,
      B: specializations.PTSD_TRAUMA,
      C: specializations.EMOTIONAL_SUPPORT,
      D: specializations.DISABILITY_SUPPORT,
      E: specializations.CHILD_DEVELOPMENT,
    },
  },
  /* 15 */ {
    id: 15,
    questionText:
      'What outcome are you primarily hoping to achieve through telehealth?',
    type: 'MultiChoice',
    options: [
      { key: 'A', label: 'Reduce anxiety or depression symptoms' },
      { key: 'B', label: 'Process and heal from trauma' },
      { key: 'C', label: 'Ongoing emotional check-ins' },
      { key: 'D', label: 'Improve physical functioning/adaptation' },
      { key: 'E', label: 'Support child growth and learning' },
    ],
    scoring: {
      A: specializations.DEPRESSION_ANXIETY,
      B: specializations.PTSD_TRAUMA,
      C: specializations.EMOTIONAL_SUPPORT,
      D: specializations.DISABILITY_SUPPORT,
      E: specializations.CHILD_DEVELOPMENT,
    },
  },
  /* 16 */ {
    id: 16,
    questionText:
      'Which challenge interferes MOST with your day-to-day life?',
    type: 'MultiChoice',
    options: [
      { key: 'A', label: 'Persistent low mood or worry' },
      { key: 'B', label: 'Flashbacks or hyper-vigilance' },
      { key: 'C', label: 'Difficulty expressing feelings/support' },
      { key: 'D', label: 'Mobility or coordination issues' },
      { key: 'E', label: 'Child academic/behavioural struggles' },
    ],
    scoring: {
      A: specializations.DEPRESSION_ANXIETY,
      B: specializations.PTSD_TRAUMA,
      C: specializations.EMOTIONAL_SUPPORT,
      D: specializations.DISABILITY_SUPPORT,
      E: specializations.CHILD_DEVELOPMENT,
    },
  },
];

/**********************************************************************
 * 3. Scoring helper – returns specializations sorted by score
 *    answers = array of user responses in question order
 *********************************************************************/
function recommendSpecializations(answers) {
  const scores = {};

  // Parcourir toutes les réponses
  Object.keys(answers).forEach(questionId => {
    const question = assessmentQuestions.find(q => q.id === parseInt(questionId));
    if (!question) return; // Question non trouvée
    
    const userAnswer = answers[questionId];
    if (!userAnswer) return; // Pas de réponse
    
    let target;
    
    // Gérer différents formats de réponses
    if (question.type === 'YesNo') {
      target = question.scoring[userAnswer];
    } else if (question.type === 'MultiChoice') {
      // Pour MultiChoice, la réponse peut être une clé (A, B, C, etc.)
      target = question.scoring[userAnswer];
    }
    
    if (target) {
      scores[target] = (scores[target] || 0) + 1;
    }
  });

  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([specializationId, score]) => ({ specializationId, score }));
}

/**********************************************************************
 * 4. Module exports
 *********************************************************************/
module.exports = {
  specializations,
  assessmentQuestions,
  recommendSpecializations,
}; 