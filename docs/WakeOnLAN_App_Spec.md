# Wake on LAN — Android App Spec

**Framework:** React Native CLI (bare, no Expo)  
**Target:** Android only  
**Scope:** Single saved device, local WiFi network

---

## 1. Background: How Wake on LAN Works

Wake on LAN (WoL) wakes a sleeping/powered-off PC by sending a **Magic Packet** over UDP to the local network.

### What is a Magic Packet?

A Magic Packet is a UDP broadcast containing:

- 6 bytes of `0xFF` (hex)
- The target machine's **MAC address** repeated **16 times**

Total size: 6 + (6 × 16) = **102 bytes**

It is sent to the **broadcast address** on **UDP port 9** (sometimes port 7).

### Fields the user must provide:

| Field                 | Example             | Required?          | Why                                |
| --------------------- | ------------------- | ------------------ | ---------------------------------- |
| **MAC Address**       | `AA:BB:CC:DD:EE:FF` | ✅ Yes             | Used to build the magic packet     |
| **Broadcast Address** | `192.168.1.255`     | ✅ Yes             | UDP destination (subnet broadcast) |
| **Port**              | `9`                 | ✅ Yes (default 9) | UDP port                           |
| **Device Name**       | `Gaming PC`         | Optional           | Display label only                 |
| **IP Address**        | `192.168.1.100`     | Optional           | For ping/status check only         |

> **Broadcast Address tip:** If your router is `192.168.1.1`, the broadcast is `192.168.1.255`.  
> You can also use the global broadcast `255.255.255.255` — works on most home networks.

---

## 2. Prerequisites — Software to Install

Install these **in order** on your Windows PC before starting.

### 2.1 Node.js (LTS)

- Download from: https://nodejs.org (choose LTS)
- Verify: `node -v` and `npm -v` in terminal

### 2.2 Java Development Kit (JDK 17)

- Required by Android build tools
- Download: https://adoptium.net (Temurin 17 LTS)
- After install, set `JAVA_HOME` environment variable:
  - Windows key → "Edit the system environment variables"
  - New system variable: `JAVA_HOME` = `C:\Program Files\Eclipse Adoptium\jdk-17.x.x.x-hotspot`

### 2.3 Android Studio

- Download: https://developer.android.com/studio
- During setup, ensure these are checked:
  - ✅ Android SDK
  - ✅ Android SDK Platform
  - ✅ Android Virtual Device (AVD)
- After install, open SDK Manager → SDK Platforms → install **Android 14 (API 34)**
- SDK Tools tab → install:
  - ✅ Android SDK Build-Tools 34
  - ✅ Android SDK Platform-Tools
  - ✅ Android Emulator

### 2.4 Set ANDROID_HOME environment variable

- Variable name: `ANDROID_HOME`
- Value: `C:\Users\mynameistito\AppData\Local\Android\Sdk`
- Also add to `Path`:
  - `%ANDROID_HOME%\platform-tools`
  - `%ANDROID_HOME%\tools`

### 2.5 React Native CLI

```bash
npm install -g react-native-cli
```

### 2.6 Verify setup

```bash
npx react-native doctor
```

All items should be green before proceeding.

---

## 3. Project Setup Instructions (for Claude Code)

> Tell Claude Code to follow these steps to bootstrap the project.

```bash
# 1. Create the project
npx @react-native-community/cli init WakeOnLan --version latest

# 2. Navigate into project
cd WakeOnLan

# 3. Install required packages
npm install react-native-udp
npm install @react-native-async-storage/async-storage
npm install react-native-vector-icons

# 4. Link native modules (auto-linking handles most, but run pod install if iOS ever needed)
# For Android, auto-linking is sufficient.

# 5. Run on device/emulator
npx react-native run-android
```

---

## 4. App Architecture

### Single Screen Layout

The app has **one screen only**. No navigation library needed.

```
┌─────────────────────────────┐
│        Wake on LAN          │  ← App title / header
├─────────────────────────────┤
│  Device Name    [input]     │
│  MAC Address    [input]     │
│  Broadcast IP   [input]     │
│  Port           [input]     │
│  IP Address     [input]     │  ← optional, for status ping
├─────────────────────────────┤
│        [WAKE UP]            │  ← Big primary button
├─────────────────────────────┤
│  Status: ● Sent / ✗ Error   │  ← Feedback area
└─────────────────────────────┘
```

