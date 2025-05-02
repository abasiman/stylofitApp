
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';

import { updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth,db } from '../../firebase';

const { width } = Dimensions.get('window');

export default function EditProfile() {
  const navigation = useNavigation();
  const user = auth.currentUser;

  const [username, setUsername] = useState('');
  const [bio, setBio]           = useState('');
  const [photo, setPhoto]       = useState(user?.photoURL || null);

  // Load existing profile on mount
  useEffect(() => {
    if (!user) return;
    setUsername(user.displayName || '');

    const udoc = doc(db, 'users', user.uid);
    getDoc(udoc).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.bio) setBio(data.bio);
        if (data.photoURL) setPhoto(data.photoURL);
      }
    });
  }, []);

  const handleChangePhoto = () => {
    launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (response.assets?.length) {
        setPhoto(response.assets[0].uri);
      }
    });
  };

  const handleSave = async () => {
    if (!username.trim()) {
      return Alert.alert('Error', 'Username cannot be empty');
    }
    try {
      // 1) Update Auth profile
      await updateProfile(user, {
        displayName: username.trim(),
        photoURL:     photo,
      });

      // 2) Upsert Firestore document
      const udoc = doc(db, 'users', user.uid);
      await setDoc(
        udoc,
        {
          displayName: username.trim(),
          bio,
          photoURL: photo,
        },
        { merge: true }
      );

      Alert.alert('Saved', 'Your profile was updated.');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Save failed', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topCurve} />

      <Text style={styles.title}>EDIT PROFILE</Text>

      <TouchableOpacity onPress={handleChangePhoto}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar} />
        )}
      </TouchableOpacity>

      <Text style={styles.changePhoto} onPress={handleChangePhoto}>
        change photo
      </Text>

      <Text style={styles.label}>Username</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={username}
          onChangeText={setUsername}
          placeholder="Enter username"
        />
        <Icon name="create-outline" size={18} color="#555" style={styles.icon} />
      </View>

      <Text style={styles.label}>Bio</Text>
      <View style={styles.bioContainer}>
        <TextInput
          style={styles.bioInput}
          value={bio}
          multiline
          onChangeText={setBio}
          placeholder="Write something about you"
        />
        <Icon name="create-outline" size={18} color="#555" style={styles.icon} />
      </View>

      <Text style={styles.charCount}>{bio.length}/500</Text>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center' },
  topCurve: {
    position: 'absolute',
    top: 0,
    width: width,
    height: 200,
    backgroundColor: '#8C7661',
    zIndex: -1,
  },
  title: {
    marginTop: 60,
    fontWeight: 'bold',
    fontSize: 16,
    color: '#fff',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#b5a99d',
    marginTop: 20,
  },
  changePhoto: {
    color: '#8C9C8C',
    fontSize: 12,
    marginTop: 8,
    textDecorationLine: 'underline',
  },
  label: {
    alignSelf: 'flex-start',
    marginLeft: 40,
    marginTop: 25,
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    marginHorizontal: 30,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 5,
    width: width - 60,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
  },
  bioContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    marginHorizontal: 30,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 5,
    width: width - 60,
  },
  bioInput: {
    flex: 1,
    fontSize: 14,
    minHeight: 60,
  },
  icon: {
    marginLeft: 6,
    marginTop: 4,
  },
  charCount: {
    alignSelf: 'flex-end',
    marginRight: 40,
    marginTop: 5,
    fontSize: 12,
    color: '#888',
  },
  saveButton: {
    backgroundColor: '#8C9C8C',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 50,
    marginTop: 30,
  },
  saveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
    textTransform: 'lowercase',
  },
});
