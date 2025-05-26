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

  const handleReset = async () => {
    if (!email) {
      return Alert.alert('Error', 'Please enter your email first.');
    }
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        'Reset email sent',
        'Check your inbox for password reset instructions.'
      );
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  return (
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
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={COLORS.primary}
        secureTextEntry
        value={password}
        onChangeText={setPass}
      />

      <TouchableOpacity onPress={handleReset}>
        <Text style={styles.link}>Forgot Password?</Text>
      </TouchableOpacity>

      <Pressable style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </Pressable>

      <View style={styles.orRow}>
        <View style={styles.line} />
        <Text style={styles.orText}>Or login with</Text>
        <View style={styles.line} />
      </View>

      <Pressable
        style={styles.socialButton}
        onPress={() => Alert.alert('Google login', 'Coming soon')}
      >
        <FontAwesome5 name="google" size={20} style={styles.socialIcon} />
        <Text style={styles.socialText}>Login with Google</Text>
      </Pressable>

      <View style={styles.switchRow}>
        <Text style={styles.switchText}>No account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.switchLink}>Create an Account</Text>
        </TouchableOpacity>
      </View>

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
    </View>
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
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 170,
    height: 170,
    marginBottom: 20,
    resizeMode: 'contain',
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
  link: {
    alignSelf: 'flex-end',
    color: COLORS.accent,
    marginBottom: 20,
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
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.light,
  },
  orText: {
    marginHorizontal: 8,
    color: COLORS.light,
    fontSize: 14,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.grey,
    paddingVertical: 12,
    borderRadius: 6,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 24,
  },
  socialIcon: {
    marginRight: 8,
    color: COLORS.textDark,
  },
  socialText: {
    fontSize: 16,
    color: COLORS.textDark,
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
