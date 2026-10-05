export type AuthSession = {
  ready: boolean;
  signedIn: boolean;
  displayName: string;
  enablePreview: ((displayName: string) => void) | undefined;
  signOut: () => void;
};
