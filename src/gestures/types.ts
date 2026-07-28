import type { ComposedGesture, GestureType } from 'react-native-gesture-handler';

/**
 * `GestureDetector`-in qəbul etdiyi tip.
 * Tək gesture (`GestureType`) və ya kompozisiya (`ComposedGesture`) ola bilər.
 */
export type AnyGesture = ComposedGesture | GestureType;
