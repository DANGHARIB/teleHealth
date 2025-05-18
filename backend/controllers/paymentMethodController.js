const PaymentMethod = require('../models/PaymentMethod');
const Patient = require('../models/Patient');

// @desc    Ajouter une nouvelle méthode de paiement
// @route   POST /api/payment-methods
// @access  Private/Patient
exports.addPaymentMethod = async (req, res) => {
  try {
    // Récupérer le patient
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }

    const {
      name,
      type,
      cardholderName,
      cardNumber,
      expiryMonth,
      expiryYear,
      cvv,
      cardType
    } = req.body;

    // Vérifier les données requises
    if (!name || !type) {
      return res.status(400).json({ message: 'Nom et type de paiement requis' });
    }

    // Vérifier les données spécifiques aux cartes
    if (type === 'card') {
      if (!cardholderName || !cardNumber || !expiryMonth || !expiryYear || !cvv) {
        return res.status(400).json({ message: 'Informations de carte incomplètes' });
      }
    }

    // Vérifier si c'est la première méthode de paiement (pour définir comme défaut)
    const existingMethods = await PaymentMethod.countDocuments({ patient: patient._id });
    const isDefault = existingMethods === 0;

    // Extraire les 4 derniers chiffres de la carte
    const lastFourDigits = type === 'card' ? cardNumber.slice(-4) : null;

    // Créer la méthode de paiement
    const paymentMethod = new PaymentMethod({
      patient: patient._id,
      name,
      type,
      cardholderName: type === 'card' ? cardholderName : undefined,
      lastFourDigits,
      expiryMonth: type === 'card' ? expiryMonth : undefined,
      expiryYear: type === 'card' ? expiryYear : undefined,
      cardType: type === 'card' ? cardType : undefined,
      isDefault
    });

    const savedMethod = await paymentMethod.save();

    res.status(201).json(savedMethod);
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la méthode de paiement:', error);
    res.status(500).json({ message: 'Erreur serveur lors de l\'ajout de la méthode de paiement' });
  }
};

// @desc    Obtenir toutes les méthodes de paiement du patient
// @route   GET /api/payment-methods
// @access  Private/Patient
exports.getPaymentMethods = async (req, res) => {
  try {
    // Récupérer le patient
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }

    const paymentMethods = await PaymentMethod.find({ patient: patient._id })
      .sort({ isDefault: -1, createdAt: -1 });

    res.status(200).json(paymentMethods);
  } catch (error) {
    console.error('Erreur lors de la récupération des méthodes de paiement:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des méthodes de paiement' });
  }
};

// @desc    Définir une méthode de paiement comme défaut
// @route   PUT /api/payment-methods/:id/default
// @access  Private/Patient
exports.setDefaultPaymentMethod = async (req, res) => {
  try {
    // Récupérer le patient
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }

    // Vérifier si la méthode de paiement existe et appartient au patient
    const paymentMethod = await PaymentMethod.findOne({
      _id: req.params.id,
      patient: patient._id
    });

    if (!paymentMethod) {
      return res.status(404).json({ message: 'Méthode de paiement non trouvée' });
    }

    // Réinitialiser toutes les méthodes de paiement du patient
    await PaymentMethod.updateMany(
      { patient: patient._id },
      { isDefault: false }
    );

    // Définir la méthode de paiement sélectionnée comme défaut
    paymentMethod.isDefault = true;
    await paymentMethod.save();

    res.status(200).json({ message: 'Méthode de paiement définie comme défaut' });
  } catch (error) {
    console.error('Erreur lors de la définition de la méthode de paiement par défaut:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la définition de la méthode de paiement par défaut' });
  }
};

// @desc    Supprimer une méthode de paiement
// @route   DELETE /api/payment-methods/:id
// @access  Private/Patient
exports.deletePaymentMethod = async (req, res) => {
  try {
    // Récupérer le patient
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }

    // Vérifier si la méthode de paiement existe et appartient au patient
    const paymentMethod = await PaymentMethod.findOne({
      _id: req.params.id,
      patient: patient._id
    });

    if (!paymentMethod) {
      return res.status(404).json({ message: 'Méthode de paiement non trouvée' });
    }

    // Si c'était la méthode par défaut, il faut en définir une autre si possible
    const wasDefault = paymentMethod.isDefault;

    // Supprimer la méthode de paiement
    await paymentMethod.remove();

    // Si c'était la méthode par défaut, définir une autre méthode comme défaut
    if (wasDefault) {
      const nextDefault = await PaymentMethod.findOne({ patient: patient._id })
        .sort({ createdAt: -1 });

      if (nextDefault) {
        nextDefault.isDefault = true;
        await nextDefault.save();
      }
    }

    res.status(200).json({ message: 'Méthode de paiement supprimée' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la méthode de paiement:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la suppression de la méthode de paiement' });
  }
}; 