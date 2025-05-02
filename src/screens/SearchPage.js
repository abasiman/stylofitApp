// src/screens/SearchPage.js

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions
} from 'react-native';
import { usePosts } from '../contexts/PostsContext';

const { width } = Dimensions.get('window');
// Compute a 3-column square grid:
const CARD_MARGIN = 4;
const CARD_SIZE   = (width - CARD_MARGIN * 4) / 3;

export default function SearchPage({ navigation }) {
  const { posts } = usePosts();
  const [searchText,  setSearchText]  = useState('');
  const [activeTab,   setActiveTab]   = useState('Outfits');
  const [searchActive,setSearchActive]= useState(false);

  // Filter outfits by location name
  const filteredOutfits = posts.filter(post =>
    post.location?.name
      .toLowerCase()
      .includes(searchText.toLowerCase())
  );

  // (Optional) Filter users by username
  const filteredUsers = posts.filter(post =>
    post.userName?.toLowerCase().includes(searchText.toLowerCase())
  );

  function renderOutfitsGrid() {
    return (
      <View style={styles.grid}>
        {filteredOutfits.map(post => (
          <TouchableOpacity
            key={post.id}
            style={styles.card}
            onPress={() => navigation.navigate('PostDetail', { post })}
          >
            <Image
              source={{ uri: post.imageUrl }}
              style={styles.cardImage}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  function renderUsersList() {
    return (
      <View style={{ width: '100%' }}>
        {filteredUsers.map(post => (
          <View key={post.id} style={styles.userCard}>
            <Text style={styles.userIcon}>👤</Text>
            <Text style={styles.userName}>{post.userName}</Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>STYLoFiT</Text>

      {searchActive && (
        <TouchableOpacity onPress={() => {
          setSearchActive(false);
          setSearchText('');
        }} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
      )}

      <TextInput
        style={styles.searchBar}
        placeholder="Search by location…"
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
          <TouchableOpacity
            onPress={() => setActiveTab('Outfits')}
            style={[styles.tab, activeTab === 'Outfits' && styles.activeTab]}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'Outfits' && styles.activeTabText
            ]}>
              Outfits
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('Users')}
            style={[styles.tab, activeTab === 'Users' && styles.activeTab]}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'Users' && styles.activeTabText
            ]}>
              Users
            </Text>
          </TouchableOpacity>
        </View>
      )}

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
    alignItems: 'center',
  },
  title: {
    fontSize:   24,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#5a3e2b',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 24,
    color: '#5a3e2b',
  },
  searchBar: {
    width:            '90%',
    height:           40,
    borderColor:      '#ccc',
    borderWidth:      1,
    borderRadius:     20,
    paddingHorizontal:15,
    marginBottom:     20,
    backgroundColor:  '#f9f9f9',
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderColor: '##ccc',
    width: '100%',
  },
  tab: {
    paddingVertical:   8,
    paddingHorizontal:20,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderColor:      '#5a3e2b',
  },
  tabText: {
    fontSize:16,
    color:    '#888',
  },
  activeTabText: {
    color:      '#5a3e2b',
    fontWeight: 'bold',
  },

  // 3-column grid:
  grid: {
    width: '100%',
    flexDirection:  'row',
    flexWrap:       'wrap',
    justifyContent: 'flex-start',
  },
  card: {
    width:        CARD_SIZE,
    height:       CARD_SIZE,
    marginRight:  CARD_MARGIN,
    marginBottom: CARD_MARGIN,
    backgroundColor: '#fff',
    borderRadius:    8,
    overflow:        'hidden',
  },
  cardImage: {
    width:  '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  // user list styling:
  userCard: {
    flexDirection:   'row',
    alignItems:      'center',
    width:          '100%',
    padding:         10,
    borderBottomWidth: 1,
    borderColor:     '#eee',
    marginBottom:    5,
  },
  userIcon: {
    fontSize:    24,
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    color:    '#333',
  },
});
