import UdpSocket from "react-native-udp";
import { buildMagicPacket } from "./magic-packet.ts";

export function sendWakePacket(
  broadcastAddress: string,
  port: string,
  macAddress: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = UdpSocket.createSocket({ type: "udp4" });
    const parsed = Number.parseInt(port, 10);
    const portNum =
      Number.isNaN(parsed) || parsed < 1 || parsed > 65_535 ? 9 : parsed;
    let packet: Buffer;

    try {
      packet = buildMagicPacket(macAddress);
    } catch (e) {
      reject(e);
      return;
    }

    socket.once("error", (err: Error) => {
      socket.close();
      reject(err);
    });

    socket.bind(0, () => {
      socket.setBroadcast(true);
      socket.send(
        packet,
        0,
        packet.length,
        portNum,
        broadcastAddress,
        (err?: Error | null) => {
          socket.close();
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  });
}
