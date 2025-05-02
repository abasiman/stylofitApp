import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Modal,
  Alert
} from 'react-native';
import { MaterialIcons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '../../firebase'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import * as Location from 'expo-location';

import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

import { usePosts } from '../contexts/PostsContext';

import { storage, db } from '../../firebase';    
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const { width } = Dimensions.get('window');

export default function UploadScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [location, setLocation] = useState(null);

  const { addPost } = usePosts();
  const imageRef = useRef(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setCaption('');
    }
  };

  // replace fetch() with XHR so Android can load file:// URIs
  const uploadImageAsync = async (uri) => {
    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => resolve(xhr.response);
      xhr.onerror = () => reject(new TypeError('Network request failed'));
      xhr.responseType = 'blob';
      xhr.open('GET', uri, true);
      xhr.send(null);
    });

    const filename = `images/${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const ref = storageRef(storage, filename);
    const task = uploadBytesResumable(ref, blob);

    return new Promise((resolve, reject) => {
      task.on(
        'state_changed',
        null,
        (error) => reject(error),
        () => {
          getDownloadURL(task.snapshot.ref)
            .then(resolve)
            .catch(reject);
        }
      );
    });
  };

  const handleUpload = async () => {
    if (!image || uploading) return;
    setUploading(true);
  
    try {
      // 1) upload image & get its URL
      const downloadURL = await uploadImageAsync(image);
  
      // 2) prepare the post payload
      const postData = {
        userId:    auth.currentUser.uid,
        imageUrl:  downloadURL,
        caption,
      location: location ? {
         name:      location.name,
        latitude:  location.latitude,
       longitude: location.longitude
       } : null,
        tags:     [],
        likes:    0,
        createdAt: serverTimestamp(),
      };

  
      // 3) persist to Firestore
      const docRef = await addDoc(collection(db, 'outfits'), postData);
  
      // 4) update your local context (if you still want immediate UI feedback)
      await addPost({ id: docRef.id, ...postData });
  
      // 5) feedback & reset
      Alert.alert('Success', 'Your outfit has been uploaded!', [
        { text: 'OK', onPress: () => navigation.navigate('Home') }
      ]);
      setImage(null);
      setCaption('');
    } catch (error) {
      Alert.alert('Upload Error', error.message);
    } finally {
      setUploading(false);
    }
  };
  // Ask for location permission once when component mounts
useEffect(() => {
  (async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need location permission to offer "Use my location".');
    }
  })();
}, []);

  const placesRef = useRef(null);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>New Outfit</Text>
      </View>

      <View style={styles.imageContainer}>
        {image ? (
          <Image
            ref={imageRef}
            source={{ uri: image }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <TouchableOpacity style={styles.imagePlaceholder} onPress={pickImage}>
            <MaterialIcons name="add-photo-alternate" size={50} color="#83715D" />
            <Text style={styles.placeholderText}>Add Photo</Text>
          </TouchableOpacity>
        )}
      </View>
      {image && (
  <View style={styles.locationContainer}>
    <Text style={styles.sectionTitle}>Location (optional)</Text>
    <GooglePlacesAutocomplete
      ref={placesRef}
      placeholder="Search for store or address"
      fetchDetails
      onPress={(data, details = null) => {
        console.log('picked place:', data.description, details.geometry.location);
        setLocation({
          name:      data.description,
          latitude:  details.geometry.location.lat,
          longitude: details.geometry.location.lng,
        });
        placesRef.current?.setAddressText(data.description);
      }}
      query={{
        key:      'AIzaSyDr58Oav5MSVkFRLOJLbHIUb9M4m0NKVhc',   // ← your real key here
        language: 'en',
        types:    'establishment',         // or 'address'
      }}
      nearbyPlacesAPI="GooglePlacesSearch"   // use Google’s Nearby Search
      debounce={400}                         // reduce API calls
      enablePoweredByContainer={false}       // hide badge
      currentLocation={true}                 // show “Use my location”
      currentLocationLabel="📍 Use my location"
      GooglePlacesSearchQuery={{
        rankby: 'distance',
        type:   'establishment',
      }}
      styles={{
        textInputContainer: { padding: 0 },
        textInput:          styles.captionInput,
        listView: {
          position:   'absolute',
          top:        50,
          width:      '100%',
          backgroundColor: '#fff',
          elevation:  3,
          shadowColor:'#000',
          shadowOpacity: 0.1,
          shadowRadius:  3,
          zIndex:       1000,
        },
      }}
      listViewProps={{
        nestedScrollEnabled:       true,
        keyboardShouldPersistTaps: 'handled',
      }}
    />
  </View>
)}


      {image && (
        <View style={styles.captionContainer}>
          <Text style={styles.sectionTitle}>Caption</Text>
          <TextInput
            style={styles.captionInput}
            placeholder="Write a caption for your outfit..."
            value={caption}
            onChangeText={setCaption}
            multiline
          />
        </View>
      )}

      {image && (
        <TouchableOpacity
          style={[styles.uploadButton, uploading && styles.disabledButton]}
          onPress={handleUpload}
          disabled={uploading}
        >
          <Text style={styles.uploadButtonText}>
            {uploading ? 'Uploading...' : 'Upload Outfit'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Color constants
const COLORS = {
  primary: '#83715D',
  light: '#EAEAE9',
  white: '#FFFFFF',
  textDark: '#333333',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
  },
  imageContainer: {
    padding: 20,
    alignItems: 'center',
  },
  image: {
    width: width - 40,
    height: (width - 40) * 1.2,
    borderRadius: 15,
  },
  imagePlaceholder: {
    width: width - 40,
    height: (width - 40) * 1.2,
    borderRadius: 15,
    backgroundColor: COLORS.light,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  placeholderText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '500',
  },

   // ▶️ Added for the location picker so its dropdown floats above the caption
  locationContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
    zIndex: 1000,    // allow autocomplete list to overlay siblings
    elevation: 10,   // Android stacking
  },
  captionContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: COLORS.textDark,
  },
  captionInput: {
    borderWidth: 1,
    borderColor: COLORS.light,
    borderRadius: 10,
    padding: 12,
    height: 100,
    backgroundColor: COLORS.white,
    textAlignVertical: 'top',
  },
  uploadButton: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 40,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  uploadButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
