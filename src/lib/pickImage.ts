import * as ImagePicker from 'expo-image-picker';

export type PickImageResult = { status: 'picked'; uri: string } | { status: 'canceled' } | { status: 'denied' };

// Same permission request and options as Android's chooseProfilePicture (register.tsx / settings.tsx).
// Phase 2: resize to 300×300 JPEG and save base64 to users/{uid}/private/avatarData, as Android does.
export async function pickSquareImage(): Promise<PickImageResult> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return { status: 'denied' };

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });

  if (result.canceled || !result.assets[0]) return { status: 'canceled' };
  return { status: 'picked', uri: result.assets[0].uri };
}
