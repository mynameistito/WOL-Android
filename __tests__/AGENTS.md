# Jest Testing Notes

## React Native Module Mocks

- Components using `SafeAreaView` from `react-native-safe-area-context` require a mock in `__mocks__/react-native-safe-area-context.js` and a `moduleNameMapper` entry in `jest.config.js`. Without it, tests fail with native module resolution errors.
- The mock should export SafeAreaView as a pass-through View component and include `useSafeAreaInsets` returning zeroed insets.
