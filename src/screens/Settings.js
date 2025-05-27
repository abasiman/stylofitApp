import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

export default function Settings() {
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>SETTINGS</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('MyAccount')}>
          <View>
            <Text style={styles.buttonTitle}>My Account</Text>
            <Text style={styles.buttonSubtitle}>
              Account Information, Password, Logout, Delete Account
            </Text>
          </View>
          <Icon name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('NotifSettings')}>
          <Text style={styles.buttonTitle}>Notifications</Text>
          <Icon name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#7F6952',
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  backIcon: {
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    gap: 15,
  },
  button: {
    backgroundColor: '#A89582',
    padding: 15,
    borderRadius: 10,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonTitle: {
    fontWeight: 'bold',
    color: '#fff',
  },
  buttonSubtitle: {
    color: '#f0f0f0',
    fontSize: 12,
    marginTop: 2,
  },
});
