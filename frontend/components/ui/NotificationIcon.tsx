import React, { useContext } from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { NotificationContext } from '../../contexts/NotificationContext';
import NotificationBadge from './NotificationBadge';

interface NotificationIconProps {
  onPress: () => void;
  unreadCount?: number;
  style?: ViewStyle;
  color?: string;
}

/**
 * Icône de notification avec badge pour indiquer les notifications non lues
 */
export const NotificationIcon = ({ onPress, unreadCount, style, color }: NotificationIconProps) => {
  const { colors } = useTheme();
  const { notificationQueue } = useContext(NotificationContext);
  
  // Si unreadCount n'est pas fourni, utiliser la longueur de la file d'attente des notifications
  const count = unreadCount !== undefined ? unreadCount : notificationQueue.length;
  
  // Déterminer la couleur de l'icône: si une couleur est spécifiée, l'utiliser, sinon utiliser la couleur du texte du thème
  const iconColor = color || colors.text;

  return (
    <TouchableOpacity onPress={onPress} style={[styles.container, style]}>
      <FontAwesome 
        name="bell" 
        size={24} 
        color={iconColor}
      />
      
      {count > 0 && (
        <NotificationBadge 
          count={count}
          style={styles.badge}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
});

export default NotificationIcon; 