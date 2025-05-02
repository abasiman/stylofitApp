// src/screens/MapScreen.js

import React, { useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function MapScreen({ route }) {
  const location = route.params?.location;
  const mapRef = useRef(null);

  // When location changes (i.e. on first mount after navigation),
  // animate the camera to that spot:
  useEffect(() => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude:      location.latitude,
          longitude:     location.longitude,
          latitudeDelta: 0.005,
          longitudeDelta:0.005,
        },
        1000 // duration in ms
      );
    }
  }, [location]);

  // Fallback region while we wait for animation:
  const initialRegion = {
    latitude:      location?.latitude  ??  37.78825,
    longitude:     location?.longitude ?? -122.4324,
    latitudeDelta: location ? 0.005 : 0.05,
    longitudeDelta:location ? 0.005 : 0.05,
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
      >
        {location && (
          <Marker
            coordinate={{
              latitude:  location.latitude,
              longitude: location.longitude,
            }}
            title={location.name}
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map:       { flex: 1 },
});
