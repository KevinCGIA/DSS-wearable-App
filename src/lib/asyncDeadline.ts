export const LOAD_TIMEOUT_MS = 8000;

export function withDeadline<T>(
  operation: Promise<T>,
  ms = LOAD_TIMEOUT_MS,
  onTimeout?: () => void,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(Object.assign(new Error('The operation timed out. Please try again.'), { code: 'operation/timeout' }));
      onTimeout?.();
    }, ms);
    operation.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); },
    );
  });
}

// A timeout ends initial loading; a later snapshot can still recover the view.
export function subscribeWithDeadline<T>(
  subscribe: (onData: (data: T) => void, onError: (error: Error) => void) => () => void,
  onData: (data: T) => void,
  onError: (error: Error) => void,
  ms = LOAD_TIMEOUT_MS,
): () => void {
  let active = true;
  const timer = setTimeout(() => {
    if (active) onError(new Error('Loading timed out. Please try again.'));
  }, ms);
  const fail = (error: Error) => {
    clearTimeout(timer);
    if (active) onError(error);
  };
  let unsubscribe = () => {};
  try {
    unsubscribe = subscribe((data) => {
      clearTimeout(timer);
      if (active) onData(data);
    }, fail);
  } catch (error) {
    fail(error as Error);
  }
  return () => {
    active = false;
    clearTimeout(timer);
    unsubscribe();
  };
}
