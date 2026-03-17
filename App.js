import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen from './src/screens/HomeScreen';
import QuestionScreen from './src/screens/QuestionScreen';
import StatsScreen from './src/screens/StatsScreen';
import MotivationScreen from './src/screens/MotivationScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#0D0D0D', elevation: 0, shadowOpacity: 0 },
          headerTintColor: '#00D4FF',
          headerTitleStyle: { fontWeight: 'bold' },
          cardStyle: { backgroundColor: '#0D0D0D' },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Question" component={QuestionScreen} options={{ title: 'Soru Coz' }} />
        <Stack.Screen name="Stats" component={StatsScreen} options={{ title: 'Istatistikler' }} />
        <Stack.Screen name="Motivation" component={MotivationScreen} options={{ title: 'Motivasyon' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
