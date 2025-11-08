// pages/Admin/AdminLayout.jsx
import { NavLink, Outlet } from "react-router-dom";
import { Users, LifeBuoy } from "lucide-react";

export default function AdminLayout() {
  const link =
    "flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700";
  const active = ({ isActive }) =>
    isActive ? `${link} bg-gray-100 font-semibold` : link;

  return (
    <div className="min-h-[70vh] grid grid-cols-12 gap-6">
      <aside className="col-span-12 md:col-span-3 lg:col-span-2 bg-white rounded-2xl shadow p-4">
        <h2 className="text-lg font-bold mb-4">Admin Panel</h2>
        <nav className="space-y-2">
          <NavLink to="/admin/users" className={active}>
            <Users className="w-4 h-4" /> Users
          </NavLink>
          <NavLink to="/admin/support" className={active}>
            <LifeBuoy className="w-4 h-4" /> Support
          </NavLink>
        </nav>
      </aside>

      <main className="col-span-12 md:col-span-9 lg:col-span-10">
        <div className="bg-white rounded-2xl shadow p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
