export type TotpKind = 'totp' | 'hotp';

export type TotpAlgorithm = 'SHA1' | 'SHA256' | 'SHA512';

export interface TotpAccountEntity {
  id: string;
  issuer: string;
  label: string;
  secret: string;
  digits: number;
  period: number;
  algorithm: TotpAlgorithm;
  type: TotpKind;
  counter: number;
  createdAt: number;
  updatedAt: number;
}

export interface TotpDraft {
  issuer?: string;
  label: string;
  secret: string;
  digits?: number;
  period?: number;
  algorithm?: TotpAlgorithm;
  type?: TotpKind;
  counter?: number;
}

export interface TotpGeneratedCode {
  code: string;
  formattedCode: string;
  remainingSeconds: number;
  progress: number;
}
