import 'firebase/auth';
import { type Persistence, type ReactNativeAsyncStorage } from 'firebase/auth';

// Firebase 13 exposes this helper on native platforms but omits it from shared types.
declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}
