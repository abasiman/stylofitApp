import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function NotifSettings() {
  const navigation = useNavigation();

  const [settings, setSettings] = useState({
    likes: true,
    comments: true,
    followers: true,
    mentions: true,
  });

  const toggleSwitch = (key) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} /> {/* to balance back icon */}
      </View>

      <View style={styles.box}>
        {['likes', 'comments', 'followers', 'mentions', 'new post'].map((type, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.label}>
              {type === 'likes' && 'Likes'}
              {type === 'comments' && 'Comments'}
              {type === 'followers' && 'New Followers'}
              {type === 'mentions' && 'Mentions & tags'}
              {type === 'new post' && 'New post'}
            </Text>
            <Switch
              value={settings[type]}
              onValueChange={() => toggleSwitch(type)}
              trackColor={{ false: '#ccc', true: '#4f7263' }}
              thumbColor="#eee"
            />
          </View>
        ))}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7F6952', // brown background
    padding: 20,
    justifyContent: 'flex-start',
  },
  header: {
    marginTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    marginVertical: 20,
    marginLeft: 5,
  },
  box: {
    backgroundColor: '#D3CEC5', // beige card
    borderRadius: 10,
    padding: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    marginTop: 20, // <-- Add this line
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3B3B3B',
  },
});
