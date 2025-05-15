// src/screens/FollowingNFollowersScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../../firebase';

export default function FollowingNFollowersScreen() {
  const { params }   = useRoute();
  const { type, userId } = params;        // 'followers' or 'following'
  const nav          = useNavigation();

  const [list,    setList]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const colRef = collection(db, 'users', userId, type);
    const unsub  = onSnapshot(colRef, async snap => {
      const uids = snap.docs.map(d => d.id);
      const usersWithLikes = await Promise.all(
        uids.map(async uid => {
          // fetch their profile
          const profileSnap = await getDoc(doc(db, 'users', uid));
          const profile     = profileSnap.exists() ? profileSnap.data() : {};
          const displayName =
            profile.displayName ||
            profile.username    ||
            uid.substring(0,6);
          const photoURL = profile.photoURL || null;

          // sum their likes
          const outfitsSnap = await getDocs(
            query(collection(db, 'outfits'), where('userId','==',uid))
          );
          let totalLikes = 0;
          outfitsSnap.forEach(oDoc => {
            totalLikes += oDoc.data().likesCount||0;
          });

          return { uid, displayName, photoURL, totalLikes };
        })
      );
      setList(usersWithLikes);
      setLoading(false);
    });
    return () => unsub();
  }, [type, userId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#83715D" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={list}
        keyExtractor={item => item.uid}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() =>
              // Navigate into the Tab navigator's "User" tab,
              // passing along the selected userId
              nav.navigate('HomePage', {
                screen: 'User',
                params: { userId: item.uid }
              })
            }
          >
            {item.photoURL ? (
              <Image source={{ uri: item.photoURL }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.initial}>
                  {item.displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.info}>
              <Text style={styles.name}>{item.displayName}</Text>
              <Text style={styles.stats}>{item.totalLikes} likes</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>
              {type === 'followers'
                ? 'No followers yet.'
                : 'Not following anyone.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  row:       {
    flexDirection: 'row',
    alignItems:    'center',
    padding:       12,
    borderBottomWidth: 1,
    borderColor:       '#eee'
  },
  avatar:    { width: 48, height: 48, borderRadius: 24, backgroundColor: '#ccc' },
  avatarPlaceholder: {
    width:      48,
    height:     48,
    borderRadius: 24,
    backgroundColor:'#ccc',
    justifyContent:'center',
    alignItems:    'center'
  },
  initial:   { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  info:      { marginLeft: 12 },
  name:      { fontSize: 16, fontWeight: '500' },
  stats:     { fontSize: 14, color: '#666', marginTop: 2 },
  emptyText: { color: '#666', fontSize: 14 }
});
