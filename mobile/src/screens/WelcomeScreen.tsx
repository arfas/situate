import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Welcome: undefined;
  Auth: { mode: 'signin' | 'signup' };
  Search: undefined;
  Room: { room: any };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function WelcomeScreen() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <ScrollView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            SupportCircle
          </Text>
          <Text style={styles.subtitle}>
            Anonymous peer support communities
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Auth', { mode: 'signup' })}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              Create Account
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Auth', { mode: 'signin' })}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              Sign In
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Join anonymous support rooms for mental health, addiction recovery, and more
          </Text>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#9ca3af',
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  footer: {
    marginTop: 32,
  },
  footerText: {
    color: '#6b7280',
    textAlign: 'center',
    fontSize: 14,
  },
});
