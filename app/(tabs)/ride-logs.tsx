import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, Button, FlatList, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useFocusEffect } from "expo-router";

export default function LogsScreen() {
  const [routes, setRoutes] = useState<any[]>([]);
  
  // Load saved routes from AsyncStorage
  const loadRoutes = useCallback(async () => {
    try {
      const savedRoutes = await AsyncStorage.getItem("routes");
      if (savedRoutes) {
        setRoutes(JSON.parse(savedRoutes));
      }
    } catch (error) {
      console.error("Error loading routes:", error);
    }
  }, []);

  useFocusEffect(() => {
    loadRoutes();
  });

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.routeItem}
      onPress={() => router.push(`/ride-logs/${item.timestamp}`)} // Navigate to route details screen
    >
      <Text style={styles.routeText}>Date: {new Date(item.timestamp).toLocaleString()}</Text>
      <Text style={styles.routeText}>Distance: {item.totalDistance} km</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Ride Logs</Text>
      {routes.length === 0 ? (
        <Text>No rides saved yet.</Text>
      ) : (
        <FlatList
          data={routes}
          renderItem={renderItem}
          keyExtractor={(item: any) => item.timestamp}
        />
      )}
      <Button title="Back to Tracker" onPress={() => router.push("/(tabs)/route-tracker")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  routeItem: { marginBottom: 15, padding: 10, backgroundColor: "#a19c9c", borderRadius: 5 },
  routeText: { fontSize: 16, marginVertical: 2 },
});
