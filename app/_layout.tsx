import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            contentStyle: {
              backgroundColor: "#f3f7fb",
            },
            headerStyle: {
              backgroundColor: "#0f172a",
            },
            headerTintColor: "#ffffff",
            headerTitleStyle: {
              fontWeight: "800",
            },
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="preview"
            options={{
              title: "Slip Preview",
            }}
          />
          <Stack.Screen
            name="+not-found"
            options={{
              title: "Not found",
            }}
          />
        </Stack>
        <StatusBar style="light" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
