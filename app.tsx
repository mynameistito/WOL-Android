import { StatusBar } from "react-native";
import WakeOnLanScreen from "./src/screens/wake-on-lan-screen";

export default function App() {
  return (
    <>
      <StatusBar backgroundColor="#111111" barStyle="light-content" />
      <WakeOnLanScreen />
    </>
  );
}
