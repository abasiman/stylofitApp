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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

interface TopBarProps {
  navigation: any;
}

export default function TopBar({ navigation }: TopBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safeArea, { paddingTop: insets.top }]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="#6B8A81"
        translucent={false}
      />
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  rightSpacer: {
    width: 32,
  },
});
