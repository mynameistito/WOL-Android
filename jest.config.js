module.exports = {
  preset: "react-native",
  setupFiles: ["./jest.setup.js"],
  moduleNameMapper: {
    "^react-native-default-preference$":
      "<rootDir>/__mocks__/react-native-default-preference.js",
    "^react-native-udp$": "<rootDir>/__mocks__/react-native-udp.js",
  },
};
