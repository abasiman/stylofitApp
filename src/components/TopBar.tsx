// src/components/TopBar.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TopBar({ navigation }) {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#6B8A81"
        translucent={false}
      />
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons
            name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          StyloFit
        </Text>
        <View style={styles.rightSpacer} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#6B8A81',
    width: '100%',
  },
  headerContainer: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: { padding: 8 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  rightSpacer: { width: 32 },
});
