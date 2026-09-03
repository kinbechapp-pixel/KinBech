import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

export const SHARED_TRANSITION_DURATION = 420;

export const BEZIER_EASE_OUT = [0.22, 1, 0.36, 1];

export const makeTags = (sharedId) => ({
  photo: `item.${sharedId}.photo`,
  title: `item.${sharedId}.title`,
  price: `item.${sharedId}.price`,
});

const SharedTransitionContext = createContext(null);

function detectReduceMotion() {
  return new Promise((resolve) => {
    if (typeof AccessibilityInfo.isReduceMotionEnabled !== 'function') {
      resolve(false);
      return;
    }
    AccessibilityInfo.isReduceMotionEnabled().then(resolve).catch(() => resolve(false));
  });
}

export function SharedTransitionProvider({ children }) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const pendingRef = useRef(null);
  const debounceRef = useRef(false);

  useMemo(() => {
    detectReduceMotion().then((v) => setReduceMotion(Boolean(v)));
  }, []);

  const setGeometry = useCallback((sharedId, geom) => {
    if (!sharedId) return;
    pendingRef.current = { sharedId, geom: geom || null };
  }, []);

  const consumeGeometry = useCallback((sharedId) => {
    if (!pendingRef.current || pendingRef.current.sharedId !== sharedId) return null;
    const geom = pendingRef.current.geom;
    return geom || null;
  }, []);

  const tryBeginNavigation = useCallback((id, work) => {
    if (debounceRef.current) return false;
    if (!id) {
      work && work();
      return true;
    }
    debounceRef.current = true;
    try {
      work && work();
    } finally {
      setTimeout(() => {
        debounceRef.current = false;
      }, SHARED_TRANSITION_DURATION + 120);
    }
    return true;
  }, []);

  const value = useMemo(
    () => ({
      reduceMotion,
      setReduceMotion,
      setGeometry,
      consumeGeometry,
      tryBeginNavigation,
      duration: reduceMotion ? 160 : SHARED_TRANSITION_DURATION,
      isAndroid: Platform.OS === 'android',
      isIOS: Platform.OS === 'ios',
    }),
    [reduceMotion, setGeometry, consumeGeometry, tryBeginNavigation]
  );

  return (
    <SharedTransitionContext.Provider value={value}>
      {children}
    </SharedTransitionContext.Provider>
  );
}

export function useSharedTransition() {
  const ctx = useContext(SharedTransitionContext);
  if (!ctx) {
    return {
      reduceMotion: false,
      setReduceMotion: () => {},
      setGeometry: () => {},
      consumeGeometry: () => null,
      tryBeginNavigation: (_id, work) => {
        work && work();
        return true;
      },
      duration: SHARED_TRANSITION_DURATION,
      isAndroid: Platform.OS === 'android',
      isIOS: Platform.OS === 'ios',
    };
  }
  return ctx;
}
