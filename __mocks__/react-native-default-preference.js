import { jest } from "@jest/globals";

const store = {};

export default {
  setName: jest.fn().mockResolvedValue(undefined),
  set: jest.fn().mockResolvedValue(undefined),
  get: jest.fn((key) => Promise.resolve(store[key] ?? null)),
  clear: jest.fn().mockResolvedValue(undefined),
};
