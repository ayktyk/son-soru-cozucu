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
import LearnScreen from './src/screens/LearnScreen';
import { colors } from './src/theme/colors';

const Stack = createStackNavigator();

export default function App() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    document.documentElement.style.height = '100%';
    document.body.style.height = '100%';
    document.body.style.overflow = 'auto';
    document.body.style.webkitOverflowScrolling = 'touch';
    document.body.style.touchAction = 'auto';

    const root = document.getElementById('root');
    if (root) {
      root.style.height = '100%';
      root.style.minHeight = '100dvh';
      root.style.display = 'flex';
      root.style.flex = '1';
      root.style.overflow = 'auto';
    }
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.backgroundAlt,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          },
          headerTintColor: colors.primary,
          headerTitleStyle: { fontWeight: '800', fontSize: 18, letterSpacing: 0.3 },
          cardStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Question" component={QuestionScreen} options={{ title: 'Soru Çöz' }} />
        <Stack.Screen name="Stats" component={StatsScreen} options={{ title: 'İstatistikler' }} />
        <Stack.Screen name="Motivation" component={MotivationScreen} options={{ title: 'Motivasyon' }} />
        <Stack.Screen name="Learn" component={LearnScreen} options={{ title: 'Konu Öğren' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
