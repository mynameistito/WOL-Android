import UdpSocket from "react-native-udp";
import { buildMagicPacket } from "./magic-packet";

export function sendWakePacket(
  broadcastAddress: string,
  port: string,
  macAddress: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = UdpSocket.createSocket({ type: "udp4", debug: true });
    const portNum = Number.parseInt(port, 10) || 9;
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
