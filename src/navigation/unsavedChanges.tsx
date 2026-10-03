import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';

export type GuardEntry = { message: string };
export type GuardRegistry = Map<string, GuardEntry>;

type ScopeValue = { scope: string; registry: GuardRegistry };

const ScopeContext = createContext<ScopeValue | null>(null);

// Wraps one tab or stacked screen so guards inside it belong to that screen only.
export function GuardScope({
  scope,
  registry,
  children,
}: {
  scope: string;
  registry: GuardRegistry;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ scope, registry }), [scope, registry]);
  return <ScopeContext.Provider value={value}>{children}</ScopeContext.Provider>;
}

// Call from a container with an edit form. While `dirty` is true, leaving the screen
// (‹ back, Android hardware back, switching tabs) asks to discard first.
export function useUnsavedChangesGuard(dirty: boolean, message = "Your changes haven't been saved.") {
  const ctx = useContext(ScopeContext);

  useEffect(() => {
    if (!ctx) return;
    if (dirty) ctx.registry.set(ctx.scope, { message });
    else ctx.registry.delete(ctx.scope);
    return () => {
      ctx.registry.delete(ctx.scope);
    };
  }, [ctx, dirty, message]);
}

// Runs `proceed` straight away, or after "Discard" if any of the scopes has unsaved changes.
export function confirmLeave(registry: GuardRegistry, scopes: string[], proceed: () => void) {
  const entry = scopes.map((s) => registry.get(s)).find(Boolean);
  if (!entry) {
    proceed();
    return;
  }
  Alert.alert('Discard changes?', entry.message, [
    { text: 'Keep editing', style: 'cancel' },
    {
      text: 'Discard',
      style: 'destructive',
      onPress: () => {
        scopes.forEach((s) => registry.delete(s));
        proceed();
      },
    },
  ]);
}
