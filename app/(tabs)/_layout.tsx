import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import React from 'react';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabBarIcon name='home' color={color} />,
        }}
      />
      <Tabs.Screen
        name='route-tracker'
        options={{
          title: 'Route Tracker',
          tabBarIcon: ({ color }) => <TabBarIcon name='map' color={color} />,
        }}
      />
      <Tabs.Screen
        name='last-ride'
        options={{
          title: 'Last Ride',
          tabBarIcon: ({ color }) => <TabBarIcon name='list' color={color} />,
        }}
      />
      <Tabs.Screen
        name='ride-logs'
        options={{
          title: 'Logs',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name='history' color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
