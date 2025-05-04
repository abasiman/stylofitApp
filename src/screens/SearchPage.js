// src/screens/SearchPage.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Pressable
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePosts } from '../contexts/PostsContext';
import { db } from '../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 4;
const CARD_SIZE   = (width - CARD_MARGIN * 4) / 3;

export default function SearchPage() {
  const navigation = useNavigation();
  const { posts } = usePosts();

  const [users, setUsers]           = useState([]);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab]   = useState('Outfits');
  const [searchActive, setSearchActive] = useState(false);

  // Subscribe to all users
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'users'),
      snapshot => {
        setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      err => console.error('Users listen error:', err)
    );
    return unsub;
  }, []);

  // Filtered lists
  const normalized = searchText.toLowerCase();
  const filteredOutfits = posts.filter(post =>
    post.location?.name?.toLowerCase().includes(normalized)
  );
  const filteredUsers = users.filter(u =>
    u.displayName?.toLowerCase().includes(normalized)
  );

  // Render the 3-column grid of outfits
  const renderOutfitsGrid = () => (
    <View style={styles.grid}>
      {filteredOutfits.map(post => (
        <TouchableOpacity
          key={post.id}
          style={styles.card}
          onPress={() => navigation.navigate('OutfitDetail', { outfitId: post.id })}
        >
          <Image source={{ uri: post.imageUrl }} style={styles.cardImage} />
        </TouchableOpacity>
      ))}
      {filteredOutfits.length === 0 && (
        <Text style={styles.emptyText}>No outfits found.</Text>
      )}
    </View>
  );

  // Render the vertical list of users
  const renderUsersList = () => (
    <View style={{ width: '100%' }}>
      {filteredUsers.map(user => (
        <Pressable
          key={user.id}
          style={styles.userCard}
          onPress={() => navigation.navigate('User', { userId: user.id })}
        >
          <Text style={styles.userIcon}>👤</Text>
          <Text style={styles.userName}>{user.displayName}</Text>
        </Pressable>
      ))}
      {filteredUsers.length === 0 && (
        <Text style={styles.emptyText}>No users found.</Text>
      )}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>STYLoFiT</Text>

      {searchActive && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            setSearchActive(false);
            setSearchText('');
          }}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
      )}

      <TextInput
        style={styles.searchBar}
        placeholder="Search outfits by location…"
        placeholderTextColor="#999"
        value={searchText}
        onChangeText={text => {
          setSearchActive(true);
          setSearchText(text);
        }}
        onFocus={() => setSearchActive(true)}
      />

      {searchActive && (
        <View style={styles.tabs}>
          {['Outfits','Users'].map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
            >
              <Text
                style={[styles.tabText, activeTab === tab && styles.activeTabText]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Show results */}
      {searchActive
        ? (activeTab === 'Outfits' ? renderOutfitsGrid() : renderUsersList())
        : renderOutfitsGrid()
      }
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#fff',
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#5a3e2b'
  },
  backButton: {
    alignSelf:   'flex-start',
    marginBottom: 10
  },
  backButtonText: {
    fontSize: 24,
    color:   '#5a3e2b'
  },
  searchBar: {
    width:            '90%',
    height:           40,
    borderColor:      '#ccc',
    borderWidth:      1,
    borderRadius:     20,
    paddingHorizontal:15,
    marginBottom:     20,
    backgroundColor:  '#f9f9f9'
  },
  tabs: {
    flexDirection:   'row',
    justifyContent:  'center',
    marginBottom:    10,
    borderBottomWidth:1,
    borderColor:     '#ccc',
    width:           '100%'
  },
  tab: {
    paddingVertical:   8,
    paddingHorizontal: 20
  },
  activeTab: {
    borderBottomWidth: 2,
    borderColor:      '#5a3e2b'
  },
  tabText: {
    fontSize: 16,
    color:    '#888'
  },
  activeTabText: {
    color:      '#5a3e2b',
    fontWeight: 'bold'
  },
  grid: {
    width:           '100%',
    flexDirection:   'row',
    flexWrap:        'wrap',
    justifyContent:  'flex-start'
  },
  card: {
    width:         CARD_SIZE,
    height:        CARD_SIZE,
    marginRight:   CARD_MARGIN,
    marginBottom:  CARD_MARGIN,
    backgroundColor: '#fff',
    borderRadius:    8,
    overflow:        'hidden'
  },
  cardImage: {
    width:      '100%',
    height:     '100%',
    resizeMode: 'cover'
  },
  userCard: {
    flexDirection:   'row',
    alignItems:      'center',
    width:           '100%',
    padding:         10,
    borderBottomWidth:1,
    borderColor:     '#eee'
  },
  userIcon: {
    fontSize:    24,
    marginRight: 10
  },
  userName: {
    fontSize: 16,
    color:    '#333'
  },
  emptyText: {
    textAlign: 'center',
    color:     '#888',
    marginTop: 20,
    width:     '100%'
  }
});