---

## 5. Functional Specification

### 5.1 Device Configuration Form

- All fields are text inputs
- Fields are pre-populated from saved AsyncStorage values on app launch
- Saving happens automatically when the user taps "Wake Up" (or via a separate Save button)
- MAC address input should:
  - Accept formats: `AA:BB:CC:DD:EE:FF` or `AA-BB-CC-DD-EE-FF` or `AABBCCDDEEFF`
  - Normalize to `AA:BB:CC:DD:EE:FF` internally before use
  - Show validation error if format is invalid

### 5.2 Send Wake on LAN Packet

When user taps **Wake Up**:

1. Validate MAC address format — show inline error if invalid
2. Build magic packet (see Section 6)
3. Open a UDP socket
4. Send the packet to `{broadcastAddress}:{port}` via UDP broadcast
5. Close the socket
6. Show success or error status message below the button

### 5.3 Persistence

- Use `@react-native-async-storage/async-storage`
- Storage key: `@wol_device_config`
- Save all 5 fields as a JSON object
- Load on app mount via `useEffect`

### 5.4 Status Feedback

- Show a status row below the Wake button:
  - **Idle:** no message
  - **Sending:** spinner / "Sending magic packet…"
  - **Success:** green indicator + "Magic packet sent!"
  - **Error:** red indicator + error message (e.g., "Invalid MAC address" or "Network error")
- Status auto-clears after 5 seconds

---

## 6. Magic Packet Construction

```javascript
function buildMagicPacket(macAddress) {
  // Normalize MAC — strip separators
  const mac = macAddress.replace(/[:\-]/g, '');

  if (mac.length !== 12 || !/^[0-9A-Fa-f]+$/.test(mac)) {
    throw new Error('Invalid MAC address');
  }

  // Convert MAC to byte array
  const macBytes = [];
  for (let i = 0; i < 12; i += 2) {
    macBytes.push(parseInt(mac.substring(i, i + 2), 16));
  }

  // Build packet: 6x 0xFF + MAC repeated 16 times
  const packet = [];
  for (let i = 0; i < 6; i++) packet.push(0xff);
  for (let i = 0; i < 16; i++) packet.push(...macBytes);

  return Buffer.from(packet);
}
```

---

## 7. UDP Send Logic

```javascript
import UdpSocket from 'react-native-udp';

function sendWakePacket(broadcastAddress, port, macAddress) {
  return new Promise((resolve, reject) => {
    const socket = UdpSocket.createSocket({ type: 'udp4', debug: true });
    const packet = buildMagicPacket(macAddress);
    const portNum = parseInt(port, 10) || 9;

    socket.once('error', err => {
      socket.close();
      reject(err);
    });

    socket.bind(0, () => {
      socket.setBroadcast(true);
      socket.send(packet, 0, packet.length, portNum, broadcastAddress, err => {
        socket.close();
        if (err) reject(err);
        else resolve();
      });
    });
  });
}
```

---

## 8. Android Permissions

Add the following to `android/app/src/main/AndroidManifest.xml` inside the `<manifest>` tag:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CHANGE_WIFI_MULTICAST_STATE" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
```

---

## 9. Data Model

```typescript
interface DeviceConfig {
  name: string; // e.g. "Gaming PC"
  mac: string; // e.g. "AA:BB:CC:DD:EE:FF"
  broadcastAddress: string; // e.g. "192.168.1.255"
  port: string; // e.g. "9"
  ipAddress: string; // e.g. "192.168.1.100" (optional, for display/ping)
}
```

---

## 10. Component Structure

```
App.tsx
└── WakeOnLanScreen.tsx
    ├── DeviceForm.tsx         ← All 5 input fields
    ├── WakeButton.tsx         ← Large primary CTA button
    └── StatusIndicator.tsx    ← Success/error/idle feedback
