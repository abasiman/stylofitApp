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
  TouchableOpacity,
  Dimensions,
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

const { width } = Dimensions.get('window');

const PostCard = ({ post }) => {
  const { likePost, unlikePost, addComment } = usePosts();
  const navigation = useNavigation();
  const currentUser = auth.currentUser;
  const lastTap = useRef(null);

  // State
  const [author, setAuthor] = useState({ displayName: '', photoURL: null });
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);

  // Load author info
  useEffect(() => {
    const userRef = doc(db, 'users', post.userId);
    const unsub = onSnapshot(userRef, snap => {
      if (snap.exists()) {
        const data = snap.data();
        setAuthor({
          displayName: data.displayName || 'Unknown',
          photoURL: data.photoURL || null,
        });
      }
    });
    return () => unsub();
  }, [post.userId]);

  // Check if current user liked
  useEffect(() => {
    if (!currentUser) return;
    const likeDoc = doc(db, 'outfits', post.id, 'likes', currentUser.uid);
    const unsub = onSnapshot(likeDoc, snap => {
      setLiked(snap.exists());
    });
    return () => unsub();
  }, [post.id, currentUser]);

  // Like count
  useEffect(() => {
    const likesCol = collection(db, 'outfits', post.id, 'likes');
    const unsub = onSnapshot(likesCol, snap => {
      setLikesCount(snap.size);
    });
    return () => unsub();
  }, [post.id]);

  // Comment count
  useEffect(() => {
    const commentsCol = collection(db, 'outfits', post.id, 'comments');
    const unsub = onSnapshot(commentsCol, snap => {
      setCommentsCount(snap.size);
    });
    return () => unsub();
  }, [post.id]);

  // Full comments when modal open
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
    else likePost(post.id);
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

  const showTagDetails = (tag) => {
    setSelectedTag(tag);
  };

  const navigateToLocation = () => {
    if (!selectedTag?.place) return;
    navigation.navigate('Map', { location: selectedTag.place });
    setSelectedTag(null);
  };

  // Only first word of store name
  const getFirstName = (fullName) => fullName.split(' ')[0];

  // Overlay tag (on image)
  const renderTag = (tag, index) => {
    if (!tag || !tag.position) return null;
    const fullName = tag.place?.name || 'Unknown';
    const name = getFirstName(fullName);

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.tag,
          { 
            top: `${tag.position.y}%`, 
            left: `${tag.position.x}%`,
          }
        ]}
        onPress={() => showTagDetails(tag)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name="map-marker"
          size={16}
          color="#fff"
          style={{ marginRight: 4 }}
        />
        <Text style={styles.tagText}>{name}</Text>
      </TouchableOpacity>
    );
  };

  // Featured Stores pill
  const renderTagPill = (tag, index) => {
    if (!tag) return null;
    const fullName = tag.place?.name || 'Unknown';
    const name = getFirstName(fullName);

    return (
      <TouchableOpacity 
        key={index} 
        style={styles.tagPill}
        onPress={() => showTagDetails(tag)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name="map-marker"
          size={16}
          color="#fff"
          style={{ marginRight: 4 }}
        />
        <Text style={styles.tagPillText}>{name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <Pressable
          onPress={() => navigation.navigate('User', { userId: post.userId })}
        >
          {author.photoURL ? (
            <Image source={{ uri: author.photoURL }} style={styles.profilePic} />
          ) : (
            <View style={styles.profilePic} />
          )}
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('User', { userId: post.userId })}
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
          {post.tags?.map((tag, i) => renderTag(tag, i))}
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
      </View>

      {/* Caption */}
      <Text style={styles.caption}>{post.caption}</Text>

      {/* Tags summary */}
      {post.tags?.length > 0 && (
        <View style={styles.tagsSummary}>
          <Text style={styles.tagsSummaryTitle}>Featured Stores:</Text>
          <View style={styles.tagsList}>
            {post.tags.map((tag, i) => renderTagPill(tag, i))}
          </View>
        </View>
      )}

      {/* Tag Details Modal */}
      <Modal
        visible={!!selectedTag}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedTag(null)}
      >
        <TouchableWithoutFeedback onPress={() => setSelectedTag(null)}>
          <View style={styles.tagModalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.tagModalContent}>
                <Text style={styles.tagModalTitle}>
                  {selectedTag?.place?.name || 'Store Details'}
                </Text>

                {selectedTag?.place?.address && (
                  <Text style={styles.tagModalAddress}>
                    {selectedTag.place.address}
                  </Text>
                )}

                <TouchableOpacity 
                  style={styles.tagModalButton}
                  onPress={navigateToLocation}
                >
                  <MaterialCommunityIcons
                    name="map-marker"
                    size={20}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.tagModalButtonText}>View on Map</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

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

const styles = StyleSheet.create({
  card: { 
    backgroundColor: '#F5F5F5', 
    borderRadius: 20, 
    padding: 15, 
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  profilePic: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: '#83715D', 
    marginRight: 8 
  },
  username: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    flex: 1 
  },
  outfitContainer: { 
    position: 'relative', 
    backgroundColor: '#FFF', 
    height: 300, 
    borderRadius: 10, 
    overflow: 'hidden', 
    marginBottom: 10 
  },
  outfitImage: { 
    width: '100%', 
    height: '100%' 
  },
  tag: {
    position: 'absolute',
    backgroundColor: 'rgba(51, 51, 51, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '60%',
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  tagsSummary: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#EAEAE9',
    borderRadius: 12,
  },
  tagsSummaryTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    fontSize: 12,
    color: '#666',
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagPill: {
    backgroundColor: '#83715D',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 5,
    marginBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagPillText: {
    color: '#fff',
    fontSize: 12,
  },
  actions: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  countText: { 
    marginLeft: 6, 
    fontSize: 14, 
    color: '#333' 
  },
  caption: { 
    fontSize: 14, 
    color: '#333', 
    marginBottom: 8 
  },
  // Tag Modal Styles
  tagModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tagModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: width - 40,
  },
  tagModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  tagModalAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  tagModalButton: {
    backgroundColor: '#83715D',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Comments Modal Styles
  modalWrapper: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center' 
  },
  commentsContainer: { 
    backgroundColor: '#fff', 
    margin: 20, 
    borderRadius: 10, 
    padding: 16, 
    maxHeight: '80%' 
  },
  commentsTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 12 
  },
  commentRow: { 
    flexDirection: 'row', 
    marginBottom: 8 
  },
  commentUser: { 
    fontWeight: 'bold', 
    marginRight: 6 
  },
  commentText: { 
    flex: 1, 
    flexWrap: 'wrap' 
  },
  commentInputRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 12 
  },
    commentInput: { 
    flex: 1, 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 8, 
    paddingHorizontal: 10, 
    paddingVertical: 6 
  },
  sendButton: { 
    marginLeft: 8, 
    backgroundColor: '#83715D', 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderRadius: 8 
  },
  sendButtonText: { 
    color: '#fff', 
    fontWeight: 'bold' 
  },
  modalClose: { 
    marginTop: 10, 
    alignSelf: 'center' 
  },
});

export default PostCard;
