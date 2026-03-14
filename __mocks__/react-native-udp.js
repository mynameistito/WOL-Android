import { jest } from "@jest/globals";

export default {
  createSocket: jest.fn(() => ({
    bind: jest.fn((_port, cb) => cb()),
    setBroadcast: jest.fn(),
    send: jest.fn((_buf, _offset, _len, _port, _addr, cb) => cb(null)),
    close: jest.fn(),
    once: jest.fn(),
  })),
};
