// src/screens/HomePage.js
import React, { useState , useEffect} from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import PostCard from '../components/PostCard';
import { usePosts } from '../contexts/PostsContext';


export default function HomePage({ navigation, route }) {
  const [activeTab, setActiveTab] = useState('Home');
  const showHeader = !(route?.params?.hideHeader);
//   const [posts, setPosts] = useState([]);
  const { posts } = usePosts();

  
//   useEffect(() => {
//     if (route.params?.newPost) {
//       setPosts((prevPosts) => [route.params.newPost, ...prevPosts]);
//     }
//   }, [route.params?.newPost]);

  const handleTabPress = (tabName) => {
    setActiveTab(tabName);
    // Example navigation (You can replace this with your actual screens)
    navigation.navigate('UsersScreen');
  };  

//   const getIconColor = (tabName) => (activeTab === tabName ? 'black' : 'grey');

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>STYLoFiT</Text>
        <FontAwesome name="bell" size={24} color="white" onPress={() => navigation.navigate('Notifications')} />
      </View>

      <ScrollView contentContainerStyle={styles.feed}>

      {posts.length === 0 ? (
    <Text>No posts yet. Upload an outfit!</Text>
  ) : (
    posts.map((post, index) => (
      <PostCard key={index} post={post} index={index} />
    ))
  )}
  
    
      </ScrollView>

      
    </View>
  );
}


const COLORS = {
  primary: '#83715D',
  light: '#EAEAE9',
  white: '#FFFFFF',
  grey: '#F5F5F5',
  textDark: '#333333',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: 24,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  feed: {
    padding: 10,
    paddingBottom: 80, // leave space for navbar
  },
  card: {
    backgroundColor: COLORS.grey,
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
    backgroundColor: COLORS.primary,
    marginRight: 8,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  moreIcon: {
    marginLeft: 10,
  },
  outfitContainer: {
    backgroundColor: COLORS.white,
    height: 200,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  outfitText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: COLORS.textDark,
  },
  tag: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: COLORS.textDark,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  bottomTag: {
    bottom: 10,
    right: 10,
    top: 'auto',
    left: 'auto',
  },
  tagText: {
    color: COLORS.white,
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
    color: COLORS.textDark,
  },
  commentIcon: {
    marginLeft: 12,
  },
  bookmarkIcon: {
    marginLeft: 'auto',
  },
  caption: {
    color: COLORS.textDark,
    fontSize: 14,
  },
  moreText: {
    color: COLORS.primary,
  },
  navbar: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopColor: COLORS.grey,
    borderTopWidth: 1,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    marginTop: 2,
    color: COLORS.textDark,
  },
});
