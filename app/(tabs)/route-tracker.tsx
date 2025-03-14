import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { getDistance } from 'geolib';
import React, { useEffect, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';

// Define the background task name
const BACKGROUND_TRACKING = 'background-location-task';

interface LocationPoint {
  latitude: number;
  longitude: number;
}

export default function RouteTrackerScreen() {
  const router = useRouter();
  const [tracking, setTracking] = useState<boolean>(false);
  const [route, setRoute] = useState<LocationPoint[]>([]);
  const [speed, setSpeed] = useState<number>(0);
  const [maxSpeed, setMaxSpeed] = useState<number>(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationPoint | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [totalDistance, setTotalDistance] = useState<number>(0);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      setCurrentLocation({ latitude, longitude });
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();
  }, []);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null | undefined;

    if (tracking) {
      setStartTime(new Date());
      (async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          alert('Permission to access location was denied');
          return;
        }

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            distanceInterval: 20, // Increase the distance interval to 20 meters
          },
          (location) => {
            const newPoint = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };

            // Filter out noisy data
            setRoute((prevRoute) => {
              if (prevRoute.length > 0) {
                const prevPoint = prevRoute[prevRoute.length - 1];
                const distance = getDistance(prevPoint, newPoint) / 1000;
                if (distance < 0.01) {
                  // Ignore updates with less than 10 meters difference
                  return prevRoute;
                }
                setTotalDistance((prevDistance) => prevDistance + distance);
              }
              return [...prevRoute, newPoint];
            });

            const currentSpeed = location.coords.speed ? location.coords.speed * 3.6 : 0;
            setSpeed(currentSpeed);

            // Filter out noisy speed data
            if (currentSpeed > 1) {
              // Ignore speeds less than 1 km/h as noise
              setMaxSpeed((prevMaxSpeed) => Math.max(prevMaxSpeed, currentSpeed));
            }

            setCurrentLocation(newPoint);
          }
        );

        // Start background tracking
        await Location.startLocationUpdatesAsync(BACKGROUND_TRACKING, {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 20, // Increase the distance interval to 20 meters
          deferredUpdatesInterval: 1000, // Send updates every second
          foregroundService: {
            notificationTitle: 'Your motorcycle ride is being tracked.',
            notificationBody: `${speed.toFixed(2)} km/h - ${totalDistance.toFixed(2)} km traveled`,
          },
        });
      })();
    } else {
      subscription?.remove();
      Location.stopLocationUpdatesAsync(BACKGROUND_TRACKING);
      if (startTime) {
        const endTime = new Date();
        const timeTaken = (endTime.getTime() - startTime.getTime()) / 1000; // in seconds
        const avgSpeed = totalDistance / (timeTaken / 3600); // in km/h

        // Navigate to the summary tab with the data
        router.push(
          `/(tabs)/last-ride?route=${JSON.stringify(
            route
          )}&maxSpeed=${maxSpeed}&avgSpeed=${avgSpeed}&totalDistance=${totalDistance}&timeTaken=${timeTaken}`
        );
      }
      // Reset state values
      setRoute([]);
      setSpeed(0);
      setMaxSpeed(0);
      setStartTime(null);
      setCurrentLocation(null);
      setTotalDistance(0);
    }

    return () => {
      subscription?.remove();
    };
  }, [tracking]);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={
          region || {
            latitude: 0,
            longitude: 0,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }
        }
        showsUserLocation
        followsUserLocation
        zoomEnabled
      >
        {route.length > 1 && <Polyline coordinates={route} strokeWidth={4} strokeColor='red' />}
        {currentLocation && <Marker coordinate={currentLocation} title='You' />}
      </MapView>

      <View style={styles.infoPanel}>
        <Text style={styles.text}>Speed: {speed.toFixed(2)} km/h</Text>
        <Text style={styles.text}>
          Time: {startTime ? `${((new Date().getTime() - startTime.getTime()) / 1000).toFixed(0)} sec` : '0 sec'}
        </Text>
        <Text style={styles.text}>Distance: {totalDistance.toFixed(2)} km</Text>
        <Button title={tracking ? 'Stop Tracking' : 'Start Tracking'} onPress={() => setTracking(!tracking)} />
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
