import React from "react";
import { Tabs } from "expo-router";
import { BottomNavigation } from "../../src/components/skeuomorphic";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomNavigation {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="stats" options={{ title: "Stats" }} />
      <Tabs.Screen name="add" options={{ title: "Add" }} />
      <Tabs.Screen name="targets" options={{ title: "Targets" }} />
      <Tabs.Screen name="more" options={{ title: "More" }} />
      <Tabs.Screen name="groups" options={{ href: null }} />
      <Tabs.Screen name="expenses" options={{ href: null }} />
      <Tabs.Screen name="personal" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}
