import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DOCTOR_TOKEN_KEY, USER_TYPE_KEY } from '../constants/StorageKeys';

/**
 * Service pour gérer l'authentification des médecins et les opérations liées
 */
const doctorAuthService = {
  /**
   * Vérifie le statut de vérification du compte du médecin
   * @returns {Promise<Object>} Objet contenant le statut de vérification
   */
  async checkVerificationStatus() {
    try {
      // Essayer d'abord d'obtenir le token spécifique aux médecins
      let token = await AsyncStorage.getItem(DOCTOR_TOKEN_KEY);
      
      // Si pas trouvé, essayer le token générique (pour la compatibilité avec l'ancien code)
      if (!token) {
        token = await AsyncStorage.getItem('userToken');
      }
      
      // Si toujours pas de token, utiliser tempUserId pour vérifier le statut
      if (!token) {
        const userId = await AsyncStorage.getItem('tempUserId');
        
        if (userId) {
          return await this.checkVerificationStatusByUserId(userId);
        }
        
        throw new Error('Aucune information d\'authentification trouvée');
      }

      const response = await api.get('/doctors/verification-status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la vérification du statut:', error);
      
      // Si le token est invalide ou expiré, gérer l'erreur d'authentification
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        await AsyncStorage.removeItem(DOCTOR_TOKEN_KEY);
        await AsyncStorage.removeItem('userToken'); // Supprimer également l'ancien format
        throw new Error('Session expirée, veuillez vous reconnecter');
      }
      
      throw error;
    }
  },

  /**
   * Essaie d'obtenir le statut de vérification sans token (pour les utilisateurs non connectés)
   * @param {string} userId - ID de l'utilisateur (ou email encodé)
   * @returns {Promise<Object>} Objet contenant le statut de vérification
   */
  async checkVerificationStatusByUserId(userId) {
    try {
      // Route pour vérifier le statut sans être connecté
      try {
        const response = await api.get(`/doctors/public/verification/${userId}`);
        return response.data;
      } catch (publicRouteError) {
        console.warn('Route publique non disponible, utilisation du status par défaut');
        // Simulation d'une réponse pour tests/développement
        return { status: 'pending', rejectionReason: null };
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du statut par userId:', error);
      throw error;
    }
  }
};

export default doctorAuthService; 