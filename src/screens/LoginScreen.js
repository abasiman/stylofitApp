// src/screens/LoginScreen.js

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { auth } from '../../firebase';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';

export default function LoginScreen({ navigation }) {
  const [email, setEmail]   = useState('');
  const [password, setPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCancelable, setLoadingCancelable] = useState(false);
  const [loginAbortController, setLoginAbortController] = useState(null);

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert('Error', 'Email and password are required.');
    }
    setLoading(true);
    setLoadingCancelable(true);
    const abortController = { canceled: false };
    setLoginAbortController(abortController);

    // Add artificial delay to always show loading modal for at least 1s
    const minLoadingTime = new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Simulate cancelable login (firebase does not support abort, so we check flag after await)
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      await minLoadingTime;
      if (abortController.canceled) return; // If canceled, do nothing

      if (!userCred.user.emailVerified) {
        setLoading(false);
        return Alert.alert(
          'Email not verified',
          'Please verify your email before logging in.'
        );
      }

      setLoading(false);
      navigation.replace('HomePage'); 
    } catch (err) {
      await minLoadingTime;
      setLoading(false);
      if (!abortController.canceled) {
        Alert.alert('Login failed', err.message);
      }
    }
  };

  const handleCancelLoading = () => {
    setLoading(false);
    setLoadingCancelable(false);
    if (loginAbortController) {
      loginAbortController.canceled = true;
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <Image source={require('./stylologo.png')} style={styles.logoImage} />

          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>Glad to see you!</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={COLORS.primary}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor={COLORS.primary}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPass}
            />
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <FontAwesome5 
                name={showPassword ? "eye" : "eye-slash"} 
                size={18} 
                color={COLORS.primary}
              />
            </TouchableOpacity>
          </View>

          <Pressable style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </Pressable>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>No account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.switchLink}>Create an Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Loading Modal */}
      <Modal
        visible={loading}
        transparent
        animationType="fade"
        onRequestClose={handleCancelLoading}
      >
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={{ marginTop: 16, color: COLORS.primary }}>Logging in...</Text>
            {loadingCancelable && (
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancelLoading}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const COLORS = {
  primary:  '#83715D',
  accent:   '#6B8A81',
  light:    '#EAEAE9',
  white:    '#FFFFFF',
  grey:     '#F5F5F5',
  textDark: '#333333',
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100%",
  },
  logoImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
    resizeMode: "contain",
  },
  title: {
    fontSize: 32,
    color: COLORS.white,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.light,
    marginBottom: 24,
  },
  input: {
    backgroundColor: COLORS.light,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 16,
    color: COLORS.primary,
    width: '100%',
  },
  button: {
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  passwordContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light,
    borderRadius: 6,
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.primary,
  },
  eyeButton: {
    padding: 10,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  switchText: {
    color: COLORS.light,
  },
  switchLink: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBox: {
    backgroundColor: COLORS.white,
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 200,
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 8,
    paddingHorizontal: 24,
    backgroundColor: COLORS.accent,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
