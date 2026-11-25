import React, { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, StyleSheet, useWindowDimensions, View } from "react-native";
import Svg, { Ellipse } from "react-native-svg";
import { useTheme } from "../theme";

type Step = { key: string; x: number; y: number; rot: number; delay: number };

/** Ab und zu läuft eine ganz leichte Pfotenspur hinter den Kacheln durchs Bild */
export function Paws() {
  const { width: W, height: H } = useWindowDimensions();
  const t = useTheme();
  const [trail, setTrail] = useState<Step[]>([]);
  const [reduce, setReduce] = useState(false);
  useEffect(() => { AccessibilityInfo.isReduceMotionEnabled().then(setReduce); }, []);
  useEffect(() => {
    if (reduce) return;
    const make = () => {
      const x = Math.random() * W * 0.8 + W * 0.1, y = H + 20;
      const ang = ((-90 + (Math.random() * 50 - 25)) * Math.PI) / 180;
      const dx = Math.cos(ang) * 46, dy = Math.sin(ang) * 46, rot = (ang * 180) / Math.PI + 90, id = Date.now();
      setTrail(Array.from({ length: 16 }, (_, i) => {
        const side = i % 2 ? 1 : -1;
        return { key: `${id}-${i}`, x: x + dx * i + Math.cos(ang + Math.PI / 2) * side * 12, y: y + dy * i + Math.sin(ang + Math.PI / 2) * side * 12, rot, delay: i * 320 };
      }));
    };
    const a = setTimeout(make, 1500), b = setInterval(make, 11000);
    return () => { clearTimeout(a); clearInterval(b); };
  }, [W, H, reduce]);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {trail.map(s => <Paw key={s.key} {...s} color={t.paw} />)}
    </View>
  );
}
function Paw({ x, y, rot, delay, color }: Step & { color: string }) {
  const o = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([Animated.delay(delay), Animated.timing(o, { toValue: 1, duration: 600, useNativeDriver: true }), Animated.delay(3200), Animated.timing(o, { toValue: 0, duration: 1800, useNativeDriver: true })]).start();
  }, []);
  return (
    <Animated.View style={{ position: "absolute", left: x, top: y, opacity: o, transform: [{ rotate: `${rot}deg` }] }}>
      <Svg width={22} height={22} viewBox="0 0 40 40" fill={color}>
        <Ellipse cx={20} cy={27} rx={9} ry={8} /><Ellipse cx={9} cy={17} rx={4} ry={5} /><Ellipse cx={31} cy={17} rx={4} ry={5} /><Ellipse cx={15} cy={9} rx={3.6} ry={4.6} /><Ellipse cx={25} cy={9} rx={3.6} ry={4.6} />
      </Svg>
    </Animated.View>
  );
}
