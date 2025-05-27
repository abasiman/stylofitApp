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
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';

const { width } = Dimensions.get('window');
const NUM_COLUMNS = 2;
const CONTAINER_PADDING = 12;
const CARD_GAP = 8;
const CARD_SIZE = (width - (2 * CONTAINER_PADDING) - CARD_GAP) / NUM_COLUMNS;

export default function SearchPage() {
  const navigation = useNavigation();
  const { posts = [] } = usePosts(); 

  const [users, setUsers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('Outfits');
  const [searchActive, setSearchActive] = useState(false);

  // Debug function to check user document
  const checkUserDocument = async (searchTerm) => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('displayName', '>=', searchTerm), where('displayName', '<=', searchTerm + '\uf8ff'));
      const querySnapshot = await getDocs(q);
      
      console.log('Searching for users with term:', searchTerm);
      console.log('Found documents:', querySnapshot.size);
      
      querySnapshot.forEach(doc => {
        console.log('User document:', doc.id, doc.data());
      });
    } catch (error) {
      console.error('Error checking user document:', error);
    }
  };

  // Subscribe to all users
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'users'),
      snapshot => {
        const usersData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log('Loaded users:', usersData);
        setUsers(usersData);
      },
      err => console.error('Users listen error:', err)
    );
    return unsub;
  }, []);

  // Check user document when search is performed
  useEffect(() => {
    if (searchText && activeTab === 'Users') {
      checkUserDocument(searchText);
    }
  }, [searchText, activeTab]);

  // Filtered lists
  const normalized = searchText.toLowerCase();
  console.log('Search text:', normalized);

  const filteredOutfits = posts.filter(post =>
    post.location?.name?.toLowerCase().includes(normalized)
  );

  const filteredUsers = users.filter(u => {
    // Fields to search through
    const searchableFields = {
      displayName: u.displayName,
      username: u.username || u.displayName?.toLowerCase(), // Fallback to lowercase displayName
      bio: u.bio,
      email: u.email
    };

    // Remove null/undefined values
    Object.keys(searchableFields).forEach(key => {
      if (!searchableFields[key]) delete searchableFields[key];
    });

    console.log('Checking user:', u.displayName, 'Fields:', searchableFields);

    // Check each field
    return Object.values(searchableFields).some(field => {
      const fieldStr = String(field).toLowerCase();
      const match = fieldStr.includes(normalized);
      if (match) {
        console.log('Match found in field:', field);
      }
      return match;
    });
  });

  // Render the 2-column grid of outfits
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
          {user.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.userAvatar} />
          ) : (
            <View style={styles.userAvatarPlaceholder}>
              <Text style={styles.userAvatarText}>
                {(user.displayName || 'U')[0].toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.displayName}</Text>
            {user.bio && (
              <Text style={styles.userBio} numberOfLines={1}>
                {user.bio}
              </Text>
            )}
          </View>
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
        placeholder={activeTab === 'Users' ? "Search users..." : "Search outfits by location…"}
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
    padding: CONTAINER_PADDING,
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
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: CARD_GAP,
  },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  cardImage: {
    width:      '100%',
    height:     '100%',
    resizeMode: 'cover'
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff'
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15
  },
  userAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center'
  },
  userAvatarText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold'
  },
  userInfo: {
    flex: 1
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  userBio: {
    fontSize: 14,
    color: '#666',
    marginTop: 2
  },
  emptyText: {
    textAlign: 'center',
    color:     '#888',
    marginTop: 20,
    width:     '100%'
  }
});
