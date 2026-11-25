import { Redirect } from "expo-router";
import { useStore } from "../src/store";

export default function Index() {
  const { profile } = useStore();
  return <Redirect href={profile ? "/(tabs)" : "/welcome"} />;
}
