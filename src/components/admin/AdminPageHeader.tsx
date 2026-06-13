import { ReactNode } from 'react';

/**
 * Shared page header for the admin CRM — display-font title + quiet
 * subtitle, with an optional action slot on the right. Keeps every page
 * opening with the same brand voice as the consumer app.
 */
export default function AdminPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
