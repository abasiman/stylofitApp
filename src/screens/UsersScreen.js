// src/screens/UsersScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Pressable
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { auth, db } from '../../firebase';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { usePosts } from '../contexts/PostsContext';

export default function UsersScreen() {
  const nav         = useNavigation();
  const route       = useRoute();
  const me          = auth.currentUser;
  const profileUid  = route.params?.userId || me.uid;
  const isMe        = profileUid === me.uid;
  const { followUser, unfollowUser } = usePosts();

  // local state
  const [userData, setUserData]       = useState({ displayName: null, bio: '', photoURL: null });
  const [outfits,   setOutfits]       = useState([]);
  const [followers, setFollowers]     = useState([]);
  const [following, setFollowing]     = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);

  // 1️⃣ Load profile doc
  useEffect(() => {
    const ref = doc(db, 'users', profileUid);
    getDoc(ref)
      .then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          setUserData({
            displayName: data.displayName || (isMe ? me.displayName : 'Unknown'),
            bio:         data.bio         || '',
            photoURL:    data.photoURL    || null
          });
        } else if (isMe) {
          setUserData({ displayName: me.displayName, bio: '', photoURL: null });
        } else {
          setUserData({ displayName: 'Unknown', bio: '', photoURL: null });
        }
      })
      .catch(err => {
        console.error('Error loading profile:', err);
        setUserData({
          displayName: isMe ? me.displayName : 'Unknown',
          bio:         '',
          photoURL:    null
        });
      });
  }, [profileUid]);

  // 2️⃣ Subscribe to outfits
  useEffect(() => {
    const q = query(
      collection(db, 'outfits'),
      where('userId', '==', profileUid)
    );
    const unsub = onSnapshot(q, snap =>
      setOutfits(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, [profileUid]);

  // 3️⃣ Subscribe to followers & following
  useEffect(() => {
    const unsubF = onSnapshot(
      collection(db, 'users', profileUid, 'followers'),
      snap => setFollowers(snap.docs.map(d => d.id))
    );
    const unsubG = onSnapshot(
      collection(db, 'users', profileUid, 'following'),
      snap => setFollowing(snap.docs.map(d => d.id))
    );
    return () => { unsubF(); unsubG(); };
  }, [profileUid]);

  // 4️⃣ Track if I follow them
  useEffect(() => {
    if (isMe) return;
    const likeRef = doc(db, 'users', profileUid, 'followers', me.uid);
    const unsub = onSnapshot(likeRef, snap => setIsFollowing(snap.exists()));
    return unsub;
  }, [profileUid]);

  // 5️⃣ Compute total likes across outfits
  const totalLikes = outfits.reduce((sum, o) => sum + (o.likesCount || 0), 0);

  // 6️⃣ Handler for Follow/Unfollow
  const onToggleFollow = () => {
    if (isFollowing) unfollowUser(profileUid);
    else             followUser(profileUid);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.topContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.logo}>STYLoFiT</Text>
          <Text style={styles.title}>PROFILE</Text>
          <TouchableOpacity onPress={() => nav.navigate('Settings')}>
            <Icon name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.profileImage}>
          {userData.photoURL && (
            <Image source={{ uri: userData.photoURL }} style={styles.profileImage} />
          )}
        </View>
      </View>

      {/* User Info */}
      <View style={styles.userInfo}>
        <Text style={styles.username}>{userData.displayName}</Text>
        {userData.bio ? (
          <Text style={styles.bio}>{userData.bio}</Text>
        ) : isMe ? (
          <Pressable onPress={() => nav.getParent().navigate('EditProfile')}>
            <Text style={[styles.bio, styles.addBio]}>Add bio</Text>
          </Pressable>
        ) : null}

        {isMe ? (
          <Pressable
            style={styles.editBtn}
            onPress={() => nav.getParent().navigate('EditProfile')}
          >
            <Text style={styles.editText}>Edit Profile</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.followBtn, isFollowing && styles.following]}
            onPress={onToggleFollow}
          >
            <Text style={[styles.followText, isFollowing && styles.followingText]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{outfits.length}</Text>
          <Text style={styles.statLabel}>outfits</Text>
        </View>
        <Pressable
          style={styles.statItem}
          onPress={() => nav.navigate('FollowingNFollowers', {
            type: 'followers',
            userId: profileUid
          })}
        >
          <Text style={styles.statNumber}>{followers.length}</Text>
          <Text style={styles.statLabel}>followers</Text>
        </Pressable>
        <Pressable
          style={styles.statItem}
          onPress={() => nav.navigate('FollowingNFollowers', {
            type: 'following',
            userId: profileUid
          })}
        >
          <Text style={styles.statNumber}>{following.length}</Text>
          <Text style={styles.statLabel}>following</Text>
        </Pressable>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalLikes}</Text>
          <Text style={styles.statLabel}>likes</Text>
        </View>
      </View>

      {/* Outfits Grid */}
      <Text style={styles.sectionTitle}>My Outfits</Text>
      <View style={styles.grid}>
        {outfits.length > 0 ? (
          outfits.map(o => (
            <Pressable
              key={o.id}
              style={styles.outfitBox}
              onPress={() => nav.navigate('OutfitDetail', { outfitId: o.id })}
            >
              <Image source={{ uri: o.imageUrl }} style={styles.outfitImage} />
            </Pressable>
          ))
        ) : (
          <Text style={styles.emptyText}>No outfits yet.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#fff' },
  topContainer: { backgroundColor: '#8C7661', padding: 20 },
  headerRow: {
    flexDirection: 'row',
    alignItems:    'center',
    justifyContent:'space-between'
  },
  logo:  { color: '#fff', fontSize: 16, fontWeight: '700' },
  title: {
    position: 'absolute', left: 0, right: 0,
    textAlign: 'center', color: '#fff', fontSize: 15, fontWeight: '500'
  },
  profileImage: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#ccc', alignSelf: 'center',
    marginTop: 20, marginBottom: 20
  },
  userInfo: { alignItems: 'center', paddingHorizontal: 20 },
  username: { fontSize: 20, fontWeight: 'bold' },
  bio:      { textAlign: 'center', color: '#555', fontSize: 13, marginBottom: 12 },
  addBio:   { color: '#8C7661', fontStyle: 'italic', textDecorationLine: 'underline' },
  editBtn: {
    borderColor: '#8C7661', borderWidth: 1,
    borderRadius: 5, paddingHorizontal: 15, paddingVertical: 6
  },
  editText: { color: '#8C7661', fontWeight: '600' },
  followBtn: {
    backgroundColor: '#8C7661',
    borderRadius:    5, paddingHorizontal: 20, paddingVertical: 8
  },
  following: {
    backgroundColor: '#fff',
    borderWidth:     1, borderColor: '#8C7661'
  },
  followText:    { color: '#fff', fontWeight: '600' },
  followingText: { color: '#8C7661' },

  stats: {
    flexDirection:   'row',
    justifyContent:  'space-around',
    paddingVertical: 20,
    borderTopWidth:  1,
    borderBottomWidth: 1,
    borderColor:     '#eee',
    marginHorizontal:20
  },
  statItem:  { alignItems: 'center' },
  statNumber:{ fontWeight: 'bold', fontSize: 16 },
  statLabel: { fontSize: 12, color: '#666' },

  sectionTitle: { fontSize: 16, fontWeight: 'bold', margin: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' },
  outfitBox: {
    width: '45%', aspectRatio: 1,
    borderRadius:10, overflow: 'hidden', marginBottom: 20
  },
  outfitImage:{ width: '100%', height: '100%', resizeMode: 'cover' },
  emptyText:  { textAlign: 'center', color: '#888', width: '100%' }
});
