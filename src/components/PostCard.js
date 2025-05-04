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
  Platform
} from 'react-native';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { usePosts } from '../contexts/PostsContext';
import { useNavigation } from '@react-navigation/native';
import { auth,db } from '../../firebase';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';

const PostCard = ({ post }) => {
  const { likePost, unlikePost, addComment } = usePosts();
  const navigation = useNavigation();
  const user = auth.currentUser;
  const lastTap = useRef(null);

  const [liked, setLiked]               = useState(false);
  const [likesCount, setLikesCount]     = useState(post.likesCount || 0);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  const [comments, setComments]         = useState([]);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [newComment, setNewComment]     = useState('');

  // Sync live counts from the parent post object
  useEffect(() => setLikesCount(post.likesCount || 0),
    [post.likesCount]
  );
  useEffect(() => setCommentsCount(post.commentsCount || 0),
    [post.commentsCount]
  );

  // 1) Real-time liked state for current user
  useEffect(() => {
    if (!user) return;
    const likeDoc = doc(db, 'outfits', post.id, 'likes', user.uid);
    const unsub = onSnapshot(likeDoc, snap => setLiked(snap.exists()));
    return unsub;
  }, [post.id, user]);

  // 2) Subscribe to comments sub-collection when modal opens
  useEffect(() => {
    if (!commentModalVisible) return;
    const commentsQ = query(
      collection(db, 'outfits', post.id, 'comments'),
      orderBy('timestamp', 'desc')
    );
    const unsub = onSnapshot(commentsQ, snap => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [commentModalVisible, post.id]);

  const handleToggleLike = () => {
    if (liked) unlikePost(post.id);
    else         likePost(post.id);
    // no need to manually setLikesCount; subscription will update
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
        <View style={styles.profilePic} />
        <Text style={styles.username}>@{user?.displayName || 'you'}</Text>
        <MaterialCommunityIcons name="dots-horizontal" size={24} />
      </View>

      {/* Image + Tags */}
      <TouchableWithoutFeedback onPress={handleDoubleTap}>
        <View style={styles.outfitContainer}>
          <Image source={{ uri: post.imageUrl }} style={styles.outfitImage} />
          {post.tags?.map((tag,i) => (
            <Pressable
              key={i}
              style={[styles.tag, {
                top:  `${tag.position.y}%`,
                left: `${tag.position.x}%`
              }]}
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

        <FontAwesome name="bookmark" size={24} style={{ marginLeft: 'auto' }} />
      </View>

      {/* Caption */}
      <Text style={styles.caption}>
        {post.caption}
      </Text>

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

  /* Comments Modal */
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
  modalClose: { marginTop: 10, alignSelf: 'center' }
});
