import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Kanban,
  Handshake,
  CheckSquare,
  BarChart3,
  ArrowLeft,
  Inbox,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/customers', icon: Users, label: 'Customers' },
  { to: '/admin/pipeline', icon: Kanban, label: 'Pipeline' },
  { to: '/admin/recovery', icon: Inbox, label: 'Recovery' },
  { to: '/admin/deals', icon: Handshake, label: 'Deals' },
  { to: '/admin/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/feedback', icon: Star, label: 'Feedback' },
];

export default function AdminSidebar() {
  return (
    <aside className="flex h-screen w-60 flex-col border-r border-black/[0.06] bg-white">
      {/* Brand block — same mark and wordmark as the consumer app, with an
          HQ chip so it's obvious which side of the product you're on. */}
      <div className="flex items-center gap-2.5 px-4 py-5">
        <img
          src="/logo/mpb-mark-transparent.png"
          alt=""
          className="h-9 w-9 object-contain shrink-0"
          draggable={false}
        />
        <div className="min-w-0">
          <p className="font-display text-base font-extrabold leading-tight tracking-tight text-foreground truncate">
            My<span className="text-primary-ink">Phonics</span>Books
          </p>
          <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-primary-ink">
            HQ · CRM
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary-ink'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.5 : 2} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-black/[0.06] p-3">
        <NavLink
          to="/"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
          Back to Site
        </NavLink>
      </div>
    </aside>
  );
}
