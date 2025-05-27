// src/screens/UploadScreen.js
import React, { useState, useRef, useEffect } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
// safely grab `extra` whether you’re in Expo Go, a production build, or EAS
const { manifest, expoConfig } = Constants;
const extra = manifest?.extra ?? expoConfig?.extra ?? {};
const GOOGLE_API_KEY = extra.GOOGLE_VISION_API_KEY;
import * as ImageManipulator from 'expo-image-manipulator';


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
  TouchableWithoutFeedback, KeyboardAvoidingView,
  FlatList,
  Platform,
  Modal,
  PanResponder,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { auth, db, storage } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { usePosts } from '../contexts/PostsContext';

const { width } = Dimensions.get('window');
const PLACES_AUTOCOMPLETE_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
const PLACES_DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';

// Helper: convert a local file:// URI into a Blob via XHR
function uriToBlob(uri) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response);
    xhr.onerror = () => reject(new Error('uriToBlob failed'));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

async function checkSafeSearchAsync(uri) {
  // 1) grab the image as base64
  const { base64 } = await ImageManipulator.manipulateAsync(uri, [], { base64: true });

  // 2) call Vision API
  const visionRes = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests:[{
          image: { content: base64 },
          features: [{ type: 'SAFE_SEARCH_DETECTION' }],
        }],
      }),
    }
  );
  if (!visionRes.ok) {
    throw new Error(`Vision API error: ${visionRes.status}`);
  }

  // 3) parse and return annotation
  const { responses } = await visionRes.json();
  const annotation = responses?.[0]?.safeSearchAnnotation;
  if (!annotation) {
    throw new Error('No SafeSearch data returned');
  }
  return annotation;
}




const COLORS = {
  primary: '#83715D',
  white: '#FFFFFF',
  textDark: '#333333',
  tagBackground: 'rgba(51, 51, 51, 0.8)',
};

