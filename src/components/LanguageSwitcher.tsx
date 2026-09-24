import { Check, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LANGUAGES, getLanguage } from '@/i18n/languages';
import { setLanguage } from '@/i18n';
import { cn } from '@/lib/utils';

/**
 * Language picker for grown-ups. Always shows the translate icon plus the
 * current language's own name, so a parent who can't read English still
 * recognises it. Each option is written in its own script.
 *
 * variant="full"    — icon + native name (sidebars, page headers)
 * variant="compact" — icon + short code (tight mobile headers)
 */
export default function LanguageSwitcher({
  variant = 'full',
  className,
  align = 'end',
}: {
  variant?: 'full' | 'compact';
  className?: string;
  align?: 'start' | 'center' | 'end';
}) {
  const { t, i18n } = useTranslation();
  const current = getLanguage(i18n.language ?? i18n.resolvedLanguage);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-1.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted/60',
          className,
        )}
        aria-label={`${t('language.label')} — ${current.nativeName}`}
        title={t('language.label')}
      >
        <Languages className="h-4 w-4 shrink-0 text-primary-ink" aria-hidden />
        {variant === 'full' ? (
          <span className="truncate">{current.nativeName}</span>
        ) : (
          <span className="uppercase tracking-wide text-xs">{current.code}</span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-60 max-h-[70vh] overflow-y-auto">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-medium">
          {t('language.choose')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LANGUAGES.map((lang) => {
          const active = lang.code === current.code;
          return (
            <DropdownMenuItem
              key={lang.code}
              onSelect={() => { void setLanguage(lang.code); }}
              className="flex items-center gap-2 py-2 cursor-pointer"
            >
              <span className="flex-1 min-w-0" dir={lang.dir} lang={lang.locale}>
                <span className={cn('block text-sm', active ? 'font-bold' : 'font-medium')}>
                  {lang.nativeName}
                </span>
                {lang.code !== 'en' && (
                  <span className="block text-[11px] text-muted-foreground" dir="ltr" lang="en">
                    {lang.englishName}
                  </span>
                )}
              </span>
              {active && <Check className="h-4 w-4 shrink-0 text-primary-ink" aria-hidden />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
