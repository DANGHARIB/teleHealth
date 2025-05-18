import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native';

/**
 * Composant Text personnalisé qui applique des styles cohérents à travers l'application
 */
export const Text = ({ style, children, ...props }) => {
  const { colors } = useTheme();
  
  return (
    <RNText 
      style={[
        styles.text, 
        { color: colors.text },
        style
      ]} 
      {...props}
    >
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  text: {
    fontFamily: 'System',
    fontSize: 14,
  },
});

export default Text; 