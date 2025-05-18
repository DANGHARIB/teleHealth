import React, { useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { NotificationContext } from '../../contexts/NotificationContext';
import { Text } from './Text';
import { useTheme } from '@react-navigation/native';

interface NotificationBadgeProps {
  count?: number;
  onPress?: () => void;
  style?: ViewStyle;
}

/**
 * Composant Badge de notification qui affiche le nombre de notifications non lues
 */
export const NotificationBadge = ({ count = 0, onPress, style }: NotificationBadgeProps) => {
  const { colors } = useTheme();
  const { lastNotification } = useContext(NotificationContext);

  // Si count n'est pas explicitement fourni et qu'il y a une dernière notification
  const displayCount = count || (lastNotification ? 1 : 0);

  // Ne rien afficher s'il n'y a pas de notifications
  if (displayCount === 0) {
    return null;
  }

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress}>
      <View 
        style={[
          styles.badge, 
          { backgroundColor: colors.notification || '#FF3B30' },
          style
        ]}
      >
        <Text style={styles.text}>
          {displayCount > 99 ? '99+' : displayCount}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  text: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    lineHeight: 14,
  },
});

export default NotificationBadge; 