// src/screens/SignupScreen.js

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  TouchableOpacity,
  Image,
  Modal,
  Linking,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { auth, db } from "../../firebase";         // add db import
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from 'firebase/firestore';  // add setDoc import

export default function SignupScreen({ navigation }) {
  const [username, setUsername]     = useState("");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [sentModal, setSentModal]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCancelable, setLoadingCancelable] = useState(false);
  const [signupAbortController, setSignupAbortController] = useState(null);

  const handleSignup = async () => {
    if (!username.trim()) {
      return alert("Username is required.");
    }
    if (!email || !password) {
      return alert("Email and password are required.");
    }
    if (password !== confirm) {
      return alert("Passwords do not match.");
    }

    setLoading(true);
    setLoadingCancelable(true);
    const abortController = { canceled: false };
    setSignupAbortController(abortController);

    // Ensure loading modal is visible for at least 1s
    const minLoadingTime = new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // 1) Create the user
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      
      const user = userCred.user;
      const trimmedUsername = username.trim();

      // 2) Save the chosen username to Auth profile
      await updateProfile(user, {
        displayName: trimmedUsername,
      });

      // 3) Create Firestore user document with all searchable fields
      await setDoc(doc(db, 'users', user.uid), {
        userId: user.uid,
        displayName: trimmedUsername,
        username: trimmedUsername.toLowerCase(), // Store lowercase for easier searching
        email: email.toLowerCase(),
        bio: '',
        photoURL: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      await minLoadingTime;
      if (abortController.canceled) return;

      // 4) Send verification email
      await sendEmailVerification(user);

      // 5) Show confirmation modal
      setLoading(false);
      setSentModal(true);
    } catch (err) {
      await minLoadingTime;
      setLoading(false);
      if (!abortController.canceled) {
        alert("Signup failed: " + err.message);
      }
    }
  };

  const handleCancelLoading = () => {
    setLoading(false);
    setLoadingCancelable(false);
    if (signupAbortController) {
      signupAbortController.canceled = true;
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
          <Image source={require("./stylologo.png")} style={styles.logo} />

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>To get started now!</Text>

          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor={COLORS.inputText}
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={COLORS.inputText}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor={COLORS.inputText}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <FontAwesome5 
                name={showPassword ? "eye" : "eye-slash"} 
                size={18} 
                color={COLORS.inputText}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm Password"
              placeholderTextColor={COLORS.inputText}
              secureTextEntry={!showConfirmPassword}
              value={confirm}
              onChangeText={setConfirm}
            />
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <FontAwesome5 
                name={showConfirmPassword ? "eye" : "eye-slash"} 
                size={18} 
                color={COLORS.inputText}
              />
            </TouchableOpacity>
          </View>

          <Pressable style={styles.signupButton} onPress={handleSignup}>
            <Text style={styles.signupButtonText}>Sign Up</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Verification Sent Modal */}
      <Modal
        visible={sentModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setSentModal(false);
          navigation.navigate("Login");
        }}
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.box}>
            <Text style={modalStyles.title}>Check Your Inbox!</Text>
            <Text style={modalStyles.body}>
              A verification email was sent to{"\n"}
              <Text style={{ fontWeight: "600" }}>{email}</Text>
            </Text>

            <Pressable
              style={modalStyles.button}
              onPress={() => Linking.openURL("mailto:")}
            >
              <Text style={modalStyles.buttonText}>Open Mail App</Text>
            </Pressable>

            <Pressable
              style={[modalStyles.button, modalStyles.closeButton]}
              onPress={() => {
                setSentModal(false);
                navigation.navigate("Login");
              }}
            >
              <Text style={modalStyles.buttonText}>Go to Login</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Loading Modal */}
      <Modal
        visible={loading}
        transparent
        animationType="fade"
        onRequestClose={handleCancelLoading}
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.box}>
            <Text style={{ color: COLORS.inputText, marginBottom: 16 }}>Signing up...</Text>
            <FontAwesome5 name="spinner" size={32} color={COLORS.accent} style={{ marginBottom: 16 }} solid />
            {loadingCancelable && (
              <Pressable style={modalStyles.button} onPress={handleCancelLoading}>
                <Text style={modalStyles.buttonText}>Cancel</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const COLORS = {
  background: "#83715D",
  inputBg:    "#EAEAE9",
  inputText:  "#83715D",
  white:      "#FFFFFF",
  accent:     "#6B8A81",
  grey:       "#F5F5F5",
  light:      "#EAEAE9",
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100%",
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 16,
    resizeMode: "contain",
  },
  title: {
    fontSize: 26,
    color: COLORS.white,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.light,
    marginBottom: 24,
  },
  input: {
    width: "100%",
    backgroundColor: COLORS.inputBg,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    color: COLORS.inputText,
  },
  signupButton: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.white,
    alignItems: "center",
    marginTop: 8,
  },
  signupButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "500",
  },
  passwordContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBg,
    borderRadius: 6,
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.inputText,
  },
  eyeButton: {
    padding: 10,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    width: "80%",
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: COLORS.inputText,
  },
  button: {
    width: "100%",
    padding: 12,
    backgroundColor: COLORS.accent,
    borderRadius: 6,
    marginTop: 8,
  },
  closeButton: {
    backgroundColor: COLORS.grey,
  },
  buttonText: {
    color: COLORS.white,
    textAlign: "center",
    fontWeight: "600",
  },
});
