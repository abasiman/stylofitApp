import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';

const dummyData = Array(7).fill({ name: 'drake' });

const FollowingNFollowers = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { type } = route.params; // 'followers' or 'following'
  const [activeTab, setActiveTab] = useState(type);

  return (
    <View style={styles.container}>

      <View style={styles.tabContainer}>
        <TouchableOpacity onPress={() => setActiveTab('following')}>
          <Text style={[styles.tab, activeTab === 'following' && styles.activeTab]}>
            Following
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('followers')}>
          <Text style={[styles.tab, activeTab === 'followers' && styles.activeTab]}>
            Followers
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={dummyData}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.userRow}>
            <Icon name="person-circle-outline" size={40} color="#ccc" style={styles.avatar} />
            <Text style={styles.username}>{item.name}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  backBtn: { padding: 15 },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  tab: {
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: 'normal',
    color: '#000',
  },
  activeTab: {
    fontWeight: 'bold',
    borderBottomWidth: 2,
    borderColor: '#000',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ccc',
    marginRight: 15,
  },
  username: {
    fontSize: 16,
  },
});

export default FollowingNFollowers;
