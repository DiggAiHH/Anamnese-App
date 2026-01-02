/**
 * Root Navigator - Stack Navigation
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Screens (werden später implementiert)
import { HomeScreen } from '../screens/HomeScreen';

export type RootStackParamList = {
  Home: undefined;
  SelectLanguage: undefined;
  MasterPassword: { mode: 'setup' | 'unlock' };
  PatientInfo: undefined;
  GDPRConsent: undefined;
  Questionnaire: { questionnaireId: string };
  Summary: { questionnaireId: string };
  Export: { questionnaireId: string };
};

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator = (): React.JSX.Element => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2563eb',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Anamnese' }}
      />
      {/* Weitere Screens werden später hinzugefügt */}
    </Stack.Navigator>
  );
};
