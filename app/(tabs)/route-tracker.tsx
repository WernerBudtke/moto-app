import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { getDistance } from 'geolib';
import React, { useEffect, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';

// Define the background task name
const BACKGROUND_TRACKING = 'background-location-task';

// Configuration constants
const DISTANCE_INTERVAL = 1; // meters
const DEFERRED_UPDATES_INTERVAL = 1000; // milliseconds
const MIN_DISTANCE_DIFFERENCE = 0.001; // kilometers
const MIN_SPEED_THRESHOLD = 0.25; // km/h
const LATITUDE_DELTA = 0.01;
const LONGITUDE_DELTA = 0.01;

interface LocationPoint {
  latitude: number;
  longitude: number;
}

interface TrackerState {
  tracking: boolean;
  route: LocationPoint[];
  speed: number;
  maxSpeed: number;
  startTime: Date | null;
  currentLocation: LocationPoint | null;
  region: Region | null;
  totalDistance: number;
}

export default function RouteTrackerScreen() {
  const router = useRouter();
  const [state, setState] = useState<TrackerState>({
    tracking: false,
    route: [],
    speed: 0,
    maxSpeed: 0,
    startTime: null,
    currentLocation: null,
    region: null,
    totalDistance: 0,
  });

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      setState((prevState) => ({
        ...prevState,
        currentLocation: { latitude, longitude },
        region: {
          latitude,
          longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        },
      }));
    })();
  }, []);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null | undefined;

    if (state.tracking) {
      setState((prevState) => ({
        ...prevState,
        startTime: new Date(),
      }));

      (async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          alert('Permission to access location was denied');
          return;
        }

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            distanceInterval: DISTANCE_INTERVAL,
          },
          (location) => {
            const newPoint = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };

            setState((prevState) => {
              const prevRoute = prevState.route;
              const prevDistance = prevState.totalDistance;
              const prevMaxSpeed = prevState.maxSpeed;

              let newRoute = [...prevRoute];
              let newDistance = prevDistance;
              let newMaxSpeed = prevMaxSpeed;

              if (prevRoute.length > 0) {
                const prevPoint = prevRoute[prevRoute.length - 1];
                const distance = getDistance(prevPoint, newPoint) / 1000;
                if (distance >= MIN_DISTANCE_DIFFERENCE) {
                  newRoute = [...prevRoute, newPoint];
                  newDistance += distance;
                }
              } else {
                newRoute = [newPoint];
              }

              const currentSpeed = location.coords.speed ? location.coords.speed * 3.6 : 0;
              if (currentSpeed > MIN_SPEED_THRESHOLD) {
                newMaxSpeed = Math.max(prevMaxSpeed, currentSpeed);
              }

              return {
                ...prevState,
                route: newRoute,
                totalDistance: newDistance,
                speed: currentSpeed,
                maxSpeed: newMaxSpeed,
                currentLocation: newPoint,
              };
            });
          }
        );

        // Start background tracking
        await Location.startLocationUpdatesAsync(BACKGROUND_TRACKING, {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: DISTANCE_INTERVAL,
          deferredUpdatesInterval: DEFERRED_UPDATES_INTERVAL,
          foregroundService: {
            notificationTitle: 'Your motorcycle ride is being tracked.',
            notificationBody: `${state.speed.toFixed(2)} km/h - ${state.totalDistance.toFixed(2)} km traveled`,
          },
        });
      })();
    } else {
      subscription?.remove();
      Location.stopLocationUpdatesAsync(BACKGROUND_TRACKING);
      if (state.startTime) {
        const endTime = new Date();
        const timeTaken = (endTime.getTime() - state.startTime.getTime()) / 1000; // in seconds
        const avgSpeed = state.totalDistance / (timeTaken / 3600); // in km/h

        // Navigate to the summary tab with the data
        router.push(
          `/(tabs)/last-ride?route=${JSON.stringify(state.route)}&maxSpeed=${
            state.maxSpeed
          }&avgSpeed=${avgSpeed}&totalDistance=${state.totalDistance}&timeTaken=${timeTaken}`
        );
      }
      // Reset state values
      setState({
        tracking: false,
        route: [],
        speed: 0,
        maxSpeed: 0,
        startTime: null,
        currentLocation: null,
        region: null,
        totalDistance: 0,
      });
    }

    return () => {
      subscription?.remove();
    };
  }, [state.tracking]);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={
          state.region || {
            latitude: 0,
            longitude: 0,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          }
        }
        showsUserLocation
        followsUserLocation
        zoomEnabled
      >
        {state.route.length > 1 && <Polyline coordinates={state.route} strokeWidth={4} strokeColor='red' />}
        {state.currentLocation && <Marker coordinate={state.currentLocation} title='You' />}
      </MapView>

      <View style={styles.infoPanel}>
        <Text style={styles.text}>Speed: {state.speed.toFixed(2)} km/h</Text>
        <Text style={styles.text}>
          Time:{' '}
          {state.startTime ? `${((new Date().getTime() - state.startTime.getTime()) / 1000).toFixed(0)} sec` : '0 sec'}
        </Text>
        <Text style={styles.text}>Distance: {state.totalDistance.toFixed(2)} km</Text>
        <Button
          title={state.tracking ? 'Stop Tracking' : 'Start Tracking'}
          onPress={() => setState((prevState) => ({ ...prevState, tracking: !prevState.tracking }))}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  infoPanel: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
  },
  text: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
});
