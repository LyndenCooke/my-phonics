import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

export default function AdminLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto bg-background p-6 lg:p-8">
        <div className="mx-auto max-w-[1400px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
