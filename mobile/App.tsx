import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider } from './src/contexts/AuthContext';
import { EncryptionProvider } from './src/contexts/EncryptionContext';
import WelcomeScreen from './src/screens/WelcomeScreen';
import AuthScreen from './src/screens/AuthScreen';
import SearchScreen from './src/screens/SearchScreen';
import RoomScreen from './src/screens/RoomScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <EncryptionProvider>
        <NavigationContainer>
          <Stack.Navigator 
            initialRouteName="Welcome"
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#0f172a' }
            }}
          >
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Auth" component={AuthScreen} />
            <Stack.Screen name="Search" component={SearchScreen} />
            <Stack.Screen name="Room" component={RoomScreen} />
          </Stack.Navigator>
          <StatusBar style="light" />
        </NavigationContainer>
      </EncryptionProvider>
    </AuthProvider>
  );
}
