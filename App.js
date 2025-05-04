// App.js

import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as Linking from 'expo-linking';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { auth } from './firebase';
import {
  applyActionCode,
  isSignInWithEmailLink,
  onAuthStateChanged,
} from 'firebase/auth';

import { PostsProvider } from './src/contexts/PostsContext';

import TopBar from './src/components/TopBar';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen   from './src/screens/LoginScreen';
import SignupScreen  from './src/screens/SignupScreen';
import HomePage      from './src/screens/HomePage';
import SearchPage    from './src/screens/SearchPage';
import UploadScreen  from './src/screens/UploadScreen';
import MapScreen     from './src/screens/MapScreen';
import UsersScreen   from './src/screens/UsersScreen';
import Settings      from './src/screens/Settings';
import MyAccount     from './src/screens/MyAccount';
import NotifSettings from './src/screens/NotifSettings';
import EditProfile   from './src/screens/EditProfile';
import NotificationScreen from './src/screens/NotificationScreen';
import FollowingNFollowers from './src/screens/FollowingNFollowers';

// <-- import the new detail screen
import OutfitDetailScreen from './src/screens/OutfitDetailScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

function BottomTabs() {
  const [username, setUsername] = useState('User');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUsername(user.displayName || user.email.split('@')[0]);
      }
    });
    return unsub;
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Upload') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'User') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6B8A81',
        tabBarInactiveTintColor: '#888888',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#EAEAE9',
          height: 60,
          paddingVertical: 5,
          elevation: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 4,
        },
        tabBarLabel: route.name === 'User' ? username : route.name,
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
  useEffect(() => {
    const handleDeepLink = ({ url }) => {
      if (isSignInWithEmailLink(auth, url)) {
        applyActionCode(auth, url)
          .then(() => Alert.alert('Verified!', 'Your email has been confirmed.'))
          .catch((err) => Alert.alert('Verification failed', err.message));
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then((url) => url && handleDeepLink({ url }));
    return () => subscription.remove();
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
            <Stack.Screen name="Login"     component={LoginScreen} />
            <Stack.Screen name="Signup"    component={SignupScreen} />
            <Stack.Screen
              name="HomePage"
              component={BottomTabs}
              options={{ headerShown: false }}
            />

            {/* Core profile & settings screens */}
            <Stack.Screen name="Settings"            component={Settings} />
            <Stack.Screen name="MyAccount"           component={MyAccount} />
            <Stack.Screen name="NotifSettings"       component={NotifSettings} />
            <Stack.Screen name="EditProfile"         component={EditProfile} />
            <Stack.Screen name="Notifications"       component={NotificationScreen} />
            <Stack.Screen
              name="FollowingNFollowers"
              component={FollowingNFollowers}
            />

            {/* <-- Register the Outfit Detail screen */}
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
