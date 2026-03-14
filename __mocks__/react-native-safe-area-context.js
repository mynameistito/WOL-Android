import React from "react";

const SafeAreaView = ({ children, style }) => {
  return React.createElement("View", { style }, children);
};

const SafeAreaProvider = ({ children }) => {
  return React.createElement(React.Fragment, null, children);
};

const SafeAreaConsumer = ({ children }) => {
  return children({ top: 0, bottom: 0, left: 0, right: 0 });
};

const useSafeAreaInsets = () => ({
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
});

const initialWindowMetrics = {
  frame: { x: 0, y: 0, width: 0, height: 0 },
  insets: { top: 0, bottom: 0, left: 0, right: 0 },
};

module.exports = {
  SafeAreaView,
  SafeAreaProvider,
  SafeAreaConsumer,
  useSafeAreaInsets,
  initialWindowMetrics,
};
