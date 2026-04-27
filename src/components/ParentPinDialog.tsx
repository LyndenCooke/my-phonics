/**
 * ParentPinDialog — gates the child-to-parent mode transition. Two modes:
 *
 *   'set'    First time switching back to parent mode: the parent picks a
 *            4-digit PIN. Stored as sha-256 in localStorage.
 *   'verify' All subsequent switches: parent enters the PIN; on match,
 *            mode flips to parent and the dialog closes.
 *
 * The dialog autofocuses the first slot, accepts only digits, and submits
 * automatically on the 4th digit. There's a small "Forgot PIN?" escape
 * hatch that wipes the stored hash so the parent can set a new one — a
 * curious kid hitting it just gets sent back to the set flow, which still
 * requires entering a 4-digit code. Best-effort, not cryptographic.
 */
import { useEffect, useRef, useState } from 'react';
import { Lock, X } from 'lucide-react';
import { hasParentPin, setParentPin, verifyParentPin, clearParentPin } from '@/hooks/useAppMode';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ParentPinDialog({ open, onClose, onSuccess }: Props) {
  const isSetMode = !hasParentPin();
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const [confirmDigits, setConfirmDigits] = useState<string[]>(['', '', '', '']);
  const [phase, setPhase] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState<string | null>(null);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  // Reset when opened / closed
  useEffect(() => {
    if (open) {
      setDigits(['', '', '', '']);
      setConfirmDigits(['', '', '', '']);
      setPhase('enter');
      setError(null);
      setTimeout(() => inputs.current[0]?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const active = phase === 'confirm' ? confirmDigits : digits;
  const setActive = phase === 'confirm' ? setConfirmDigits : setDigits;

  const handleChange = async (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...active];
    next[idx] = val;
    setActive(next);
    setError(null);
    if (val && idx < 3) inputs.current[idx + 1]?.focus();
    if (idx === 3 && val) {
      const pin = next.join('');
      if (isSetMode && phase === 'enter') {
        // Move to confirm phase
        setTimeout(() => { setPhase('confirm'); setTimeout(() => inputs.current[0]?.focus(), 50); }, 100);
      } else if (isSetMode && phase === 'confirm') {
        if (digits.join('') !== pin) {
          setError('PINs do not match — try again.');
          setConfirmDigits(['', '', '', '']);
          inputs.current[0]?.focus();
          return;
        }
        await setParentPin(pin);
        onSuccess();
      } else {
        // Verify mode
        const ok = await verifyParentPin(pin);
        if (ok) {
          onSuccess();
        } else {
          setError('Wrong PIN — try again.');
          setDigits(['', '', '', '']);
          inputs.current[0]?.focus();
        }
      }
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !active[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const title = isSetMode
    ? phase === 'enter' ? 'Set a parent PIN' : 'Confirm your PIN'
    : 'Enter parent PIN';
  const subtitle = isSetMode
    ? phase === 'enter'
      ? "Pick a 4-digit code grown-ups will use to switch back to parent mode."
      : "Enter the same 4 digits again to confirm."
    : "A grown-up needs to enter the PIN to switch back to parent mode.";

  return (
    <div
      className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-3xl border border-border shadow-2xl max-w-sm w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-muted/50 flex items-center justify-center text-muted-foreground"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-tint-pink flex items-center justify-center mx-auto mb-3">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <h2 className="font-display text-lg font-extrabold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>
        </div>

        <div className="flex justify-center gap-2 mb-3">
          {active.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 border-border bg-background text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-destructive text-center mb-2">{error}</p>
        )}

        {!isSetMode && (
          <button
            onClick={() => {
              if (confirm('Clear the PIN and set a new one? Anyone with this device can do this.')) {
                clearParentPin();
                onClose();
                setTimeout(() => location.reload(), 100);
              }
            }}
            className="block mx-auto text-xs text-muted-foreground hover:text-foreground underline"
          >
            Forgot PIN?
          </button>
        )}
      </div>
    </div>
  );
}
