import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

export interface KeyboardState {
  isVisible: boolean;
  keyboardHeight: number;
}

export function useKeyboardState(): KeyboardState {
  const [state, setState] = useState<KeyboardState>({
    isVisible: false,
    keyboardHeight: 0,
  });

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setState({
        isVisible: true,
        keyboardHeight: event.endCoordinates.height,
      });
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setState({
        isVisible: false,
        keyboardHeight: 0,
      });
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return state;
}
