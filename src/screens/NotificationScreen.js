// src/screens/NotificationScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const notifications = [
  { id: 1, user: 'raihanzafuldi', action: 'commented on your post.', time: '7m ago' },
  { id: 2, user: 'sirtyroneraphaeljosephvargas', action: 'commented on your post.', time: '7m ago' },
  { id: 3, user: 'abas', action: 'commented on your post.', time: '12h ago' },
  { id: 4, user: 'eliza.oakman', action: 'followed you.', time: '14h ago' },
  { id: 5, user: 'jess', action: 'liked your post.', time: '21h ago' },
  { id: 6, user: 'coolname', action: 'liked your post.', time: '21h ago' },
  { id: 7, user: 'girlypophere2', action: 'followed you.', time: '5y ago' },
  { id: 8, user: 'girlypophere20998', action: 'followed you.', time: '5y ago' },
];

export default function NotificationScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      <ScrollView>
      {notifications.map((notif) => (
  <View key={notif.id} style={styles.card}>
    <FontAwesome name="user-circle" size={24} color="#333" />
    <View style={styles.textContainer}>
      <Text style={styles.text}>
        <Text style={styles.username}>{notif.user}</Text> {notif.action}
      </Text>
      <Text style={styles.time}>{notif.time}</Text>
    </View>

    {/* Show checkbox only if not a "followed you" notification */}
    {!notif.action.includes('followed you') && (
      <Pressable style={styles.checkbox} />
    )}
  </View>
))}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  textContainer: { flex: 1, marginLeft: 10 },
  text: { fontSize: 16 },
  username: { fontWeight: 'bold' },
  time: { fontSize: 12, color: '#888', marginTop: 2 },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 4,
  },
});