```

All state lives in `WakeOnLanScreen.tsx` via `useState`. No Redux or external state management needed.

---

## 11. UI / Style Notes

- Dark theme preferred (suits a "power/tech" utility app)
- Large, tappable Wake button — full width, high contrast
- Monospace font for MAC address input field (e.g., `fontFamily: 'monospace'`)
- Minimal — this is a utility app, not a showcase
- Target Android API 34, `minSdkVersion 24` (Android 7.0+)

---

## 12. Project File Structure

```text
WOL-Android/
├── android/                  ← Android native project (managed by RN)
├── src/
│   ├── screens/
│   │   └── wake-on-lan-screen.tsx
│   ├── components/
│   │   ├── device-form.tsx
│   │   ├── wake-button.tsx
│   │   └── status-indicator.tsx
│   ├── utils/
│   │   ├── magic-packet.ts    ← buildMagicPacket(), normalizeMac()
│   │   ├── udp-send.ts        ← sendWakePacket()
│   │   └── storage.ts         ← load/save AsyncStorage helpers
│   └── types.ts               ← DeviceConfig interface
├── app.tsx                    ← Entry point, renders WakeOnLanScreen
├── package.json
└── android/app/src/main/
    └── AndroidManifest.xml    ← Permissions and widget receiver
```

---

## 13. package.json Dependencies

```json
{
  "dependencies": {
    "react": "19.2.3",
    "react-native": "0.84.1",
    "react-native-udp": "^4.1.7",
    "@react-native-async-storage/async-storage": "^2.2.0",
    "react-native-default-preference": "^1.4.4",
    "react-native-vector-icons": "^10.3.0"
  }
}
```

---

## 14. How to Find Your MAC Address (Windows Target PC)

Run in PowerShell on the PC you want to wake:

```powershell
Get-NetAdapter | Select-Object Name, MacAddress, Status
```

Use the MAC of the adapter that's connected (Ethernet preferred — WiFi WoL is unreliable on many motherboards).

## 15. How to Find Your Broadcast Address

Run in PowerShell:

```powershell
Get-NetIPAddress -AddressFamily IPv4 | Select-Object IPAddress, PrefixLength
```

**To calculate broadcast for any subnet:**

```powershell
# Get your IP and prefix
$ip = "192.168.1.42"
$prefix = 24

# Calculate broadcast address
$mask = [IPAddress]((-bnot [uint32]0) -shl (32 - $prefix))
$broadcast = [IPAddress](([IPAddress]$ip).Address -bor $mask.Address)
$broadcast.IPAddressToString
```

For common home networks:

- `/24` (255.255.255.0): Replace last octet with 255
- `/16` (255.255.0.0): Replace last two octets with 255.255

**Warning:** Simply replacing the last octet with `255` only works for `/24` networks.

## 16. Windows PC Requirements (Target Machine)

For WoL to work, the target PC must have it enabled:

1. **BIOS/UEFI:** Enable "Wake on LAN" or "Power on by PCI-E/PCI" (varies by motherboard — check BIOS under Power Management)
2. **Windows:** Device Manager → Network Adapters → your NIC → Properties → Power Management tab:
   - ✅ Allow this device to wake the computer
   - ✅ Only allow a magic packet to wake the computer
3. **Windows:** Device Manager → same NIC → Advanced tab:
   - Set "Wake on Magic Packet" to **Enabled**
4. **Fast Startup:** Can interfere. Consider disabling it:  
   Control Panel → Power Options → Choose what the power buttons do → Turn off fast startup

---

## 17. Testing Checklist

- [ ] App launches and loads saved config from storage
- [ ] Invalid MAC address shows inline error (doesn't send)
- [ ] Valid MAC + broadcast sends packet (green status shown)
- [ ] Config persists after app restart
- [ ] Target PC wakes up within ~5 seconds of tapping Wake
- [ ] Status message clears after 5 seconds

---

## 18. Prompt to Give Claude Code

> "Build the React Native Android app described in this spec exactly. Use React Native CLI (no Expo). Set up all files, folder structure, and implement all components as described. Include all permissions in AndroidManifest.xml, implement the magic packet builder, UDP send logic, and AsyncStorage persistence. Use a dark theme with a clean utility aesthetic. TypeScript throughout."
