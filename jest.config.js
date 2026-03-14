module.exports = {
  preset: "react-native",
  setupFiles: ["./jest.setup.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^react-native-default-preference$":
      "<rootDir>/__mocks__/react-native-default-preference.js",
    "^react-native-udp$": "<rootDir>/__mocks__/react-native-udp.js",
    "^react-native-safe-area-context$":
      "<rootDir>/__mocks__/react-native-safe-area-context.js",
  },
};
