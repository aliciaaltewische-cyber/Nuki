import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import React from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "../../src/components/Icon";
import { useTheme } from "../../src/theme";

const ICONS: Record<string, [string, string]> = { index: ["home", "Start"], map: ["map", "Karte"], community: ["comm", "Community"], events: ["cal", "Events"], profile: ["user", "Profil"] };

export default function TabsLayout() {
  const t = useTheme();
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={({ state, navigation }) => <Bar state={state} navigation={navigation} />}>
      <Tabs.Screen name="index" /><Tabs.Screen name="map" /><Tabs.Screen name="community" /><Tabs.Screen name="events" /><Tabs.Screen name="profile" />
    </Tabs>
  );
  function Bar({ state, navigation }: any) {
    const ins = useSafeAreaInsets();
    return (
      <View style={{ position: "absolute", left: 14, right: 14, bottom: Math.max(ins.bottom, 12), borderRadius: 999, overflow: "hidden", borderWidth: 1, borderColor: t.line, shadowColor: "#14140a", shadowOpacity: 0.12, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } }}>
        <BlurView intensity={40} tint="default" style={{ flexDirection: "row", padding: 6, backgroundColor: t.card + "dd" }}>
          {state.routes.map((route: any, i: number) => {
            const on = state.index === i; const [ic, label] = ICONS[route.name] || ["home", route.name];
            return (
              <Pressable key={route.key} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: on }}
                onPress={() => { const e = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true }); if (!on && !e.defaultPrevented) navigation.navigate(route.name); }}
                style={{ flex: 1, height: 50, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: on ? t.ink : "transparent" }}>
                <Icon name={ic} color={on ? t.bg : t.mut} />
              </Pressable>
            );
          })}
        </BlurView>
      </View>
    );
  }
}
