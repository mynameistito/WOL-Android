import UdpSockets from "react-native-udp";
import type UdpSocket from "react-native-udp/lib/types/UdpSocket";
import { buildMagicPacket } from "@/utils/magic-packet.ts";

export function sendWakePacket(
  broadcastAddress: string,
  port: string,
  macAddress: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    let packet: Buffer;
    let socket: UdpSocket | null = null;

    try {
      packet = buildMagicPacket(macAddress);
      socket = UdpSockets.createSocket({ type: "udp4" });
    } catch (e) {
      reject(e);
      return;
    }

    const parsed = Number.parseInt(port, 10);
    const portNum =
      Number.isNaN(parsed) || parsed < 1 || parsed > 65_535 ? 9 : parsed;

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
