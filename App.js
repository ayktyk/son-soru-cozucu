import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen from './src/screens/HomeScreen';
import QuestionScreen from './src/screens/QuestionScreen';
import StatsScreen from './src/screens/StatsScreen';
import MotivationScreen from './src/screens/MotivationScreen';
import { colors } from './src/theme/colors';

const Stack = createStackNavigator();

export default function App() {
  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    document.documentElement.style.height = 'auto';
    document.documentElement.style.overflow = 'auto';
    document.body.style.height = 'auto';
    document.body.style.overflow = 'auto';
    document.body.style.webkitOverflowScrolling = 'touch';

    const root = document.getElementById('root');
    if (root) {
      root.style.height = 'auto';
      root.style.minHeight = '100%';
      root.style.display = 'block';
    }
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.backgroundAlt, elevation: 0, shadowOpacity: 0 },
          headerTintColor: colors.primary,
          headerTitleStyle: { fontWeight: 'bold' },
          cardStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Question" component={QuestionScreen} options={{ title: 'Soru Çöz' }} />
        <Stack.Screen name="Stats" component={StatsScreen} options={{ title: 'İstatistikler' }} />
        <Stack.Screen name="Motivation" component={MotivationScreen} options={{ title: 'Motivasyon' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
