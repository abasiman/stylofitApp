// App.js

// Must come first (before any navigators)
import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
enableScreens();

import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as Linking from 'expo-linking';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator }  from '@react-navigation/native-stack';
import { createBottomTabNavigator }    from '@react-navigation/bottom-tabs';
import {
  SafeAreaProvider,
  useSafeAreaInsets
} from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { auth } from './firebase';
import {
  applyActionCode,
  isSignInWithEmailLink,
  onAuthStateChanged
} from 'firebase/auth';

import { PostsProvider } from './src/contexts/PostsContext';

import TopBar                from './src/components/TopBar';
import WelcomeScreen         from './src/screens/WelcomeScreen';
import LoginScreen           from './src/screens/LoginScreen';
import SignupScreen          from './src/screens/SignupScreen';
import HomePage              from './src/screens/HomePage';
import SearchPage            from './src/screens/SearchPage';
import UploadScreen          from './src/screens/UploadScreen';
import MapScreen             from './src/screens/MapScreen';
import UsersScreen           from './src/screens/UsersScreen';
import Settings              from './src/screens/Settings';
import MyAccount             from './src/screens/MyAccount';
import NotifSettings         from './src/screens/NotifSettings';
import EditProfile           from './src/screens/EditProfile';
import NotificationScreen    from './src/screens/NotificationScreen';
import OutfitDetailScreen    from './src/screens/OutfitDetailScreen';

// <-- NEW IMPORT: your real followers/following list screen
import FollowingNFollowersScreen from './src/screens/FollowingNFollowersScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

function BottomTabs() {
  const [username, setUsername] = useState('User');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      if (user) {
        setUsername(user.displayName || user.email.split('@')[0]);
      }
    });
    return unsub;
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        // Tab icons
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Home:   focused ? 'home'   : 'home-outline',
            Search: focused ? 'search' : 'search-outline',
            Upload: focused ? 'add-circle' : 'add-circle-outline',
            Map:    focused ? 'map'    : 'map-outline',
            User:   focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },

        // Colors & labels
        tabBarActiveTintColor:   '#6B8A81',
        tabBarInactiveTintColor: '#888888',
        tabBarLabel:
          route.name === 'User' ? username : route.name,
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: insets.bottom ? insets.bottom / 2 : 4,
        },

        // Safe-area–aware tab bar
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor:  '#EAEAE9',
          height:          60 + insets.bottom,
          paddingBottom:   insets.bottom || 5,
          paddingTop:      5,
          elevation:       5,
        },
      })}
    >
      <Tab.Screen name="Home"   component={HomePage} />
      <Tab.Screen name="Search" component={SearchPage} />
      <Tab.Screen name="Upload" component={UploadScreen} />
      <Tab.Screen name="Map"    component={MapScreen} />
      <Tab.Screen name="User"   component={UsersScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  // Deep-link handler for email verification
  useEffect(() => {
    const handleDeepLink = ({ url }) => {
      if (isSignInWithEmailLink(auth, url)) {
        applyActionCode(auth, url)
          .then(() => Alert.alert('Verified!', 'Your email has been confirmed.'))
          .catch(err => Alert.alert('Verification failed', err.message));
      }
    };

    const sub = Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then(url => url && handleDeepLink({ url }));
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <PostsProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Welcome"
            screenOptions={({ navigation }) => ({
              header: () => <TopBar navigation={navigation} />,
            })}
          >
            <Stack.Screen
              name="Welcome"
              component={WelcomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="Login"    component={LoginScreen} />
            <Stack.Screen name="Signup"   component={SignupScreen} />
            <Stack.Screen
              name="HomePage"
              component={BottomTabs}
              options={{ headerShown: false }}
            />

            {/* Profile & Settings */}
            <Stack.Screen name="Settings"          component={Settings} />
            <Stack.Screen name="MyAccount"         component={MyAccount} />
            <Stack.Screen name="NotifSettings"     component={NotifSettings} />
            <Stack.Screen name="EditProfile"       component={EditProfile} />
            <Stack.Screen name="Notifications"     component={NotificationScreen} />

            {/* <-- INSERTED: Following/Followers list */}
            <Stack.Screen
              name="FollowingNFollowers"
              component={FollowingNFollowersScreen}
              options={({ route }) => ({
                title:
                  route.params?.type === 'followers'
                    ? 'Followers'
                    : 'Following'
              })}
            />

            {/* Outfit detail */}
            <Stack.Screen
              name="OutfitDetail"
              component={OutfitDetailScreen}
              options={{ title: 'Outfit Details' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PostsProvider>
    </SafeAreaProvider>
  );
}
