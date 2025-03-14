import { Link } from "expo-router";
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function TabsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Welcome to the Route Tracker</Text>
      <Text style={styles.text}>
        This is a simple app that allows you to track your motorcycle rides.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { fontSize: 24, fontWeight: "bold" },
    text: { fontSize: 18, margin: 20, textAlign: "center" },
});
