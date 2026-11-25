export type VaultItemKind = 'note' | 'secret';

export type PinAuthMode = 'main_app' | 'stealth_vault' | 'setup_pin';

export type PinVerificationOutcome = 'main_unlocked' | 'vault_unlocked' | 'invalid' | 'locked_out';

export interface VaultItemEntity {
  id: string;
  kind: VaultItemKind;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface VaultItemDraft {
  id?: string;
  kind?: VaultItemKind;
  title: string;
  content: string;
  isPinned?: boolean;
}

export interface VaultEncryptedRow {
  id: string;
  kind: VaultItemKind;
  titleCipher: string;
  titleIv: string;
  titleTag: string;
  payloadCipher: string;
  payloadIv: string;
  payloadTag: string;
  isPinned: boolean;
  createdAt: number;
  updatedAt: number;
}
