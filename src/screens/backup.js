// src/screens/UploadScreen.js
import React, { useState, useRef, useEffect } from 'react';
import { MaterialIcons }      from '@expo/vector-icons';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  FlatList,
  Platform,
} from 'react-native';
import * as ImagePicker       from 'expo-image-picker';
import * as Location          from 'expo-location';
import { auth, db, storage }  from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL
} from 'firebase/storage';
import { usePosts }           from '../contexts/PostsContext';

const { width } = Dimensions.get('window');
const PLACES_AUTOCOMPLETE_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
const PLACES_DETAILS_URL      = 'https://maps.googleapis.com/maps/api/place/details/json';
const GOOGLE_API_KEY          = 'AIzaSyDr58Oav5MSVkFRLOJLbHIUb9M4m0NKVhc';  // ← your key

const COLORS = {
  primary:  '#83715D',
  light:    '#EAEAE9',
  white:    '#FFFFFF',
  textDark: '#333333',
};

export default function UploadScreen({ navigation }) {
  const [image, setImage]         = useState(null);
  const [caption, setCaption]     = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState(0);

  const [locInput, setLocInput]       = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [location, setLocation]       = useState(null);

  const currentCoordsRef = useRef(null);
  const fetchTimeout     = useRef(null);
  const { addPost }      = usePosts();

  // 1️⃣ get GPS
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const { coords } = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });
        currentCoordsRef.current = coords;
      }
    })();
  }, []);

  // 2️⃣ pick image
  const pickImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      if (!res.canceled && res.assets[0]?.uri) {
        setImage(res.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Error', 'Image pick failed: ' + e.message);
    }
  };

  // 3️⃣ uploadImageAsync using fetch→blob
  const uploadImageAsync = async (uri) => {
    console.log('🔄 Fetching URI as blob via fetch()…');
    const response = await fetch(uri);
    const blob = await response.blob();              // ← simpler and works on file://
    const filename = `images/${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const ref = storageRef(storage, filename);
    const task = uploadBytesResumable(ref, blob);

    return new Promise((res, rej) => {
      task.on(
        'state_changed',
        snap => {
          const pct = (snap.bytesTransferred / snap.totalBytes) * 100;
          console.log(`🚀 Upload ${pct.toFixed(0)}%`);
          setProgress(pct);
        },
        err => {
          console.error('❌ Storage upload error:', err);
          rej(err);
        },
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          console.log('✅ Got download URL:', url);
          res(url);
        }
      );
    });
  };

  // 4️⃣ Places autocomplete (debounced)
  useEffect(() => {
    clearTimeout(fetchTimeout.current);
    if (locInput.length < 2) {
      setSuggestions([]);
      return;
    }
    fetchTimeout.current = setTimeout(async () => {
      const { latitude, longitude } = currentCoordsRef.current || {};
      const params = [
        `input=${encodeURIComponent(locInput)}`,
        `key=${GOOGLE_API_KEY}`,
        latitude && longitude ? `location=${latitude},${longitude}` : '',
        'radius=50000',
        'types=establishment',
      ].filter(Boolean).join('&');
      try {
        const r = await fetch(`${PLACES_AUTOCOMPLETE_URL}?${params}`);
        const j = await r.json();
        setSuggestions(j.status === 'OK' ? j.predictions : []);
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(fetchTimeout.current);
  }, [locInput]);

  // 5️⃣ Fetch Place Details on tap
  const handleSelectSuggestion = async (placeId, description) => {
    try {
      const r = await fetch(
        `${PLACES_DETAILS_URL}?place_id=${placeId}&key=${GOOGLE_API_KEY}`
      );
      const j = await r.json();
      if (j.status === 'OK') {
        const loc = j.result.geometry.location;
        setLocation({
          name:      description,
          latitude:  loc.lat,
          longitude: loc.lng,
        });
        setLocInput(description);
        setSuggestions([]);
      } else {
        Alert.alert('Place lookup failed');
      }
    } catch (e) {
      Alert.alert('Network error', e.message);
    }
  };

  // 6️⃣ Final upload: Storage → Firestore
  const handleUpload = async () => {
    if (!image || uploading) return;
    if (!location) {
      return Alert.alert('Select a location first');
    }

    setUploading(true);
    setProgress(0);
    console.log('▶️ Starting upload…');

    try {
      const downloadURL = await uploadImageAsync(image);

      console.log('📄 Writing Firestore doc…');
      const postData = {
        userId:     auth.currentUser?.uid,
        imageUrl:   downloadURL,
        caption,
        location,
        likes:      0,
        comments:   [],
        createdAt:  serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'outfits'), postData);
      console.log('✅ Firestore ID:', docRef.id);
      addPost?.({ id: docRef.id, ...postData });

      Alert.alert('Success', 'Outfit uploaded!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
      setImage(null);
      setCaption('');
      setLocInput('');
      setLocation(null);
    } catch (e) {
      console.error('❗️ Upload failed:', e);
      Alert.alert('Upload Error', e.message);
    } finally {
      setUploading(false);
    }
  };

  // 7️⃣ render form
  const renderForm = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>New Outfit</Text>
      </View>

      <View style={styles.imageContainer}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <TouchableOpacity style={styles.imagePlaceholder} onPress={pickImage}>
            <MaterialIcons name="add-photo-alternate" size={50} color={COLORS.primary} />
            <Text>Add Photo</Text>
          </TouchableOpacity>
        )}
      </View>

      {image && (
        <>
          <View style={styles.locationContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type a store…"
              value={locInput}
              onChangeText={setLocInput}
            />
            {suggestions.length > 0 && (
              <FlatList
                data={suggestions}
                keyExtractor={i => i.place_id}
                style={styles.suggestionsBox}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.suggestionItem}
                    onPress={() =>
                      handleSelectSuggestion(item.place_id, item.description)
                    }
                  >
                    <Text>{item.description}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>

          <View style={styles.captionContainer}>
            <TextInput
              style={styles.input}
              placeholder="Caption…"
              value={caption}
              onChangeText={setCaption}
            />
          </View>

          <View style={styles.uploadSection}>
            <TouchableOpacity
              style={[styles.uploadBtn, uploading && styles.disabledBtn]}
              onPress={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.uploadText}>Upload Outfit</Text>
              )}
            </TouchableOpacity>
            {uploading && (
              <Text style={styles.progressText}>{progress.toFixed(0)}% uploaded</Text>
            )}
          </View>
        </>
      )}
    </>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <FlatList
        data={[]}
        ListHeaderComponent={renderForm()}
        keyExtractor={() => 'form'}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: COLORS.white },
  header:           { padding: 20, backgroundColor: COLORS.primary },
  headerTitle:      { color: COLORS.white, fontSize: 20, textAlign: 'center' },
  imageContainer:   { alignItems: 'center', margin: 20 },
  image:            { width: width - 40, height: (width - 40) * 1.2, borderRadius: 15 },
  imagePlaceholder: {
    width: width - 40,
    height: (width - 40) * 1.2,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationContainer: { marginHorizontal: 20, zIndex: 10 },
  input:            {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 5,
  },
  suggestionsBox:   {
    maxHeight: 150,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
  },
  suggestionItem:   { padding: 10, borderBottomWidth: 1, borderColor: '#eee' },
  captionContainer: { margin: 20 },
  uploadSection:    { marginHorizontal: 20, marginTop: 10 },
  uploadBtn:        {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledBtn:      { backgroundColor: '#aaa' },
  uploadText:       { color: COLORS.white, fontSize: 16 },
  progressText:     { textAlign: 'center', marginTop: 5, color: COLORS.textDark },
});
