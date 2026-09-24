import i18n from '@/i18n';

/**
 * Supabase Auth returns English error strings. Map the common ones to a
 * translated, parent-friendly message; anything else gets a generic
 * translated line with the raw message appended so support can still
 * recognise it.
 */
export function authErrorMessage(err: unknown): string {
  const raw = (err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : String(err ?? '')).trim();
  const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: unknown }).code ?? '') : '';
  const m = raw.toLowerCase();
  const tr = (key: string) => i18n.t(`auth:errors.${key}`);
  if (code === 'invalid_credentials' || m.includes('invalid login credentials')) return tr('invalidLogin');
  if (code === 'email_not_confirmed' || m.includes('email not confirmed')) return tr('emailNotConfirmed');
  if (code === 'user_already_exists' || code === 'email_exists' || m.includes('already registered') || m.includes('already been registered') || m.includes('already exists')) return tr('alreadyRegistered');
  if (code === 'weak_password' || m.includes('password should be') || m.includes('password is too weak') || m.includes('weak password')) return tr('weakPassword');
  if (code === 'same_password' || m.includes('should be different from the old password')) return tr('samePassword');
  if (code.startsWith('over_') || m.includes('rate limit') || m.includes('too many requests') || m.includes('for security purposes, you can only request')) return tr('rateLimit');
  if (code === 'email_address_invalid' || (code === 'validation_failed' && m.includes('email')) || m.includes('invalid email') || m.includes('unable to validate email address')) return tr('invalidEmail');
  if (code === 'otp_expired' || m.includes('expired') || m.includes('invalid or has expired')) return tr('expiredLink');
  if (m.includes('failed to fetch') || m.includes('network')) return tr('network');
  if (!raw) return tr('generic');
  return i18n.t('auth:errors.genericWithDetail', { message: raw });
}
