/*
 * DevNakedTextGuard
 *
 * Dev-only runtime guard to pinpoint the exact component that renders
 * a raw string/number under a View-like primitive, which triggers:
 *   "Text strings must be rendered within a <Text> component"
 *
 * @security Does not log/render any user data; only component names and stack.
 */

import { logDebug } from './logger';

type ReactLike = {
  createElement: (...args: any[]) => any;
};

type InstallOptions = {
  /** Throw on first detection to force a deterministic stack. Default: true */
  throwOnFirst?: boolean;
};

declare const __DEV__: boolean | undefined;

function isDevEnabled(): boolean {
  return typeof __DEV__ !== 'undefined' && !!__DEV__;
}

function flattenChildren(input: unknown, out: unknown[] = []): unknown[] {
  if (Array.isArray(input)) {
    for (const item of input) flattenChildren(item, out);
  } else {
    out.push(input);
  }
  return out;
}

function getComponentName(type: any): string {
  if (!type) return 'Unknown';
  if (typeof type === 'string') return type;
  return String(type.displayName || type.name || 'Anonymous');
}

function buildPrimitiveSet(rn: any): Set<any> {
  const primitives = new Set<any>();

  const add = (v: any) => {
    if (v) primitives.add(v);
  };

  // Core primitives that render children directly
  add(rn.View);
  add(rn.ScrollView);
  add(rn.Pressable);
  add(rn.SafeAreaView);
  add(rn.KeyboardAvoidingView);
  add(rn.TouchableOpacity);
  add(rn.TouchableHighlight);
  add(rn.TouchableWithoutFeedback);
  add(rn.TouchableNativeFeedback);
  add(rn.ImageBackground);

  // Lists
  add(rn.FlatList);
  add(rn.SectionList);
  add(rn.VirtualizedList);

  // Animated variants (if available)
  if (rn.Animated) {
    add(rn.Animated.View);
    add(rn.Animated.ScrollView);
    add(rn.Animated.FlatList);
  }

  return primitives;
}

/**
 * Installs the guard. Safe to call multiple times.
 */
export function installDevNakedTextGuard(options: InstallOptions = {}): void {
  if (!isDevEnabled()) return;

  const g = global as any;
  if (g.__DEV_NAKED_TEXT_GUARD_INSTALLED__) return;
  g.__DEV_NAKED_TEXT_GUARD_INSTALLED__ = true;

  // Lazy requires to avoid import-order issues.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React: ReactLike = require('react');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const rn = require('react-native');

  const primitiveTypes = buildPrimitiveSet(rn);
  const originalCreateElement = React.createElement.bind(React);

  const throwOnFirst = options.throwOnFirst !== false;

  React.createElement = ((type: any, props: any, ...children: any[]) => {
    try {
      if (primitiveTypes.has(type) && children.length > 0) {
        const flat = flattenChildren(children);
        for (const child of flat) {
          const isBad = typeof child === 'string' || typeof child === 'number';
          if (isBad) {
            const parentName = getComponentName(type);
            const len = typeof child === 'string' ? child.length : 0;
            const childKind = typeof child;

            if (!g.__DEV_NAKED_TEXT_GUARD_HIT__) {
              g.__DEV_NAKED_TEXT_GUARD_HIT__ = true;
              logDebug(
                `[DevNakedTextGuard] Detected ${childKind} child under <${parentName}> (len=${len}). ` +
                  'This will crash RN unless wrapped in <Text>.',
              );
            }

            if (throwOnFirst && !g.__DEV_NAKED_TEXT_GUARD_THROWN__) {
              g.__DEV_NAKED_TEXT_GUARD_THROWN__ = true;
              // Safe, non-PII error message (allowlisted style).
              throw new Error(
                `DevNakedTextGuard: ${childKind} child under <${parentName}>; wrap strings/numbers in <Text>.`,
              );
            }

            break;
          }
        }
      }
    } catch (e) {
      // Re-throw so ErrorBoundary + Metro show a deterministic stack.
      throw e;
    }

    return originalCreateElement(type, props, ...children);
  }) as any;
}

// Auto-install when imported in dev.
installDevNakedTextGuard();
