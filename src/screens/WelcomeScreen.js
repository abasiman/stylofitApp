// src/screens/WelcomeScreen.js
import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Image
        source={require('./welcomepagelogo.png')}
        style={styles.logoImage}
      />
      <Pressable
        style={[styles.button, styles.solidButton]}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.solidText}>Login</Text>
      </Pressable>
      <Pressable
        style={[styles.button, styles.outlineButton]}
        onPress={() => navigation.navigate('Signup')}
      >
        <Text style={styles.outlineText}>Sign Up</Text>
      </Pressable>
    </View>
  );
}

const COLORS = {
  primary: '#83715D',
  accent: '#6B8A81',
  light: '#EAEAE9',
  white: '#FFFFFF',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'flex-start',  
    paddingTop: 100,                 
    padding: 20,
  },
  logoImage: {
    width: 300,        
    height: 300,      
    marginBottom: 100,  
    resizeMode: 'contain',
  },
  button: {
    width: '80%',
    paddingVertical: 14,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center',
  },
  solidButton: {
    backgroundColor: COLORS.white,
  },
  solidText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  outlineButton: {
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  outlineText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
});
