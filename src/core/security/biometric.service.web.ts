export interface BiometricCapability {
  isAvailable: boolean;
  label: string;
}

export async function getBiometricCapability(): Promise<BiometricCapability> {
  return { isAvailable: false, label: 'Web Preview' };
}

export async function authenticateWithBiometrics(): Promise<boolean> {
  return false;
}
