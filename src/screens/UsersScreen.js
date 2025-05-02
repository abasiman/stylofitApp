// src/screens/UsersScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { auth, db } from '../../firebase';           // adjust path if needed
import { onAuthStateChanged } from 'firebase/auth';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';

export default function UsersScreen() {
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [bio, setBio]           = useState(null);
  const [outfits, setOutfits]   = useState([]);

  useEffect(() => {
    let unsubscribeOutfits = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, user => {
      if (user) {
        setUsername(user.displayName || user.email.split('@')[0]);
        setEmail(user.email);

        // fetch bio
        const userDocRef = doc(db, 'users', user.uid);
        getDoc(userDocRef)
          .then(docSnap => {
            setBio(docSnap.exists() ? docSnap.data().bio ?? '' : '');
          })
          .catch(err => {
            console.error('Error loading bio:', err);
            setBio('');
          });

        // subscribe to outfits collection
        const q = query(
          collection(db, 'outfits'),
          where('userId', '==', user.uid)
        );
        unsubscribeOutfits = onSnapshot(
          q,
          snap => {
            const arr = snap.docs.map(d => ({
              id: d.id,
              ...d.data()
            }));
            setOutfits(arr);
          },
          err => console.error('Outfits listen error:', err)
        );
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeOutfits();
    };
  }, []);

  const goToEdit = () => navigation.getParent().navigate('EditProfile');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.topContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.logo}>STYLoFiT</Text>
          <Text style={styles.profileTitle}>PROFILE</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Icon name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.profileImage} />
      </View>

      <View style={styles.userInfoContainer}>
        <Text style={styles.userName}>{username}</Text>
        <Text style={styles.userEmail}>{email}</Text>

        {bio !== null && bio.trim() !== '' ? (
          <Text style={styles.userBio}>{bio}</Text>
        ) : (
          <TouchableOpacity onPress={goToEdit}>
            <Text style={[styles.userBio, styles.addBio]}>
              Add bio here
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.editButton} onPress={goToEdit}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      
<View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>29</Text>
          <Text style={styles.statLabel}>outfits</Text>
        </View>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('FollowingNFollowers', { type: 'followers' })
          }
        >
          <View style={styles.stat}>
            <Text style={styles.statNumber}>15.7k</Text>
            <Text style={styles.statLabel}>followers</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('FollowingNFollowers', { type: 'following' })
          }
        >
          <View style={styles.stat}>
            <Text style={styles.statNumber}>298</Text>
            <Text style={styles.statLabel}>following</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>30.2M</Text>
          <Text style={styles.statLabel}>likes</Text>
        </View>
      </View>

      <Text style={styles.myOutfitsTitle}>My Outfits</Text>

      <View style={styles.outfitsGrid}>
        {outfits.length > 0 ? (
          outfits.map(outfit => (
            <TouchableOpacity
              key={outfit.id}
              style={styles.outfitBox}
              onPress={() => {/* maybe view detail */}}
            >
              <Image
                source={{ uri: outfit.imageUrl }}
                style={styles.outfitImage}
              />
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noOutfitsText}>
            No outfits yet. Upload one!
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff' },
  topContainer: {
    backgroundColor: '#8C7661',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  profileTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  profileImage: {
    width: 120,
    height: 120,
    backgroundColor: '#ccc',
    borderRadius: 60,
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  userInfoContainer: {
    alignItems: 'center',
    padding: 15,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 20,
    marginVertical: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  userBio: {
    textAlign: 'center',
    color: '#555',
    paddingHorizontal: 20,
    fontSize: 13,
  },
  addBio: {
    color: '#8C7661',
    fontStyle: 'italic',
    textDecorationLine: 'underline',
  },
  editButton: {
    marginTop: 10,
    borderColor: '#8C7661',
    borderWidth: 1,
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 15,
  },
  editButtonText: {
    color: '#8C7661',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
    marginHorizontal: 20,
  },
  myOutfitsTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginVertical: 10,
    marginLeft: 20,
  },
  outfitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingBottom: 20,
  },
  outfitBox: {
    width: '45%',
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 10,
  },
  outfitImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  noOutfitsText: {
    width: '100%',
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
  },
});

