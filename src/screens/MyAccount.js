import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

export default function MyAccount() {
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.container}>

      <Text style={styles.header}>My Account</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.infoBox}>
          <InfoRow label="Phone Number" value="+1****002" />
          <InfoRow label="Email" value="g*****@yahoo.com" />
          <InfoRow label="Date of Birth" value="June 16, 1999" />
          <InfoRow label="Account Region" value="United States" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Change Password</Text>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>Change Password</Text>
          <Icon name="chevron-forward" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton}>
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#7F6952',
    flex: 1,
    padding: 20,
  },
  backButton: {
    marginBottom: 10,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoBox: {
    backgroundColor: '#A89582',
    borderRadius: 8,
    padding: 15,
  },
  infoRow: {
    marginBottom: 10,
  },
  infoLabel: {
    color: '#fff',
    fontWeight: '600',
  },
  infoValue: {
    color: '#f0f0f0',
    fontSize: 12,
  },
  actionButton: {
    backgroundColor: '#A89582',
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionText: {
    fontWeight: 'bold',
    color: '#000',
  },
  logoutButton: {
    backgroundColor: '#A89582',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
  },
  logoutText: {
    color: 'red',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#FF4B4B',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
  },
  deleteText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
