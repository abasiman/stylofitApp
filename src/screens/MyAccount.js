// src/screens/MyAccount.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from 'firebase/auth';

export default function MyAccount() {
  const navigation = useNavigation();
  const me = auth.currentUser;

  const [accountInfo, setAccountInfo] = useState({
    username: '',
    email:    '',
  });

  // Password‐change UI state
  const [showPwdForm, setShowPwdForm] = useState(false);
  const [currentPwd,  setCurrentPwd]  = useState('');
  const [newPwd,      setNewPwd]      = useState('');
  const [confirmPwd,  setConfirmPwd]  = useState('');
  const [loadingPwd,  setLoadingPwd]  = useState(false);

  // fetch user profile once
  useEffect(() => {
    if (!me) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', me.uid));
        if (snap.exists()) {
          const d = snap.data();
          setAccountInfo({
            username: d.displayName   || '',
            email:    me.email        || '',
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    })();
  }, [me]);

  // Logout
  const onLogout = async () => {
    try {
      await auth.signOut();
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (err) {
      Alert.alert('Logout failed', err.message);
    }
  };

  // Delete account
  const onDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'users', me.uid));
              await me.delete();
              navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
            } catch (err) {
              Alert.alert('Deletion failed', err.message);
            }
          }
        }
      ]
    );
  };

  // Submit password change
  const onSubmitPassword = async () => {
    if (!currentPwd || !newPwd || !confirmPwd) {
      return Alert.alert('Error', 'Please fill out all fields.');
    }
    if (newPwd !== confirmPwd) {
      return Alert.alert('Error', 'Passwords do not match.');
    }
    if (newPwd.length < 6) {
      return Alert.alert('Error', 'Password must be at least 6 characters.');
    }

    setLoadingPwd(true);
    try {
      const cred = EmailAuthProvider.credential(me.email, currentPwd);
      await reauthenticateWithCredential(me, cred);
      await updatePassword(me, newPwd);
      Alert.alert('Success', 'Password changed.');
      setShowPwdForm(false);
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoadingPwd(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>My Account</Text>

      {/* Account Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.infoBox}>
          <InfoRow label="Username"      value={accountInfo.username} />
          <InfoRow label="Email"         value={accountInfo.email} />
        </View>
      </View>

      {/* Change Password */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Change Password</Text>

        {showPwdForm ? (
          <View style={styles.pwdForm}>
            <TextInput
              style={styles.input}
              placeholder="Current Password"
              secureTextEntry
              value={currentPwd}
              onChangeText={setCurrentPwd}
            />
            <TextInput
              style={styles.input}
              placeholder="New Password"
              secureTextEntry
              value={newPwd}
              onChangeText={setNewPwd}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              secureTextEntry
              value={confirmPwd}
              onChangeText={setConfirmPwd}
            />
            <TouchableOpacity
              style={styles.submitButton}
              onPress={onSubmitPassword}
              disabled={loadingPwd}
            >
              {loadingPwd
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitText}>Submit</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowPwdForm(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowPwdForm(true)}  // <-- show inline form
          >
            <Text style={styles.actionText}>Change Password</Text>
            <Icon name="chevron-forward" size={20} color="#000" />
          </TouchableOpacity>
        )}
      </View>

      {/* Logout & Delete */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Actions</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={onDeleteAccount}>
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
      <Text style={styles.infoValue}>{value || '-'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#7F6952', padding: 20 },
  header:      { fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 20 },
  section:     { marginBottom: 30 },
  sectionTitle:{ color: '#fff', fontWeight: 'bold', marginBottom: 10 },
  infoBox:     { backgroundColor: '#A89582', borderRadius: 8, padding: 15 },
  infoRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  infoLabel:   { color: '#fff', fontWeight: '600' },
  infoValue:   { color: '#f0f0f0', fontSize: 14 },
  actionButton:{ backgroundColor: '#A89582', borderRadius: 8, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionText:  { fontWeight: 'bold', color: '#000' },
  pwdForm:     { backgroundColor: '#A89582', borderRadius: 8, padding: 15 },
  input:       { backgroundColor: '#fff', borderRadius: 5, paddingHorizontal: 10, marginBottom: 10, height: 40 },
  submitButton:{ backgroundColor: '#6B8A81', borderRadius: 5, padding: 12, alignItems: 'center', marginBottom: 10 },
  submitText:  { color: '#fff', fontWeight: '600' },
  cancelButton:{ alignItems: 'center' },
  cancelText:  { color: '#fff', textDecorationLine: 'underline' },
  logoutButton:{ backgroundColor: '#A89582', borderRadius: 8, padding: 15, marginTop: 10 },
  logoutText:  { color: 'red', fontWeight: 'bold', textAlign: 'center' },
  deleteButton:{ backgroundColor: '#FF4B4B', borderRadius: 8, padding: 15, marginTop: 10 },
  deleteText:  { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
});
