import * as LocalAuthentication from 'expo-local-authentication';

export interface BiometricCapability {
  isAvailable: boolean;
  label: string;
}

export async function getBiometricCapability(): Promise<BiometricCapability> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  if (!hasHardware || !isEnrolled) {
    return { isAvailable: false, label: 'Sinh trắc học' };
  }

  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  const hasFace = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
  return {
    isAvailable: true,
    label: hasFace ? 'Face ID' : 'Vân tay',
  };
}

export async function authenticateWithBiometrics(
  promptMessage = 'Xác thực để mở khóa Liquid Notes',
): Promise<boolean> {
  const capability = await getBiometricCapability();
  if (!capability.isAvailable) {
    return false;
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: 'Dùng mã PIN',
    disableDeviceFallback: true,
  });

  return result.success;
}
