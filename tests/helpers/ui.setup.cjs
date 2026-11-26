jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default
);
jest.mock('expo-router', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Link: ({ children, ...props }) => React.createElement(Text, props, children),
    router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
    Stack: { Screen: () => null },
    useLocalSearchParams: () => ({}),
  };
});
jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function MockIcon() { return React.createElement(View, { accessible: false }); };
});
