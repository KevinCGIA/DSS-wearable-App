import { useFonts } from 'expo-font';
import {
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { Barlow_600SemiBold, Barlow_700Bold } from '@expo-google-fonts/barlow';

export function useAppFonts(): boolean {
  const [loaded] = useFonts({
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    Barlow_600SemiBold,
    Barlow_700Bold,
  });

  return loaded;
}
