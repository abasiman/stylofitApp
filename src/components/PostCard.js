import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Modal, TouchableWithoutFeedback } from 'react-native';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { usePosts } from '../contexts/PostsContext';
import { useNavigation } from '@react-navigation/native';

const PostCard = ({ post, index }) => {
  const { likePost, unlikePost } = usePosts();
  const navigation = useNavigation();   
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);
  const [liked, setLiked] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);

  let lastTap = null;

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300; // ms

    if (lastTap && (now - lastTap) < DOUBLE_PRESS_DELAY) {
      // Double tap detected
      if (!liked) {
        likePost(index);
      } else {
        unlikePost(index);
      }
      setLiked(!liked);
    } else {
      lastTap = now;
    }
  };

  const handleTagPress = (tag) => {
    setSelectedTag(tag);
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.profilePic} />
        <Text style={styles.username}>@you</Text>
        <MaterialCommunityIcons name="dots-horizontal" size={24} color="black" />
      </View>

      {/* Outfit Image */}
      <TouchableWithoutFeedback onPress={handleDoubleTap}>
        <View style={styles.outfitContainer}>
        <Image source={{ uri: post.imageUrl }} style={styles.outfitImage} />
          {(post.tags || []).map((tag, i) => (

            <Pressable
              key={i}
              style={[
                styles.tag,
                {
                  top: `${tag.position.y}%`,
                  left: `${tag.position.x}%`,
                }
              ]}
              onPress={() => handleTagPress(tag)}
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
          size={20}
          color={liked ? 'red' : 'black'}
          onPress={() => {
            if (!liked) {
              likePost(index);
            } else {
              unlikePost(index);
            }
            setLiked(!liked);
          }}
        />
        <Text style={styles.actionText}>{post.likes || 0}</Text>

        <FontAwesome
          name="comment"
          size={20}
          color="black"
          style={styles.commentIcon}
          onPress={() => setCommentModalVisible(true)}
        />
        <Text style={styles.actionText}>0</Text>

        <FontAwesome name="bookmark" size={20} color="black" style={styles.bookmarkIcon} />
      </View>

      {/* Caption */}
      <Text style={styles.caption}>
        {showFullCaption ? post.caption : `${post.caption.slice(0, 50)}${post.caption.length > 50 ? '...' : ''}`}
        {post.caption.length > 50 && (
          <Text style={styles.moreText} onPress={() => setShowFullCaption(!showFullCaption)}>
            {showFullCaption ? ' less' : ' more'}
          </Text>
        )}
      </Text>

           {/* Location badge */}
           {post.location && (
  <Pressable
    onPress={() => navigation.navigate('Map', { location: post.location })}
    style={styles.locationBadge}
  >
    <Text style={styles.locationText}>📍 {post.location.name}</Text>
  </Pressable>
)}


      {/* Tag Modal */}
      <Modal
        visible={!!selectedTag}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedTag(null)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedTag?.brand}</Text>
            <Text style={styles.modalDetails}>Name: {selectedTag?.name}</Text>
            <Text style={styles.modalDetails}>Type: {selectedTag?.type}</Text>
            <Text style={styles.modalDetails}>Material: {selectedTag?.material}</Text>
            <Text style={styles.modalDetails}>Color: {selectedTag?.color}</Text>
            <Text style={styles.modalDetails}>Size: {selectedTag?.size}</Text>
            <Pressable onPress={() => setSelectedTag(null)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Comments Modal */}
      <Modal visible={commentModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10, width: '80%' }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Comments Coming Soon!</Text>
            <Pressable onPress={() => setCommentModalVisible(false)}>
              <Text style={{ color: 'blue', marginTop: 10 }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default PostCard;

// Your styles stay the same (no need to rewrite now)


const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    padding: 15,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  profilePic: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#83715D',
    marginRight: 8,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  outfitContainer: {
    backgroundColor: '#FFFFFF',
    height: 300,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
    position: 'relative',
  },
  outfitImage: {
    width: '100%',
    height: '100%',
  },
  tag: {
    position: 'absolute',
    backgroundColor: '#333',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  tagText: {
    color: 'white',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  actionText: {
    marginLeft: 4,
    marginRight: 12,
    fontSize: 14,
    color: '#333333',
  },
  commentIcon: {
    marginLeft: 12,
  },
  bookmarkIcon: {
    marginLeft: 'auto',
  },
  caption: {
    color: '#333333',
    fontSize: 14,
  },

  locationBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EAEAE9',
    borderRadius: 12,
    alignSelf: 'flex-start'
  },
  locationText: {
    fontSize: 14,
    color: '#333'
  },
  moreText: {
    color: '#83715D',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 10,
  },
  modalDetails: {
    fontSize: 14,
    marginBottom: 5,
  },
  closeButton: {
    marginTop: 15,
    backgroundColor: '#83715D',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
