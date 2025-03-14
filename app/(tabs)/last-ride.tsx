import { router } from "expo-router";
import { useSearchParams } from "expo-router/build/hooks";
import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LastRideScreen() {
  const searchParams = useSearchParams();
  const route = searchParams.get("route");
  const maxSpeed = searchParams.get("maxSpeed");
  const avgSpeed = searchParams.get("avgSpeed");
  const totalDistance = searchParams.get("totalDistance");
  const timeTaken = searchParams.get("timeTaken");

  const parsedRoute = route ? JSON.parse(route as string) : [];

  if (parsedRoute.length === 0) {
    return (
      <View style={styles.container}>
        <Text>No route data available.</Text>
      </View>
    );
  }

  let initialPoint = parsedRoute[0];
  let lastPoint = parsedRoute[parsedRoute.length - 1];

  const minLat = Math.min(...parsedRoute.map((point: { latitude: number }) => point.latitude));
  const maxLat = Math.max(...parsedRoute.map((point: { latitude: number }) => point.latitude));
  const minLng = Math.min(...parsedRoute.map((point: { longitude: number }) => point.longitude));
  const maxLng = Math.max(...parsedRoute.map((point: { longitude: number }) => point.longitude));

  const latitudeDelta = maxLat - minLat + 0.05;
  const longitudeDelta = maxLng - minLng + 0.05;

  const region = {
    latitude: (maxLat + minLat) / 2,
    longitude: (maxLng + minLng) / 2,
    latitudeDelta,
    longitudeDelta,
  };

  // Save the route data to AsyncStorage
  const saveRoute = async () => {
    try {
      const existingRoutes = await AsyncStorage.getItem("routes");
      const routes = existingRoutes ? JSON.parse(existingRoutes) : [];
      const newRoute = {
        route: parsedRoute,
        maxSpeed,
        avgSpeed,
        totalDistance,
        timeTaken,
        timestamp: new Date().toISOString(),
      };
      routes.push(newRoute);
      await AsyncStorage.setItem("routes", JSON.stringify(routes));
      router.push("/(tabs)/ride-logs"); // Navigate to the Logs tab after saving
    } catch (error) {
      console.error("Error saving route:", error);
    }
  };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={region}>
        {parsedRoute.length > 1 && (
          <Polyline coordinates={parsedRoute} strokeWidth={4} strokeColor="blue" />
        )}

        {initialPoint && (
          <Marker coordinate={initialPoint} title="Start" description="Route start point" pinColor="green" />
        )}
        {lastPoint && (
          <Marker coordinate={lastPoint} title="End" description="Route end point" pinColor="red" />
        )}
      </MapView>

      <View style={styles.infoPanel}>
        <Text style={styles.text}>Max Speed: {Number(maxSpeed).toFixed(2)} km/h</Text>
        <Text style={styles.text}>Average Speed: {Number(avgSpeed).toFixed(2)} km/h</Text>
        <Text style={styles.text}>
          Total Distance: {Number(totalDistance) < 1 ? `${(Number(totalDistance) * 1000).toFixed(2)} meters` : `${Number(totalDistance).toFixed(2)} km`}
        </Text>
        <Text style={styles.text}>
          Time Taken: {Math.floor(Number(timeTaken) / 60)} min{" "}
          {Math.floor(Number(timeTaken) % 60)} sec
        </Text>
        <Button title="Save Route" onPress={saveRoute} />
        <Button title="Back to Tracking" onPress={() => router.push("/(tabs)/route-tracker")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  infoPanel: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 10,
    zIndex: 1,
  },
  text: { fontSize: 18, fontWeight: "bold", marginBottom: 5 },
});
