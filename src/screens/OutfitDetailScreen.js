// src/screens/OutfitDetailScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome, Entypo } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { auth, db, storage } from '../../firebase';
import {
  doc,
  onSnapshot,
  collection,
  query,
  orderBy,
  addDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  serverTimestamp
} from 'firebase/firestore';
import { ref as storageRef, deleteObject } from 'firebase/storage';

export default function OutfitDetailScreen() {
  const nav         = useNavigation();
  const { outfitId }= useRoute().params;
  const user        = auth.currentUser;
  const insets      = useSafeAreaInsets();
  const lastTap     = useRef(null);

  const [outfit,        setOutfit]        = useState(null);
  const [liked,         setLiked]         = useState(false);
  const [likesCount,    setLikesCount]    = useState(0);
  const [comments,      setComments]      = useState([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [newComment,    setNewComment]    = useState('');
  const [menuVisible,   setMenuVisible]   = useState(false);
  const scaleAnim      = useRef(new Animated.Value(1)).current;

  // 1) Subscribe to the outfit doc
  useEffect(() => {
    const ref = doc(db, 'outfits', outfitId);
    const unsub = onSnapshot(ref, snap => {
      if (!snap.exists()) return nav.goBack();
      setOutfit({ id: snap.id, ...snap.data() });
    });
    return unsub;
  }, [outfitId]);

  // 2) Track my like
  useEffect(() => {
    if (!user) return;
    const likeRef = doc(db, 'outfits', outfitId, 'likes', user.uid);
    return onSnapshot(likeRef, snap => setLiked(snap.exists()));
  }, [outfitId]);

  // 3) Real-time total likes
  useEffect(() => {
    const col = collection(db, 'outfits', outfitId, 'likes');
    return onSnapshot(col, snap => setLikesCount(snap.size));
  }, [outfitId]);

  // 4) Real-time comments + count
  useEffect(() => {
    const q = query(
      collection(db, 'outfits', outfitId, 'comments'),
      orderBy('timestamp', 'desc')
    );
    return onSnapshot(q, snap => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setCommentsCount(snap.size);
    });
  }, [outfitId]);

  // 5) Toggle like with scale animation
  const handleToggleLike = async () => {
    if (!user) return;
    const likeRef = doc(db, 'outfits', outfitId, 'likes', user.uid);
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.3, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1,   useNativeDriver: true })
    ]).start();

    if (liked) {
      await deleteDoc(likeRef);
      await updateDoc(doc(db, 'outfits', outfitId), { likesCount: increment(-1) });
    } else {
      await setDoc(likeRef, { timestamp: serverTimestamp() });
      await updateDoc(doc(db, 'outfits', outfitId), { likesCount: increment(1) });
    }
  };

  // double-tap to like
  const handleDoubleTap = () => {
    const now = Date.now();
    if (lastTap.current && now - lastTap.current < 300) {
      handleToggleLike();
    }
    lastTap.current = now;
  };

  // 6) Submit comment
  const submitComment = async () => {
    if (!user || !newComment.trim()) return;
    await addDoc(
      collection(db, 'outfits', outfitId, 'comments'),
      {
        userId:    user.uid,
        username:  user.displayName || 'Anonymous',
        text:      newComment.trim(),
        timestamp: serverTimestamp()
      }
    );
    await updateDoc(doc(db, 'outfits', outfitId), { commentsCount: increment(1) });
    setNewComment('');
  };

  // 7) Delete post
  const deletePost = async () => {
    try {
      await deleteDoc(doc(db, 'outfits', outfitId));
      if (outfit.storagePath) {
        const imgRef = storageRef(storage, outfit.storagePath);
        await deleteObject(imgRef);
      }
      setMenuVisible(false);
      nav.navigate('Users', { userId: outfit.userId });
    } catch (err) {
      console.error('Delete failed:', err);
      Alert.alert('Error', 'Could not delete post.');
    }
  };
  const confirmDelete = () => {
    Alert.alert(
      'Delete Post?',
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setMenuVisible(false) },
        { text: 'Delete', style: 'destructive', onPress: deletePost }
      ]
    );
  };

  if (!outfit) return null;

  return (
    <SafeAreaView style={[styles.safeArea, { paddingBottom: insets.bottom }]}>
      <FlatList
        data={comments}
        keyExtractor={item => item.id}
        keyboardShouldPersistTaps="handled"       // <-- keep keyboard open on taps
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={
          <>
            {/* Back & Menu */}
            <View style={styles.headerRow}>
              <Pressable>
              </Pressable>
              <Pressable onPress={() => setMenuVisible(v => !v)} style={styles.menuBtn}>
                <Entypo name="dots-three-vertical" size={24} color="#333" />
              </Pressable>
            </View>
            {menuVisible && (
              <View style={styles.menu}>
                <Pressable onPress={confirmDelete} style={styles.menuItem}>
                  <Text style={[styles.menuText, { color: 'red' }]}>Delete post</Text>
                </Pressable>
                <Pressable onPress={() => setMenuVisible(false)} style={styles.menuItem}>
                  <Text style={styles.menuText}>Cancel</Text>
                </Pressable>
              </View>
            )}

            {/* Image */}
            <Pressable onPress={handleDoubleTap}>
              <Image source={{ uri: outfit.imageUrl }} style={styles.image} />
            </Pressable>

            {/* Actions */}
            <View style={styles.actionsRow}>
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <FontAwesome
                  name="heart"
                  size={32}
                  color={liked ? 'red' : '#333'}
                  onPress={handleToggleLike}
                />
              </Animated.View>
              <Text style={styles.count}>{likesCount}</Text>

              <FontAwesome
                name="comment"
                size={32}
                color="#333"
                style={{ marginLeft: 24 }}
              />
              <Text style={styles.count}>{commentsCount}</Text>
            </View>

            {/* Caption & Location */}
            <Text style={styles.caption}>{outfit.caption}</Text>
            {outfit.location && (
              <Text style={styles.location}>📍 {outfit.location.name}</Text>
            )}
            <Text style={styles.sectionTitle}>Comments</Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.commentRow}>
            <Text style={styles.commentUser}>@{item.username}:</Text>
            <Text style={styles.commentText}>{item.text}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No comments yet.</Text>}
      />

      {/* Pull the input **out** of the FlatList so it doesn’t remount */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.bottom}
        style={styles.inputWrapper}
      >
        <TextInput
          value={newComment}
          onChangeText={setNewComment}
          placeholder="Write a comment..."
          style={styles.input}
          returnKeyType="send"
          onSubmitEditing={submitComment}
        />
        <Pressable onPress={submitComment} style={styles.sendBtn}>
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:   { flex: 1, backgroundColor: '#fff' },
  headerRow:  {
    flexDirection:    'row',
    justifyContent:   'space-between',
    paddingHorizontal:16,
    paddingTop:       8
  },
  backBtn:    { padding: 8 },
  backText:   { fontSize: 16, color: '#8C7661' },
  menuBtn:    { padding: 8 },
  menu:       {
    position:       'absolute',
    top:             40,
    right:           16,
    backgroundColor:'#fff',
    borderRadius:    8,
    elevation:       5,
    zIndex:          10
  },
  menuItem:   { padding: 12 },
  menuText:   { fontSize: 16 },

  image:       { width: '100%', height: 400, backgroundColor: '#eee' },
  actionsRow:  { flexDirection: 'row', alignItems: 'center', padding: 16 },
  count:       { marginLeft: 8, fontSize: 18 },

  caption:     { paddingHorizontal:16, fontSize: 14, color: '#333' },
  location:    { paddingHorizontal:16, fontSize: 13, color: '#666', marginTop: 4 },
  sectionTitle:{ padding:16, fontSize: 16, fontWeight: 'bold' },

  commentRow:  { flexDirection: 'row', paddingHorizontal:16, marginBottom:8 },
  commentUser: { fontWeight: 'bold', marginRight: 6 },
  commentText: { flex: 1 },
  empty:       { paddingHorizontal:16, color: '#666' },

  inputWrapper:{
    flexDirection:   'row',
    alignItems:      'center',
    padding:         16,
    borderTopWidth:  1,
    borderColor:     '#eee',
    backgroundColor: '#fff'
  },
  input: {
    flex:             1,
    borderWidth:      1,
    borderColor:      '#ccc',
    borderRadius:     20,
    paddingHorizontal:12,
    paddingVertical:  8
  },
  sendBtn:    {
    marginLeft:       12,
    backgroundColor:  '#8C7661',
    paddingHorizontal:16,
    paddingVertical:  8,
    borderRadius:     20
  },
  sendText:   { color: '#fff', fontWeight: '600' },
});
