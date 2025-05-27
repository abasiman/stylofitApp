import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  PermissionsAndroid,
  Linking
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { updateProfile } from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';
import { auth, db, storage } from '../../firebase';

const { width } = Dimensions.get('window');

export default function EditProfile() {
  const navigation = useNavigation();
  const user = auth.currentUser;

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [photo, setPhoto] = useState(user?.photoURL || null);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [localPhotoUri, setLocalPhotoUri] = useState(null);

  // Load existing profile on mount
  useEffect(() => {
    if (!user) return;
    setUsername(user.displayName || '');

    const loadProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setBio(data.bio || '');
          setPhoto(data.photoURL || null);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    loadProfile();
  }, [user]);

  const uploadPhoto = async (uri) => {
    try {
      setUploadingPhoto(true);

      // 1. Convert URI to Blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // 2. Generate unique filename
      const filename = `profile_${user.uid}_${Date.now()}.jpg`;
      const storageRef = ref(storage, `profile_photos/${filename}`);

      // 3. Upload to Firebase Storage
      await uploadBytes(storageRef, blob);

      // 4. Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (error) {
      console.error('Photo upload error:', error);
      throw error;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        ];
        
        if (Platform.Version >= 33) {
          permissions.push(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
        }

        const granted = await PermissionsAndroid.requestMultiple(permissions);
        
        return Object.values(granted).every(
          permission => permission === PermissionsAndroid.RESULTS.GRANTED
        );
      } catch (err) {
        console.error('Permission request error:', err);
        return false;
      }
    }
    return true;
  };

  const handleChangePhoto = async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) {
      Alert.alert(
        'Permission Required',
        'Please grant storage permissions to change your profile photo.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Settings', 
            onPress: () => {
              if (Platform.OS === 'android') {
                Linking.openSettings();
              }
            }
          }
        ]
      );
      return;
    }

    const options = {
      mediaType: 'photo',
      quality: 0.7,
      maxWidth: 800,
      maxHeight: 800,
      includeBase64: false,
      selectionLimit: 1,
      saveToPhotos: false,
    };

    try {
      const response = await launchImageLibrary(options);
      console.log('Image picker response:', response);
      
      if (response.didCancel) {
        console.log('User cancelled image picker');
        return;
      }
      
      if (response.errorCode) {
        console.error('ImagePicker Error:', response.errorMessage);
        Alert.alert('Error', response.errorMessage || 'Failed to select image');
        return;
      }

      if (response.assets?.[0]?.uri) {
        console.log('Selected image URI:', response.assets[0].uri);
        setLocalPhotoUri(response.assets[0].uri);
        try {
          const downloadURL = await uploadPhoto(response.assets[0].uri);
          setPhoto(downloadURL);
        } catch (error) {
          console.error('Upload error:', error);
          Alert.alert('Error', 'Failed to upload photo. Please try again.');
          setLocalPhotoUri(null);
        }
      } else {
        console.error('No image URI in response');
        Alert.alert('Error', 'Failed to get image. Please try again.');
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to open image picker. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!username.trim()) {
      return Alert.alert('Error', 'Username cannot be empty');
    }

    setLoading(true);
    try {
      // 1) Update Auth profile
      await updateProfile(user, {
        displayName: username.trim(),
        photoURL: photo,
      });

      // 2) Update Firestore document
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        displayName: username.trim(),
        bio: bio.trim(),
        photoURL: photo,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // 3) Update all user's posts with new profile info
      const outfitsRef = collection(db, 'outfits');
      const userPostsQuery = query(outfitsRef, where('userId', '==', user.uid));
      const userPosts = await getDocs(userPostsQuery);

      if (!userPosts.empty) {
        const batch = writeBatch(db);
        userPosts.forEach((postDoc) => {
          batch.update(postDoc.ref, {
            userName: username.trim(),
            userPhoto: photo
          });
        });
        await batch.commit();
      }

      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (err) {
      console.error('Save error:', err);
      Alert.alert('Error', err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
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
          <View style={styles.topCurve} />

          <Text style={styles.title}>EDIT PROFILE</Text>

          <TouchableOpacity 
            onPress={handleChangePhoto}
            disabled={uploadingPhoto}
            style={styles.photoContainer}
          >
            {uploadingPhoto ? (
              <View style={[styles.avatar, styles.uploadingContainer]}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            ) : (
              <>
                {localPhotoUri || photo ? (
                  <Image 
                    source={{ uri: localPhotoUri || photo }} 
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatar}>
                    <Icon name="person-outline" size={40} color="#fff" />
                  </View>
                )}
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.changePhoto} onPress={handleChangePhoto}>
            {uploadingPhoto ? 'Uploading...' : 'change photo'}
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
              numberOfLines={4}
              textAlignVertical="top"
              onChangeText={setBio}
              placeholder="Write something about you"
              maxLength={500}
            />
            <Icon name="create-outline" size={18} color="#555" style={styles.icon} />
          </View>

          <Text style={styles.charCount}>{bio.length}/500</Text>

          <TouchableOpacity 
            style={[
              styles.saveButton,
              (loading || uploadingPhoto) && styles.saveButtonDisabled
            ]} 
            onPress={handleSave}
            disabled={loading || uploadingPhoto}
          >
            <Text style={styles.saveText}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: { 
    flex: 1, 
    backgroundColor: '#fff', 
    alignItems: 'center',
    paddingBottom: 40,
  },
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
  photoContainer: {
    marginTop: 20,
  },
  uploadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(181, 169, 157, 0.8)',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#b5a99d',
    justifyContent: 'center',
    alignItems: 'center',
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
    minHeight: 100,
  },
  bioInput: {
    flex: 1,
    fontSize: 14,
    height: 80,
    textAlignVertical: 'top',
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
  saveButtonDisabled: {
    opacity: 0.7,
  },
});
