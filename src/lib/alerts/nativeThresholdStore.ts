import type { AlertThresholds } from '@/data/types';
import { thresholdsFromDocument, validateThresholds } from './thresholdsCore';

type AlertDocument = AlertThresholds & { updatedAt: unknown };

export type NativeThresholdDependencies = {
  currentUid: () => string | null;
  subscribeDocument: (
    uid: string,
    onData: (data: Record<string, unknown> | undefined) => void,
    onError: (error: Error) => void,
  ) => () => void;
  writeDocument: (uid: string, data: AlertDocument) => Promise<void>;
  serverTimestamp: () => unknown;
};

function storeError(code: string): Error & { code: string } {
  return Object.assign(new Error(code), { code });
}

export function createNativeThresholdStore(deps: NativeThresholdDependencies) {
  const owns = (uid: string) => deps.currentUid() === uid;
  const requireOwner = (uid: string) => {
    if (!deps.currentUid()) throw storeError('auth/no-current-user');
    if (!owns(uid)) throw storeError('auth/user-mismatch');
  };

  return {
    getUid: deps.currentUid,
    subscribe(
      uid: string,
      onThresholds: (thresholds: AlertThresholds) => void,
      onError: (error: Error) => void,
    ) {
      try {
        requireOwner(uid);
      } catch (error) {
        Promise.resolve().then(() => onError(error as Error));
        return () => undefined;
      }
      return deps.subscribeDocument(
        uid,
        (data) => {
          if (!owns(uid)) {
            onError(storeError('auth/user-mismatch'));
            return;
          }
          onThresholds(thresholdsFromDocument(data));
        },
        onError,
      );
    },
    async save(uid: string, thresholds: AlertThresholds) {
      requireOwner(uid);
      const validationError = validateThresholds(thresholds);
      if (validationError) throw storeError('alerts/invalid-thresholds');
      await deps.writeDocument(uid, {
        enabled: thresholds.enabled,
        hrMin: thresholds.hrMin,
        hrMax: thresholds.hrMax,
        updatedAt: deps.serverTimestamp(),
      });
      requireOwner(uid);
    },
  };
}
