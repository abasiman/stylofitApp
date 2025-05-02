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
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { auth } from "../../firebase";         // adjust path if needed
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";

export default function SignupScreen({ navigation }) {
  const [username, setUsername]     = useState("");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [sentModal, setSentModal]   = useState(false);

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

    try {
      // 1) Create the user
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // 2) Save the chosen username
      await updateProfile(userCred.user, {
        displayName: username.trim(),
      });

      // 3) Send verification email
      await sendEmailVerification(userCred.user);

      // 4) Show confirmation modal
      setSentModal(true);
    } catch (err) {
      alert("Signup failed: " + err.message);
    }
  };

  return (
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

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={COLORS.inputText}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        placeholderTextColor={COLORS.inputText}
        secureTextEntry
        value={confirm}
        onChangeText={setConfirm}
      />

      <Pressable style={styles.signupButton} onPress={handleSignup}>
        <Text style={styles.signupButtonText}>Sign Up</Text>
      </Pressable>

      {/* Verification Sent Modal */}
      <Modal
        visible={sentModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setSentModal(false);
          navigation.navigate("Login");        // navigate immediately on modal close
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
                navigation.navigate("Login");    // immediately go to login
              }}
            >
              <Text style={modalStyles.buttonText}>Go to Login</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 200,
    height: 200,
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
