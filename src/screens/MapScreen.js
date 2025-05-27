import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');
const API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';

export default function MapScreen({ route }) {
  const passedLoc = route.params?.location;
  const mapRef = useRef(null);

  // 1) user location state
  const [userLoc, setUserLoc] = useState(null);
  // 2) marker state
  const [marker, setMarker] = useState(
    passedLoc
      ? {
          latitude: passedLoc.latitude,
          longitude: passedLoc.longitude,
          title: passedLoc.name,
        }
      : null
  );

  // animated ping value
  const pingAnim = useRef(new Animated.Value(0)).current;

  // pull user location once
  useEffect(() => {
    (async () => {
      let { coords } = await Location.getCurrentPositionAsync();
      setUserLoc({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
    })();
  }, []);

  // whenever passedLoc changes, drop marker, draw route, and fit camera
  useEffect(() => {
    if (!passedLoc || !mapRef.current) return;

    const dest = {
      latitude: passedLoc.latitude,
      longitude: passedLoc.longitude,
    };

    // animate camera
    mapRef.current.fitToCoordinates(
      [userLoc, dest].filter(Boolean),
      { edgePadding: { top: 80, bottom: 80, left: 40, right: 40 }, animated: true }
    );

    // start ping loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pingAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pingAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();

    // update marker
    setMarker({ ...dest, title: passedLoc.name });
  }, [passedLoc, userLoc]);

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      {/* ... your existing search & results code here ... */}

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: passedLoc?.latitude ?? 37.78825,
          longitude: passedLoc?.longitude ?? -122.4324,
          latitudeDelta: passedLoc ? 0.01 : 0.05,
          longitudeDelta: passedLoc ? 0.01 : 0.05,
        }}
      >
        {/* draw directions line */}
        {userLoc && marker && (
          <MapViewDirections
            origin={userLoc}
            destination={marker}
            apikey={API_KEY}
            strokeWidth={4}
            strokeColor="#83715D"
          />
        )}

        {/* user location marker (optional) */}
        {userLoc && (
          <Marker coordinate={userLoc}>
            <View style={styles.userPin}>
              <MaterialIcons name="my-location" size={24} color="#337ab7" />
            </View>
          </Marker>
        )}

        {/* store marker + ping */}
        {marker && (
          <Marker coordinate={marker}>
            <View style={styles.markerContainer}>
              <Animated.View
                style={[
                  styles.ping,
                  {
                    transform: [{ scale: pingAnim.interpolate({ inputRange:[0,1], outputRange:[0.3,2] }) }],
                    opacity: pingAnim.interpolate({ inputRange:[0,1], outputRange:[0.6,0] }),
                  },
                ]}
              />
              <View style={styles.pin} />
            </View>
          </Marker>
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  // store marker + ping
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ping: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(131,113,93,0.4)',
  },
  pin: {
    width: 16,
    height: 16,
    backgroundColor: '#83715D',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },

  // optional user-location pin
  userPin: {
    backgroundColor: 'rgba(51, 122, 183, 0.2)',
    borderRadius: 16,
    padding: 2,
  },
  searchBox:   {
    position:'absolute', top:Platform.OS==='ios'?60:40,
    left:20,right:20, backgroundColor:'#fff',
    flexDirection:'row', alignItems:'center',
    borderRadius:8, padding:8, elevation:3, zIndex:20,
  },
  searchInput: { flex:1, marginLeft:8 },
  suggestions: {
    position:'absolute', top:Platform.OS==='ios'?110:90,
    left:20,right:20, maxHeight:200,
    backgroundColor:'#fff', borderRadius:8, zIndex:19,
  },
  suggestItem:{ padding:10, borderBottomWidth:1, borderColor:'#eee' },
  hotspot:     {
    width:16, height:16, borderRadius:8,
    backgroundColor:'rgba(52,152,219,0.8)',
  },
  hotspotLabel:{ fontSize:12, color:'#333', marginTop:2, textAlign:'center' },
});
