// src/screens/MapScreen.js
import React, { useRef, useEffect, useState } from 'react';
import {
  View, TextInput, FlatList, TouchableOpacity, Text,
  StyleSheet, Dimensions, Platform, Animated, Easing,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');
const GOOGLE_PLACES_AUTOCOMPLETE =
  'https://maps.googleapis.com/maps/api/place/autocomplete/json';
const GOOGLE_PLACES_DETAILS =
  'https://maps.googleapis.com/maps/api/place/details/json';
const API_KEY = 'AIzaSyDr58Oav5MSVkFRLOJLbHIUb9M4m0NKVhc';  // ← your key

export default function MapScreen({ route }) {
  const passedLoc = route.params?.location;
  const mapRef     = useRef(null);
  const [region, setRegion] = useState({
    latitude:      passedLoc?.latitude  ?? 37.78825,
    longitude:     passedLoc?.longitude ?? -122.4324,
    latitudeDelta: passedLoc ? 0.01 : 0.05,
    longitudeDelta:passedLoc ? 0.01 : 0.05,
  });

  // search bar
  const [query, setQuery]           = useState('');
  const [results, setResults]       = useState([]);
  const searchTimeout                = useRef(null);

  // marker drop animation
  const dropAnim = useRef(new Animated.Value(0)).current;
  const [marker,   setMarker]        = useState(passedLoc ? {
    latitude:  passedLoc.latitude,
    longitude: passedLoc.longitude,
    title:     passedLoc.name,
  } : null);

  // optional hotspots (static example)
  const HOTSPOTS = [
    { id:'h1', title:'Hotspot A', latitude:37.7895, longitude:-122.4313 },
    { id:'h2', title:'Hotspot B', latitude:37.7870, longitude:-122.4330 },
  ];

  // center on passed location on mount
  useEffect(() => {
    if (passedLoc && mapRef.current) animateTo(passedLoc);
  }, [passedLoc]);

  function animateMarkerDrop() {
    dropAnim.setValue(-50);
    Animated.spring(dropAnim, {
      toValue: 0,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }

  function animateTo({ latitude, longitude }) {
    mapRef.current.animateToRegion(
      { latitude, longitude, latitudeDelta:0.01, longitudeDelta:0.01 },
      1000
    );
    animateMarkerDrop();
  }

  // debounced search
  useEffect(() => {
    clearTimeout(searchTimeout.current);
    if (query.length < 2) return setResults([]);

    searchTimeout.current = setTimeout(async () => {
      const loc = await Location.getCurrentPositionAsync();
      const qs = [
        `input=${encodeURIComponent(query)}`,
        `key=${API_KEY}`,
        `location=${loc.coords.latitude},${loc.coords.longitude}`,
        'radius=50000',
        'types=establishment',
      ].join('&');

      try {
        const res = await fetch(`${GOOGLE_PLACES_AUTOCOMPLETE}?${qs}`);
        const js  = await res.json();
        setResults(js.status==='OK' ? js.predictions : []);
      } catch {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout.current);
  }, [query]);

  const onSelect = async place_id => {
    // fetch details for coords
    try {
      const res = await fetch(
        `${GOOGLE_PLACES_DETAILS}?place_id=${place_id}&key=${API_KEY}`
      );
      const js  = await res.json();
      if (js.status==='OK') {
        const { lat, lng } = js.result.geometry.location;
        const title       = js.result.name;
        const newLoc      = { latitude:lat, longitude:lng, title };
        setMarker(newLoc);
        animateTo(newLoc);
        setQuery(''); setResults([]);
      }
    } catch {}
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBox}>
        <MaterialIcons name="search" size={20} color="#333" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search stores or address…"
          value={query}
          onChangeText={setQuery}
        />
      </View>
      {results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={i=>i.place_id}
          style={styles.suggestions}
          keyboardShouldPersistTaps="handled"
          renderItem={({item})=>(
            <TouchableOpacity
              style={styles.suggestItem}
              onPress={()=>onSelect(item.place_id)}
            >
              <Text>{item.description}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
      >
        {/* Main marker */}
        {marker && (
          <Marker coordinate={marker}>
            <Animated.View style={{ transform:[{ translateY: dropAnim }] }}>
              <View style={styles.pin}/>
            </Animated.View>
          </Marker>
        )}

        {/* Hotspots */}
        {HOTSPOTS.map(h => (
          <Marker
            key={h.id}
            coordinate={{ latitude:h.latitude, longitude:h.longitude }}
          >
            <View style={styles.hotspot}/>
            <Text style={styles.hotspotLabel}>{h.title}</Text>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex:1 },
  map:         { flex:1 },
  pin:         {
    width:24, height:24,
    backgroundColor:'#e74c3c',
    borderRadius:12,
    borderWidth:2, borderColor:'#fff',
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
