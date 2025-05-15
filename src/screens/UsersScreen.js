// src/screens/UsersScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Pressable,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { auth, db } from '../../firebase';
import {
  doc,
  getDoc,
  collection,
  onSnapshot,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { usePosts } from '../contexts/PostsContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function UsersScreen() {
  const nav   = useNavigation();
  const route = useRoute();
  const me    = auth.currentUser;
  const {
    posts,
    followUser,
    unfollowUser,
    deletePost
  } = usePosts();

  // reset User tab to yourself
  useEffect(() => {
    const unsub = nav.addListener('tabPress', () => {
      nav.setParams({ userId: me.uid });
    });
    return unsub;
  }, [nav, me.uid]);

  // determine whose profile we're on
  const profileUid = route.params?.userId || me.uid;
  const isMe       = profileUid === me.uid;

  // profile info
  const [userData, setUserData] = useState({
    displayName: '',
    bio:         '',
    photoURL:    null
  });

  // followers/following lists
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);

  // total likes across all outfits
  const [totalLikes, setTotalLikes] = useState(0);

  // load profile doc
  useEffect(() => {
    getDoc(doc(db, 'users', profileUid))
      .then(snap => {
        if (snap.exists()) {
          const d = snap.data();
          setUserData({
            displayName: d.displayName || (isMe ? me.displayName : 'Unknown'),
            bio:         d.bio         || '',
            photoURL:    d.photoURL    || null
          });
        } else {
          setUserData({
            displayName: isMe ? me.displayName : 'Unknown',
            bio:         '',
            photoURL:    null
          });
        }
      })
      .catch(console.error);
  }, [profileUid, isMe, me.displayName]);

  // subscribe followers/following ids
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

  // track if I follow them
  useEffect(() => {
    if (isMe) return;
    const ref = doc(db, 'users', profileUid, 'followers', me.uid);
    const unsub = onSnapshot(ref, snap => setIsFollowing(snap.exists()));
    return () => unsub();
  }, [profileUid, isMe, me.uid]);

  // filter outfits from context
  const userOutfits = posts.filter(p => p.userId === profileUid);

  // recalculate totalLikes by counting actual subcollection sizes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let sum = 0;
      for (const o of userOutfits) {
        const likesSnap = await getDocs(
          collection(db, 'outfits', o.id, 'likes')
        );
        sum += likesSnap.size;
      }
      if (!cancelled) setTotalLikes(sum);
    })();
    return () => { cancelled = true; };
  }, [userOutfits]);

  // follow/unfollow handler
  const onToggleFollow = () => {
    if (isFollowing) unfollowUser(profileUid);
    else             followUser(profileUid);
  };

  // delete handler
  const onDelete = outfitId => {
    Alert.alert(
      'Delete outfit?',
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePost(outfitId);
            } catch (err) {
              console.error(err);
              Alert.alert('Error', err.message);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={styles.container}>

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
              <Image
                source={{ uri: userData.photoURL }}
                style={styles.profileImage}
              />
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
                {isFollowing ? 'Following' : '+ Follow'}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userOutfits.length}</Text>
            <Text style={styles.statLabel}>outfits</Text>
          </View>
          <Pressable
            style={styles.statItem}
            onPress={() =>
              nav.navigate('FollowingNFollowers', {
                type:   'followers',
                userId: profileUid
              })
            }
          >
            <Text style={styles.statNumber}>{followers.length}</Text>
            <Text style={styles.statLabel}>followers</Text>
          </Pressable>
          <Pressable
            style={styles.statItem}
            onPress={() =>
              nav.navigate('FollowingNFollowers', {
                type:   'following',
                userId: profileUid
              })
            }
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
          {userOutfits.length > 0 ? (
            userOutfits.map(o => (
              <View key={o.id} style={styles.outfitWrapper}>
                <Pressable
                  style={styles.outfitBox}
                  onPress={() =>
                    nav.navigate('OutfitDetail', { outfitId: o.id })
                  }
                >
                  <Image
                    source={{ uri: o.imageUrl }}
                    style={styles.outfitImage}
                  />
                </Pressable>
                {isMe && (
                  <Pressable
                    style={styles.deleteIcon}
                    onPress={() => onDelete(o.id)}
                  >
                    <Icon name="trash-outline" size={24} color="red" />
                  </Pressable>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No outfits yet.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { backgroundColor: '#fff' },
  topContainer: { backgroundColor: '#8C7661', padding: 20 },
  headerRow:    {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between'
  },
  logo:         { color: '#fff', fontSize: 16, fontWeight: '700' },
  title:        {
    position:   'absolute',
    left:       0,
    right:      0,
    textAlign:  'center',
    color:      '#fff',
    fontSize:   15,
    fontWeight: '500'
  },
  profileImage: {
    width:         120,
    height:        120,
    borderRadius:  60,
    backgroundColor:'#ccc',
    alignSelf:     'center',
    marginTop:     20,
    marginBottom:  20
  },
  userInfo:     { alignItems: 'center', paddingHorizontal: 20 },
  username:     { fontSize: 20, fontWeight: 'bold' },
  bio:          { textAlign: 'center', color: '#555', fontSize: 13, marginBottom: 12 },
  addBio:       { color: '#8C7661', fontStyle: 'italic', textDecorationLine: 'underline' },
  editBtn:      {
    borderColor:    '#8C7661',
    borderWidth:     1,
    borderRadius:    5,
    paddingHorizontal:15,
    paddingVertical:  6
  },
  editText:     { color: '#8C7661', fontWeight: '600' },
  followBtn:    {
    backgroundColor: '#8C7661',
    borderRadius:     5,
    paddingHorizontal:20,
    paddingVertical:   8
  },
  following:    {
    backgroundColor: '#fff',
    borderWidth:     1,
    borderColor:     '#8C7661'
  },
  followText:   { color: '#fff', fontWeight: '600' },
  followingText:{ color: '#8C7661' },
  stats:        {
    flexDirection:    'row',
    justifyContent:   'space-around',
    paddingVertical:  20,
    borderTopWidth:   1,
    borderBottomWidth:1,
    borderColor:      '#eee',
    marginHorizontal: 20
  },
  statItem:     { alignItems: 'center' },
  statNumber:   { fontWeight: 'bold', fontSize: 16 },
  statLabel:    { fontSize: 12, color: '#666' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', margin: 20 },
  grid:         {
    flexDirection: 'row',
    flexWrap:      'wrap',
    justifyContent:'space-around'
  },
  outfitWrapper:{
    position:      'relative',
    width:         '45%',
    aspectRatio:   1,
    marginBottom: 20
  },
  outfitBox:    {
    width: '100%',
    height:'100%',
    borderRadius:10,
    overflow: 'hidden'
  },
  outfitImage:  { width: '100%', height: '100%', resizeMode: 'cover' },
  deleteIcon:   {
    position:        'absolute',
    top:             8,
    right:           8,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius:    12,
    padding:         4
  },
  emptyText:    { textAlign: 'center', color: '#888', width: '100%' },
});
