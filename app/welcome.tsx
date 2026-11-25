import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Scene } from "../src/components/Scene";
import { T } from "../src/components/ui";

export default function Welcome() {
  const r = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: "#1c1d17" }}>
      <Scene t="peak" colors={["#9a9a86", "#55584a", "#1c1d17"]} id="sp" />
      <LinearGradient colors={["rgba(17,17,14,0)", "rgba(17,17,14,0.88)"]} locations={[0.35, 0.8]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1, justifyContent: "flex-end", alignItems: "center", padding: 28 }}>
        <Image source={require("../assets/logo-white.png")} style={{ width: 240, height: 114, marginBottom: 30 }} resizeMode="contain" />
        <T style={{ color: "#f1efe8", fontSize: 11, letterSpacing: 4, opacity: 0.75, marginBottom: 14 }}>MÜNCHEN · ALPEN · SEEN</T>
        <T style={{ color: "#f1efe8", fontSize: 36, lineHeight: 42, textAlign: "center" }}>Jeder Ort.{"\n"}Klar für deinen Hund.</T>
        <T style={{ color: "#f1efe8", opacity: 0.8, marginTop: 10, marginBottom: 30, fontSize: 15 }}>Wo darf dein Hund mit – und wo nicht.</T>
        <Pressable onPress={() => r.push("/onboarding")} style={{ borderWidth: 1, borderColor: "rgba(241,239,232,0.6)", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 999, paddingHorizontal: 34, height: 52, justifyContent: "center" }}>
          <T w="reg" style={{ color: "#f1efe8" }}>Los geht's</T>
        </Pressable>
        <T style={{ color: "#f1efe8", opacity: 0.55, fontSize: 11, marginTop: 18 }}>Geprüft von Hundebesitzern, für Hundebesitzer.</T>
      </SafeAreaView>
    </View>
  );
}
