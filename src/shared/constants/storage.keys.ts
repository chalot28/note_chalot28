export const STORAGE_KEYS = {
  THEME_CONFIG: 'liquid.theme.config.v1',
  APP_SETTINGS: 'liquid.app.settings.v1',
  NOTES_VIEW_MODE: 'liquid.notes.view_mode.v1',
  AUTO_LOCK_SECONDS: 'liquid.security.auto_lock_seconds.v1',
  DB_MIGRATION_VERSION: 'liquid.db.migration_version.v1',
} as const;

export const SECURE_KEYS = {
  MAIN_PIN_HASH: 'liquid.secure.main_pin_hash.v1',
  VAULT_PIN_HASH: 'liquid.secure.vault_pin_hash.v1',
  VAULT_MASTER_KEY: 'liquid.secure.vault_master_key.v1',
  VAULT_WRAPPED_KEY: 'liquid.secure.vault_wrapped_key.v1',
  VAULT_MASTER_SALT: 'liquid.secure.vault_master_salt.v1',
  PIN_LOCKOUT_STATE: 'liquid.secure.pin_lockout.v1',
  BIOMETRIC_ENABLED: 'liquid.secure.biometric_enabled.v1',
  AI_API_KEY_PREFIX: 'liquid.secure.ai_key.',
  AI_PROVIDER_CONFIG: 'liquid.secure.ai_provider_config.v1',
  NOTE_DATA_KEY: 'liquid.secure.note_data_key.v1',
} as const;
