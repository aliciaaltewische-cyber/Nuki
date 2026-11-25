import * as ImagePicker from "expo-image-picker";
import React from "react";
import { Pressable, ScrollView } from "react-native";
import { useTheme } from "../theme";
import { BREEDS } from "./DogSticker";
import { Icon } from "./Icon";
import { Avatar, T } from "./ui";

export function AvatarPicker({ value, onChange }: { value: { avatar?: string; photo?: string }; onChange: (v: { avatar?: string; photo?: string }) => void }) {
  const t = useTheme();
  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!res.canceled) onChange({ avatar: value.avatar, photo: res.assets[0].uri });
  };
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
      <Pressable onPress={pick} style={{ width: 78, height: 78, borderRadius: 22, borderWidth: value.photo ? 2 : 1, borderColor: value.photo ? t.ink : t.line, backgroundColor: t.card, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {value.photo ? <Avatar photo={value.photo} size={78} /> : <><Icon name="cam" color={t.mut} /><T style={{ fontSize: 12, color: t.mut }}>Foto</T></>}
      </Pressable>
      {Object.keys(BREEDS).map(k => {
        const on = !value.photo && value.avatar === k;
        return (
          <Pressable key={k} onPress={() => onChange({ avatar: k, photo: undefined })} accessibilityLabel={BREEDS[k][0]} style={{ width: 78, height: 78, borderRadius: 22, borderWidth: on ? 2 : 1, borderColor: on ? t.ink : t.line, backgroundColor: t.card, alignItems: "center", justifyContent: "center" }}>
            <Avatar breed={k} size={66} />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

