import React, { useLayoutEffect } from "react";
import { View, Text, StyleSheet, Button, TouchableOpacity, Alert } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useNavigation } from "expo-router";
import { useSearchParams } from "expo-router/build/hooks";
import { FontAwesome } from "@expo/vector-icons";

export default function RouteDetailsScreen() {
    const navigation = useNavigation();
    const [searchParams] = useSearchParams();
    const timestamp = searchParams[1];
    
    const [route, setRoute] = useState<any>(null);

    const loadRoute = async () => {
      try {
        const savedRoutes = await AsyncStorage.getItem("routes");
        if (savedRoutes) {
          const routes = JSON.parse(savedRoutes);
          const currentRoute = routes.find((r: any) => r.timestamp === timestamp);
          setRoute(currentRoute);
        }
      } catch (error) {
        console.error("Error loading route:", error);
      }
    };

    const deleteRoute = async () => {
      try {
        const savedRoutes = await AsyncStorage.getItem("routes");
        if (savedRoutes) {
          let routes = JSON.parse(savedRoutes);
          routes = routes.filter((r: any) => r.timestamp !== timestamp); // Remove the current route
          await AsyncStorage.setItem("routes", JSON.stringify(routes));
          Alert.alert("Deleted", "The ride has been deleted.");
          navigation.goBack(); // Navigate back after deletion
        }
      } catch (error) {
        console.error("Error deleting route:", error);
      }
    };

    useLayoutEffect(() => {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity onPress={deleteRoute}>
            <FontAwesome name="trash" size={20} color="red" style={{ marginRight: 15 }} />
          </TouchableOpacity>
        ),
      });
    }, [navigation, deleteRoute]);

  useEffect(() => {
    loadRoute();
  }, [timestamp]);

  if (!route) {
    return <Text>Loading...</Text>;
  }

  const { maxSpeed, avgSpeed, totalDistance, timeTaken, route: coordinates } = route;

  // Define the initial region of the map
  const initialRegion = {
    latitude: coordinates[0].latitude,
    longitude: coordinates[0].longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={initialRegion}>
        <Polyline coordinates={coordinates} strokeWidth={4} strokeColor="blue" />
        <Marker coordinate={coordinates[0]} title="Start" description="Start point" pinColor="green" />
        <Marker coordinate={coordinates[coordinates.length - 1]} title="End" description="End point" pinColor="red" />
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
        <Button title="Back to Logs" onPress={() => router.push("/(tabs)/ride-logs")} />
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
  text: { fontSize: 16, fontWeight: "bold", marginBottom: 5 },
});
