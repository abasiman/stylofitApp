// src/components/PostCard.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Modal,
  TouchableWithoutFeedback,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { usePosts } from '../contexts/PostsContext';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../firebase';
import {
  doc,
  onSnapshot,
  collection,
  query,
  orderBy,
} from 'firebase/firestore';

const PostCard = ({ post }) => {
  const { likePost, unlikePost, addComment } = usePosts();
  const navigation = useNavigation();
  const currentUser = auth.currentUser;
  const lastTap = useRef(null);

  // — author info —
  const [author, setAuthor] = useState({ displayName: '', photoURL: null });

  // like state + counts
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);

  // comments modal
  const [comments, setComments] = useState([]);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [newComment, setNewComment] = useState('');

  // 0️⃣ load the post‐owner’s profile
  useEffect(() => {
    const userRef = doc(db, 'users', post.userId);
    const unsub = onSnapshot(userRef, snap => {
      if (snap.exists()) {
        const data = snap.data();
        setAuthor({
          displayName: data.displayName || 'Unknown',
          photoURL:    data.photoURL    || null,
        });
      }
    });
    return () => unsub();
  }, [post.userId]);

  // 1️⃣ has current user liked?
  useEffect(() => {
    if (!currentUser) return;
    const likeDoc = doc(db, 'outfits', post.id, 'likes', currentUser.uid);
    const unsub = onSnapshot(likeDoc, snap => {
      setLiked(snap.exists());
    });
    return () => unsub();
  }, [post.id, currentUser]);

  // 2️⃣ like count
  useEffect(() => {
    const likesCol = collection(db, 'outfits', post.id, 'likes');
    const unsub = onSnapshot(likesCol, snap => {
      setLikesCount(snap.size);
    });
    return () => unsub();
  }, [post.id]);

  // 3️⃣ comment count
  useEffect(() => {
    const commentsCol = collection(db, 'outfits', post.id, 'comments');
    const unsub = onSnapshot(commentsCol, snap => {
      setCommentsCount(snap.size);
    });
    return () => unsub();
  }, [post.id]);

  // 4️⃣ full comments when modal open
  useEffect(() => {
    if (!commentModalVisible) return;
    const commentsQ = query(
      collection(db, 'outfits', post.id, 'comments'),
      orderBy('timestamp', 'desc')
    );
    const unsub = onSnapshot(commentsQ, snap => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [commentModalVisible, post.id]);

  const handleToggleLike = () => {
    if (liked) unlikePost(post.id);
    else        likePost(post.id);
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (lastTap.current && now - lastTap.current < 300) {
      handleToggleLike();
    }
    lastTap.current = now;
  };

  const handleSubmitComment = async () => {
    await addComment(post.id, newComment);
    setNewComment('');
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <Pressable
          onPress={() =>
            navigation.navigate('User', { userId: post.userId })
          }
        >
          {author.photoURL
            ? <Image source={{ uri: author.photoURL }} style={styles.profilePic} />
            : <View style={styles.profilePic} />
          }
        </Pressable>

        <Pressable
          onPress={() =>
            navigation.navigate('User', { userId: post.userId })
          }
          style={{ flex: 1 }}
        >
          <Text style={styles.username}>@{author.displayName}</Text>
        </Pressable>

        <MaterialCommunityIcons name="dots-horizontal" size={24} />
      </View>

      {/* Image + tags */}
      <TouchableWithoutFeedback onPress={handleDoubleTap}>
        <View style={styles.outfitContainer}>
          <Image source={{ uri: post.imageUrl }} style={styles.outfitImage} />
          {post.tags?.map((tag, i) => (
            <Pressable
              key={i}
              style={[
                styles.tag,
                { top:  `${tag.position.y}%`, left: `${tag.position.x}%` }
              ]}
            >
              <Text style={styles.tagText}>{tag.brand || '(no brand)'}</Text>
            </Pressable>
          ))}
        </View>
      </TouchableWithoutFeedback>

      {/* Actions */}
      <View style={styles.actions}>
        <FontAwesome
          name="heart"
          size={24}
          color={liked ? 'red' : 'black'}
          onPress={handleToggleLike}
        />
        <Text style={styles.countText}>{likesCount}</Text>

        <FontAwesome
          name="comment"
          size={24}
          style={{ marginLeft: 20 }}
          onPress={() => setCommentModalVisible(true)}
        />
        <Text style={styles.countText}>{commentsCount}</Text>

        {/* <FontAwesome name="bookmark" size={24} style={{ marginLeft: 'auto' }} /> */}
      </View>

      {/* Caption */}
      <Text style={styles.caption}>{post.caption}</Text>

      {/* Location */}
      {post.location && (
        <Pressable
          onPress={() => navigation.navigate('Map', { location: post.location })}
          style={styles.locationBadge}
        >
          <Text style={styles.locationText}>📍 {post.location.name}</Text>
        </Pressable>
      )}

      {/* Comments Modal */}
      <Modal
        visible={commentModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCommentModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalWrapper}
        >
          <View style={styles.commentsContainer}>
            <Text style={styles.commentsTitle}>Comments</Text>
            <FlatList
              data={comments}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={styles.commentRow}>
                  <Text style={styles.commentUser}>@{item.username}:</Text>
                  <Text style={styles.commentText}>{item.text}</Text>
                </View>
              )}
              ListEmptyComponent={<Text style={{ color: '#666' }}>No comments yet.</Text>}
            />

            <View style={styles.commentInputRow}>
              <TextInput
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Write a comment..."
                style={styles.commentInput}
              />
              <Pressable onPress={handleSubmitComment} style={styles.sendButton}>
                <Text style={styles.sendButtonText}>Send</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => setCommentModalVisible(false)}
              style={styles.modalClose}
            >
              <Text style={{ color: '#83715D' }}>Close</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default PostCard;

const styles = StyleSheet.create({
  card: { backgroundColor: '#F5F5F5', borderRadius: 20, padding: 15, marginBottom: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  profilePic: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#83715D', marginRight: 8 },
  username: { fontSize: 16, fontWeight: 'bold', flex: 1 },
  outfitContainer: { position: 'relative', backgroundColor: '#FFF', height: 300, borderRadius: 10, overflow: 'hidden', marginBottom: 10 },
  outfitImage: { width: '100%', height: '100%' },
  tag: { position: 'absolute', backgroundColor: '#333', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  tagText: { color: '#fff', fontSize: 12 },
  actions: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  countText: { marginLeft: 6, fontSize: 14, color: '#333' },
  caption: { fontSize: 14, color: '#333', marginBottom: 8 },
  locationBadge: { marginTop: 8, padding: 6, backgroundColor: '#EAEAE9', borderRadius: 12, alignSelf: 'flex-start' },
  locationText: { fontSize: 14, color: '#333' },
  modalWrapper: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' },
  commentsContainer: { backgroundColor: '#fff', margin: 20, borderRadius: 10, padding: 16, maxHeight: '80%' },
  commentsTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  commentRow: { flexDirection: 'row', marginBottom: 8 },
  commentUser: { fontWeight: 'bold', marginRight: 6 },
  commentText: { flex: 1, flexWrap: 'wrap' },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  commentInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  sendButton: { marginLeft: 8, backgroundColor: '#83715D', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  sendButtonText: { color: '#fff' },
  modalClose: { marginTop: 10, alignSelf: 'center' },
});
