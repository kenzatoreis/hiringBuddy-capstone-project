import { useEffect, useState } from "react";
import {
  adminListUsers, adminSetUserRole, adminDeleteUser,
  adminListComplaints, adminSetComplaintStatus,  
} from "../../api";

export default function AdminUsers() {
  const [tab, setTab] = useState("users"); 

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <div className="inline-flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setTab("users")}
            className={`px-3 py-1 rounded-md ${tab==="users" ? "bg-white shadow font-semibold" : "text-gray-600"}`}
          >
            Users
          </button>
          <button
            onClick={() => setTab("support")}
            className={`px-3 py-1 rounded-md ${tab==="support" ? "bg-white shadow font-semibold" : "text-gray-600"}`}
          >
            Support
          </button>
        </div>
      </div>

      {tab === "users" ? <UsersSection /> : <SupportSection />}
    </div>
  );
}

/* ---------------- Users ---------------- */
function UsersSection() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminListUsers();
      setRows(res.data.users || []);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const promote = async (id) => { await adminSetUserRole(id, "admin"); await load(); };
  const demote  = async (id) => { await adminSetUserRole(id, "user");  await load(); };
  const remove  = async (id) => { if (confirm("Delete this user?")) { await adminDeleteUser(id); await load(); } };

  if (loading) return <div className="text-gray-500">Loading users…</div>;

  return (
    <div className="bg-white rounded-xl shadow overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left">ID</th>
            <th className="px-4 py-2 text-left">Email</th>
            <th className="px-4 py-2 text-left">Role</th>
            <th className="px-4 py-2 text-left">Username</th>
            <th className="px-4 py-2 text-left">Major</th>
            <th className="px-4 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="px-4 py-2">{r.id}</td>
              <td className="px-4 py-2">{r.email}</td>
              <td className="px-4 py-2">{r.role}</td>
              <td className="px-4 py-2">{r.profile?.username || "—"}</td>
              <td className="px-4 py-2">{r.profile?.major || "—"}</td>
              <td className="px-4 py-2 text-right space-x-2">
                {r.role !== "admin" ? (
                  <button onClick={() => promote(r.id)} className="px-2 py-1 border rounded">Promote</button>
                ) : (
                  <button onClick={() => demote(r.id)} className="px-2 py-1 border rounded">Demote</button>
                )}
                <button onClick={() => remove(r.id)} className="px-2 py-1 border rounded text-red-600">Delete</button>
              </td>
            </tr>
          ))}
          {!rows.length && (
            <tr><td className="px-4 py-6 text-center text-gray-500" colSpan="6">No users yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Support ---------------- */
function SupportSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewItem, setViewItem] = useState(null); 

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminListComplaints();
      setItems(res.data.items || []);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id, status) => {
    await adminSetComplaintStatus(id, status);
    await load();
  };

  const remove = async (id) => {
    if (confirm("Delete this ticket?")) {
      await adminDeleteComplaint(id);
      await load();
      setViewItem(null);
    }
  };

  const badge = (s) =>
    ({
      open: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-blue-100 text-blue-800",
      resolved: "bg-green-100 text-green-800",
      rejected: "bg-rose-100 text-rose-800",
    }[s] || "bg-gray-100 text-gray-800");

  if (loading) return <div className="text-gray-500">Loading tickets…</div>;

  return (
    <>
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">From</th>
              <th className="px-4 py-2 text-left">Subject</th>
              <th className="px-4 py-2 text-left">Message</th>
              <th className="px-4 py-2 text-left">Category</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id} className="border-t align-top">
                <td className="px-4 py-2">{t.id}</td>
                <td className="px-4 py-2">
                  <div className="font-medium">{t.name}</div>
                  <div className="text-gray-600">{t.email}</div>
                </td>
                <td className="px-4 py-2">{t.subject}</td>

                {/* one-line snippet */}
                <td className="px-4 py-2">
                  <div className="max-w-xs truncate text-gray-700">{t.message}</div>
                </td>

                <td className="px-4 py-2 capitalize">{t.category}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-xs ${badge(t.status)}`}>{t.status}</span>
                </td>
                <td className="px-4 py-2 text-right space-x-2">
                  <button onClick={() => setViewItem(t)} className="px-2 py-1 border rounded">View</button>
                  <button onClick={() => setStatus(t.id, "in_progress")} className="px-2 py-1 border rounded">In progress</button>
                  <button onClick={() => setStatus(t.id, "resolved")} className="px-2 py-1 border rounded bg-green-600 text-white">Resolve</button>
                  <button onClick={() => setStatus(t.id, "rejected")} className="px-2 py-1 border rounded text-rose-600">Reject</button>
                  <button onClick={() => remove(t.id)} className="px-2 py-1 border rounded text-red-700">Delete</button>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr><td className="px-4 py-6 text-center text-gray-500" colSpan="7">No tickets yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ----- View Modal ----- */}
      {viewItem && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Ticket #{viewItem.id}</h3>
              <button onClick={() => setViewItem(null)} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">From</div>
                  <div className="font-medium">{viewItem.name}</div>
                  <a href={`mailto:${viewItem.email}`} className="text-blue-600">{viewItem.email}</a>
                </div>
                <div>
                  <div className="text-gray-500">Category</div>
                  <div className="font-medium capitalize">{viewItem.category}</div>
                </div>
                <div>
                  <div className="text-gray-500">Subject</div>
                  <div className="font-medium">{viewItem.subject}</div>
                </div>
                <div>
                  <div className="text-gray-500">Created</div>
                  <div className="font-medium">
                    {viewItem.created_at ? new Date(viewItem.created_at).toLocaleString() : "—"}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-gray-500 text-sm mb-1">Message</div>
                <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-xl text-sm text-gray-800">
{viewItem.message}
                </pre>
              </div>
            </div>

            <div className="px-6 py-4 border-t flex items-center justify-between">
              <div className="space-x-2">
                <button onClick={() => setStatus(viewItem.id, "in_progress")} className="px-3 py-2 border rounded">In progress</button>
                <button onClick={() => setStatus(viewItem.id, "resolved")} className="px-3 py-2 border rounded bg-green-600 text-white">Resolve</button>
                <button onClick={() => setStatus(viewItem.id, "rejected")} className="px-3 py-2 border rounded text-rose-600">Reject</button>
              </div>
              <div className="space-x-2">
                <button onClick={() => remove(viewItem.id)} className="px-3 py-2 border rounded text-red-700">Delete</button>
                <button onClick={() => setViewItem(null)} className="px-3 py-2 border rounded">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

