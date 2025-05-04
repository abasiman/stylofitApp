// src/screens/OutfitDetailScreen.js

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import { auth,db } from '../../firebase';
import {
  doc,
  onSnapshot,
  collection,
  query,
  orderBy,
  setDoc,
  deleteDoc,
  addDoc,
  updateDoc,
  increment,
  serverTimestamp
} from 'firebase/firestore';

export default function OutfitDetailScreen() {
  const nav   = useNavigation();
  const route = useRoute();
  const { outfitId } = route.params;
  const user = auth.currentUser;

  const [outfit, setOutfit]       = useState(null);
  const [liked, setLiked]         = useState(false);
  const [comments, setComments]   = useState([]);
  const [newComment, setNewComment] = useState('');
  const lastTap = useRef(null);

  // 1) Subscribe to outfit doc
  useEffect(() => {
    const ref = doc(db, 'outfits', outfitId);
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) setOutfit({ id: snap.id, ...snap.data() });
      else nav.goBack();
    });
    return unsub;
  }, [outfitId]);

  // 2) Track whether I’ve liked it
  useEffect(() => {
    if (!user) return;
    const likeRef = doc(db, 'outfits', outfitId, 'likes', user.uid);
    const unsub = onSnapshot(likeRef, snap => setLiked(snap.exists()));
    return unsub;
  }, [outfitId, user]);

  // 3) Subscribe to comments
  useEffect(() => {
    const q = query(
      collection(db, 'outfits', outfitId, 'comments'),
      orderBy('timestamp', 'desc')
    );
    const unsub = onSnapshot(q, snap =>
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, [outfitId]);

  const toggleLike = async () => {
    if (!user) return;
    const likeRef = doc(db, 'outfits', outfitId, 'likes', user.uid);
    if (liked) {
      await deleteDoc(likeRef);
      await updateDoc(doc(db,'outfits',outfitId), { likesCount: increment(-1) });
    } else {
      await setDoc(likeRef, { timestamp: serverTimestamp() });
      await updateDoc(doc(db,'outfits',outfitId), { likesCount: increment(1) });
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (lastTap.current && now - lastTap.current < 300) {
      toggleLike();
    }
    lastTap.current = now;
  };

  const submitComment = async () => {
    if (!user || !newComment.trim()) return;
    await addDoc(
      collection(db,'outfits',outfitId,'comments'),
      {
        userId:    user.uid,
        username:  user.displayName || 'Anonymous',
        text:      newComment.trim(),
        timestamp: serverTimestamp()
      }
    );
    await updateDoc(doc(db,'outfits',outfitId), {
      commentsCount: increment(1)
    });
    setNewComment('');
  };

  if (!outfit) return null;

  return (
    <ScrollView style={styles.container}>
      <Pressable onPress={nav.goBack} style={styles.backBtn}>
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>

      <Pressable onPress={handleDoubleTap}>
        <Image source={{ uri: outfit.imageUrl }} style={styles.image} />
      </Pressable>

      <View style={styles.actionsRow}>
        <FontAwesome
          name="heart"
          size={28}
          color={liked ? 'red' : 'black'}
          onPress={toggleLike}
        />
        <Text style={styles.count}>{outfit.likesCount || 0}</Text>

        <FontAwesome
          name="comment"
          size={28}
          style={{ marginLeft: 24 }}
        />
        <Text style={styles.count}>{outfit.commentsCount || 0}</Text>
      </View>

      <Text style={styles.caption}>{outfit.caption}</Text>
      {outfit.location && (
        <Text style={styles.location}>📍 {outfit.location.name}</Text>
      )}

      <Text style={styles.sectionTitle}>Comments</Text>
      {comments.length > 0 ? (
        comments.map(c => (
          <View key={c.id} style={styles.commentRow}>
            <Text style={styles.commentUser}>@{c.username}:</Text>
            <Text style={styles.commentText}>{c.text}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.empty}>No comments yet.</Text>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.inputWrapper}
      >
        <TextInput
          value={newComment}
          onChangeText={setNewComment}
          placeholder="Write a comment..."
          style={styles.input}
        />
        <Pressable onPress={submitComment} style={styles.sendBtn}>
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  backBtn: { padding: 12 },
  backText: { fontSize: 16, color: '#8C7661' },
  image: { width: '100%', height: 400, backgroundColor: '#eee' },
  actionsRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  count: { marginLeft: 8, fontSize: 16 },
  caption: { paddingHorizontal: 16, fontSize: 14, color: '#333' },
  location: { paddingHorizontal: 16, fontSize: 13, color: '#666', marginTop: 4 },
  sectionTitle: { padding: 16, fontSize: 16, fontWeight: 'bold' },
  commentRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8 },
  commentUser: { fontWeight: 'bold', marginRight: 6 },
  commentText: { flex: 1 },
  empty: { paddingHorizontal: 16, color: '#666' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#eee'
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  sendBtn: {
    marginLeft: 12,
    backgroundColor: '#8C7661',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20
  },
  sendText: { color: '#fff', fontWeight: '600' }
});
