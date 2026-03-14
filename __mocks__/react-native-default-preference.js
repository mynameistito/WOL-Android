import { jest } from "@jest/globals";

const store = {};

export default {
  setName: jest.fn().mockResolvedValue(undefined),
  set: jest.fn((key, value) => {
    store[key] = value;
    return Promise.resolve(undefined);
  }),
  get: jest.fn((key) => Promise.resolve(store[key] ?? null)),
  clear: jest.fn(() => {
    for (const key of Object.keys(store)) {
      delete store[key];
    }
    return Promise.resolve(undefined);
  }),
};