export default function UploadScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Location tagging state
  const [locInput, setLocInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [tags, setTags] = useState([]);
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [activeTagPosition, setActiveTagPosition] = useState({ x: 0, y: 0 });

  const currentCoordsRef = useRef(null);
  const fetchTimeout = useRef(null);
  const { addPost } = usePosts();
  const [ssResults, setSsResults] = useState(null); // will hold { adult, violence, racy }
  const [ssModalVisible, setSsModalVisible] = useState(false);
  const [pendingAnnotation, setPendingAnnotation] = useState(null);
  // Media-library permission
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'We need photo library access to upload.');
        }
      }
    })();
  }, []);

  // Location permission
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

  // Pick an image
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
        setTags([]); // Reset tags when new image is selected
      }
    } catch (e) {
      Alert.alert('Error', 'Image pick failed: ' + e.message);
    }
  };

  // Handle image press for tagging
  const handleImagePress = (event) => {
    if (!selectedPlace) return;
    
    const { locationX, locationY } = event.nativeEvent;
    const imageWidth = width - 40;
    const imageHeight = (width - 40) * 1.2;
    
    // Calculate percentage position
    const xPercent = (locationX / imageWidth) * 100;
    const yPercent = (locationY / imageHeight) * 100;
    
    setActiveTagPosition({ x: xPercent, y: yPercent });
    setTagModalVisible(true);
  };

  // Confirm tag placement
  const confirmTag = () => {
    if (!selectedPlace) return;
    
    const newTag = {
      id: Date.now().toString(),
      place: selectedPlace,
      position: activeTagPosition,
    };
    
    setTags([...tags, newTag]);
    setSelectedPlace(null);
    setLocInput('');
    setTagModalVisible(false);
  };

  // Remove a tag
  const removeTag = (tagId) => {
    setTags(tags.filter(tag => tag.id !== tagId));
  };

  // Upload image to storage
  const uploadImageAsync = async (uri) => {
    /* const response = await fetch(uri);
    const blob = await response.blob(); */
  
    const blob = await uriToBlob(uri);

    const filename = `images/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    const ref      = storageRef(storage, filename);

    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(ref, blob);
  
      uploadTask.on('state_changed',
        snapshot => {
          const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(p);
        },
        error => reject(error),
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  // Debounced Places autocomplete
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

  // Fetch place details
  const handleSelectSuggestion = async (placeId, description) => {
    try {
      const r = await fetch(
        `${PLACES_DETAILS_URL}?place_id=${placeId}&key=${GOOGLE_API_KEY}`
      );
      const j = await r.json();
      if (j.status === 'OK') {
        const loc = j.result.geometry.location;
        setSelectedPlace({
          id: placeId,
          name: description,
          address: j.result.formatted_address,
          latitude: loc.lat,
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

  // Handle final upload
  // Handle final upload
// inside UploadScreen component, after your useState hooks:

// 1️⃣ This kicks off SafeSearch, then shows the modal — but doesn’t upload yet.
async function handleUpload() {
  if (!image || uploading) return;
  if (tags.length === 0) {
    return Alert.alert(
      'Add at least one tag',
      'Please tag the stores in your outfit'
    );
  }

  setUploading(true);
  setProgress(0);

  try {
    const annotation = await checkSafeSearchAsync(image);

    // stash the results and show our custom modal
    setPendingAnnotation(annotation);
    setSsResults(annotation);
    setSsModalVisible(true);

    // _do not_ proceed here—will wait for modal “Continue”
  } catch (e) {
    console.error('❗️ SafeSearch failed:', e);
    Alert.alert('Upload Error', e.message);
    setUploading(false);
  }
}

// 2️⃣ This only runs when you tap “Continue” in the SafeSearch modal.
async function actuallyUpload() {
  setSsModalVisible(false);

  const annotation = pendingAnnotation;
  if (!annotation) {
    setUploading(false);
    return;
  }

  // block again if we see bad content
  if (
    ['LIKELY','VERY_LIKELY'].includes(annotation.adult) ||
    ['LIKELY','VERY_LIKELY'].includes(annotation.violence) ||
    ['LIKELY','VERY_LIKELY'].includes(annotation.racy)
  ) {
    Alert.alert(
      'Inappropriate Image',
      'This photo looks like it contains adult, violent, or racy content and cannot be uploaded.'
    );
    setUploading(false);
    return;
  }

  try {
    // ✅ it’s clean—actually upload now
    const downloadURL = await uploadImageAsync(image);

    const postData = {
      userId: auth.currentUser.uid,
      imageUrl: downloadURL,
      caption,
      tags: tags.map(tag => ({
        place: tag.place,
        position: tag.position,
      })),
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'outfits'), postData);
    addPost({ id: docRef.id, ...postData });

    Alert.alert('Success', 'Outfit uploaded!', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  } catch (e) {
    console.error('❗️ Upload failed:', e);
    Alert.alert('Upload Error', e.message);
  } finally {
    // reset form & state
    setUploading(false);
    setImage(null);
    setCaption('');
    setTags([]);
    setSelectedPlace(null);
  }
}


   /*  // ✅ 4) it’s clean — go ahead and upload
    const downloadURL = await uploadImageAsync(image);



      const postData = {
        userId: auth.currentUser.uid,
        imageUrl: downloadURL,
        caption,
        tags: tags.map(tag => ({
          place: tag.place,
          position: tag.position,
        })),
        createdAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, 'outfits'), postData);
      addPost({ id: docRef.id, ...postData });

      Alert.alert('Success', 'Outfit uploaded!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
      setImage(null);
      setCaption('');
      setTags([]);
      setSelectedPlace(null);
    } catch (e) {
      console.error('❗️ Upload failed:', e);
      Alert.alert('Upload Error', e.message);
    } finally {
      setUploading(false);
    }
  };
 */
  // Render form
  const renderForm = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>New Outfit</Text>
      </View>

      <View style={styles.imageContainer}>
        {image ? (
          <TouchableWithoutFeedback onPress={handleImagePress}>
            <View style={styles.imageWrapper}>
              <Image source={{ uri: image }} style={styles.image} />
              {tags.map(tag => (
          <TouchableOpacity
            key={tag.id}
            style={[
              styles.tagPreview,
              {
                top: `${tag.position.y}%`,
                left: `${tag.position.x}%`,
                flexDirection: 'row',
                alignItems: 'center',
              }
            ]}
            onPress={() => removeTag(tag.id)}
          >
            <MaterialIcons
              name="location-on"
              size={16}
              color="#fff"
              style={{ marginRight: 4 }}
            />
            <Text style={styles.tagPreviewText}>
              {tag.place.name}
            </Text>
          </TouchableOpacity>
        ))}

            </View>
          </TouchableWithoutFeedback>
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
              placeholder="Search for a store to tag..."
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

          {selectedPlace && (
            <View style={styles.selectedPlaceContainer}>
              <Text style={styles.selectedPlaceText}>
                Selected: {selectedPlace.name}
              </Text>
              <Text style={styles.selectedPlaceSubtext}>
                Tap on the image to place tag
              </Text>
            </View>
          )}

          {tags.length > 0 && (
            <View style={styles.tagsListContainer}>
              <Text style={styles.tagsListTitle}>Tags:</Text>
              {tags.map(tag => (
                <View key={tag.id} style={styles.tagItem}>
                  <Text style={styles.tagItemText}>{tag.place.name}</Text>
                  <TouchableOpacity onPress={() => removeTag(tag.id)}>
                    <MaterialIcons name="close" size={18} color="#666" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={styles.captionContainer}>
            <TextInput
              style={styles.input}
              placeholder="Add a caption..."
              value={caption}
              onChangeText={setCaption}
              multiline
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
              <Text style={styles.progressText}>
                {progress.toFixed(0)}% uploaded
              </Text>
            )}
          </View>
        </>
      )}

      {/* Tag Placement Modal */}
      <Modal
        visible={tagModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTagModalVisible(false)}
      >
        <View style={styles.tagModalContainer}>
          <View style={styles.tagModalContent}>
            <Text style={styles.tagModalTitle}>Confirm Tag Placement</Text>
            <Text style={styles.tagModalText}>
              Place tag for: {selectedPlace?.name}
            </Text>
            
            <View style={styles.tagModalButtons}>
              <TouchableOpacity
                style={[styles.tagModalButton, styles.tagModalCancel]}
                onPress={() => setTagModalVisible(false)}
              >
                <Text style={styles.tagModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.tagModalButton, styles.tagModalConfirm]}
                onPress={confirmTag}
              >
                <Text style={styles.tagModalButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );

  return (
    <>
    <Modal
  visible={ssModalVisible}
  transparent
  animationType="fade"
  onRequestClose={() => setSsModalVisible(false)}
>
  <View style={styles.ssOverlay}>
    <View style={styles.ssContainer}>
      <MaterialIcons name="security" size={48} color={COLORS.primary} style={{marginBottom: 12}}/>
      <Text style={styles.ssTitle}>SafeSearch Results</Text>
      {ssResults && ['adult','violence','racy'].map((key) => {
        const val = ssResults[key];
        // pick an icon and color
        const icon = val === 'VERY_LIKELY' ? 'warning' : val === 'LIKELY' ? 'error-outline' : 'check-circle';
        const color = val === 'VERY_LIKELY' ? '#D32F2F' : val === 'LIKELY' ? '#FBC02D' : '#388E3C';
        return (
          <View key={key} style={styles.ssRow}>
            <MaterialIcons name={icon} size={24} color={color} />
            <Text style={[styles.ssLabel, {color}]}>{`${key.charAt(0).toUpperCase()+key.slice(1)}: ${val}`}</Text>
          </View>
        );
      })}
      <TouchableOpacity style={styles.ssButton} onPress={actuallyUpload}>
  <Text style={styles.ssButtonText}>Continue</Text>
</TouchableOpacity>

    </View>
  </View>
</Modal>

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
    </>
   
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { padding: 20, backgroundColor: COLORS.primary },
  headerTitle: { color: COLORS.white, fontSize: 20, textAlign: 'center' },
  imageContainer: { alignItems: 'center', margin: 20 },
  imageWrapper: { position: 'relative', width: '100%' },
  image: { 
    width: width - 40, 
    height: (width - 40) * 1.2, 
    borderRadius: 15,
  },
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
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 5,
  },
  suggestionsBox: {
    maxHeight: 150,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
  },
  suggestionItem: { padding: 10, borderBottomWidth: 1, borderColor: '#eee' },
  selectedPlaceContainer: {
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  selectedPlaceText: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  selectedPlaceSubtext: {
    color: '#666',
    fontSize: 12,
  },
  tagsListContainer: {
    marginHorizontal: 20,
    marginBottom: 10,
  },
  tagsListTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  tagItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    marginBottom: 5,
  },
  tagItemText: {
    flex: 1,
  },
  tagPreview: {
    position: 'absolute',
    backgroundColor: COLORS.tagBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    maxWidth: '60%',
  },
  tagPreviewText: {
    color: '#fff',
    fontSize: 12,
  },
  captionContainer: { margin: 20 },
  uploadSection: { marginHorizontal: 20, marginTop: 10 },
  uploadBtn: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledBtn: { backgroundColor: '#aaa' },
  uploadText: { color: COLORS.white, fontSize: 16 },
  progressText: { textAlign: 'center', marginTop: 5, color: COLORS.textDark },
  tagModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  tagModalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
  },
  tagModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  tagModalText: {
    marginBottom: 20,
    textAlign: 'center',
  },
  tagModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tagModalButton: {
    padding: 10,
    borderRadius: 5,
    width: '48%',
    alignItems: 'center',
  },
  tagModalCancel: {
    backgroundColor: '#e0e0e0',
  },
  tagModalConfirm: {
    backgroundColor: COLORS.primary,
  },
  tagModalButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  ssOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.6)',
  justifyContent: 'center',
  alignItems: 'center',
},
ssContainer: {
  width: '80%',
  backgroundColor: COLORS.white,
  borderRadius: 12,
  padding: 20,
  alignItems: 'center',
  shadowColor: '#000',
  shadowOpacity: 0.2,
  shadowRadius: 10,
},
ssTitle: {
  fontSize: 20,
  fontWeight: 'bold',
  marginBottom: 16,
  color: COLORS.textDark,
},
ssRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginVertical: 6,
  width: '100%',
},
ssLabel: {
  marginLeft: 8,
  fontSize: 16,
  flex: 1,
},
ssButton: {
  marginTop: 20,
  backgroundColor: COLORS.primary,
  paddingVertical: 10,
  paddingHorizontal: 30,
  borderRadius: 8,
},
ssButtonText: {
  color: COLORS.white,
  fontWeight: 'bold',
  fontSize: 16,
},

});