/**
 * @format
 */

// Polyfill Buffer for Hermes (required by react-native-udp magic packet building)
import { Buffer } from "buffer";

global.Buffer = Buffer;

import { AppRegistry } from "react-native";
import App from "./app";
import { name as appName } from "./app.json";

AppRegistry.registerComponent(appName, () => App);
