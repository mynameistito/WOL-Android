import { StatusBar } from "react-native";
import WakeOnLanScreen from "@/screens/wake-on-lan-screen.tsx";

export default function App() {
  return (
    <>
      <StatusBar backgroundColor="#111111" barStyle="light-content" />
      <WakeOnLanScreen />
    </>
  );
}
