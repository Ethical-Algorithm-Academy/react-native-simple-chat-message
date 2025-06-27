import React from 'react';
import { View, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import ScreenTitle from '../components/ScreenTitle';
import { useNavigation } from '@react-navigation/native';



const ConfigurationsScreen = () => {
  const navigation = useNavigation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleMFASetup = () => {
    navigation.navigate('MFASetup');
  };

  return (
    <ScreenContainer>
      <ScreenTitle>Configurations</ScreenTitle>
      <View style={styles.buttonContainer}>
        <PrimaryButton onPress={handleMFASetup} style={styles.button}>
          MFA Setup
        </PrimaryButton>
        <PrimaryButton onPress={handleLogout} style={styles.button}>
          Logout
        </PrimaryButton>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
    gap: 16,
  },
  button: {
    marginVertical: 8,
  },
});

export default ConfigurationsScreen; 