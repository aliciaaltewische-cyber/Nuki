import { Inter_300Light, Inter_400Regular, Inter_500Medium, useFonts } from "@expo-google-fonts/inter";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StoreProvider, useStore } from "../src/store";
import { useTheme } from "../src/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fonts] = useFonts({ Inter_300Light, Inter_400Regular, Inter_500Medium });
  return (
    <SafeAreaProvider>
      <StoreProvider><Gate fonts={fonts} /></StoreProvider>
    </SafeAreaProvider>
  );
}

function Gate({ fonts }: { fonts: boolean }) {
  const { ready } = useStore();
  const t = useTheme();
  useEffect(() => { if (fonts && ready) SplashScreen.hideAsync().catch(() => {}); }, [fonts, ready]);
  if (!fonts || !ready) return null;
  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bg } }}>
        <Stack.Screen name="post/edit" options={{ presentation: "modal" }} />
        <Stack.Screen name="add-place" options={{ presentation: "modal" }} />
      </Stack>
    </>
  );
}
