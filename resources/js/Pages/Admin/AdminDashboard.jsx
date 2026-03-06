import { useEffect, useState } from "react";
import webFetch from "@/lib/webFetch";
import AppLayout from "@/Layouts/AppLayout";
import Modal from "@/Components/Modal";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [search, setSearch] = useState("");

  const [resetUserId, setResetUserId] = useState(null);
  const [resetPassword, setResetPassword] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    identifier: "",
    role: "teacher",
    password: "",
  });

  // ================= LOAD USERS =================

  // Format UNIX timestamp (seconds) → human readable Indonesian
  const formatLastActivity = (ts) => {
    if (!ts) return "-";

    const now = Date.now();
    const last = ts * 1000; // convert seconds → ms
    const diffSec = Math.floor((now - last) / 1000);

    if (diffSec < 60) return "Baru saja";

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} menit lalu`;

    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} jam lalu`;

    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay} hari lalu`;

    // Fallback: show full date
    const d = new Date(last);
    return d.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const loadUsers = async () => {
    const res = await webFetch("/web/admin/users");
    if (!res.ok) throw new Error("Gagal load users");
    const data = await res.json();
    setUsers(data.users || []);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // ================= UC-01: CREATE USER =================
  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await webFetch("/web/admin/user/create-user", {
        method: "POST",
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error(err);
        throw new Error("Validasi gagal");
      }

      alert("Akun berhasil dibuat");
      setForm({
        name: "",
        email: "",
        identifier: "",
        role: "teacher",
        password: "",
      });
      setShowModal(false);
      loadUsers();
    } catch (err) {
      console.error(err);
      alert(
        "Gagal membuat akun.\nPastikan:\n- Email unik\n- Identifier unik\n- Password min 8 karakter"
      );
    } finally {
      setLoading(false);
    }
  };

  // ================= UC-02: RESET PASSWORD =================
  const handleResetPassword = (userId) => {
    setResetUserId(userId);
    setResetPassword("");
    setShowResetModal(true);
  };

  const submitResetPassword = async (e) => {
    e.preventDefault();
    if (!resetUserId) return;

    try {
      const res = await webFetch(
        `/web/admin/user/${resetUserId}/replace-password`,
        {
          method: "PUT",
          body: JSON.stringify({
            password: resetPassword,
            password_confirmation: resetPassword,
          }),
        }
      );

      if (!res.ok) throw new Error();

      alert("Password berhasil diperbarui");

      setShowResetModal(false);
      setResetUserId(null);
      setResetPassword("");
    } catch {
      alert("Gagal reset password");
    }
  };

  // ================= UC-03: DELETE USER =================
  const handleDelete = async (userId) => {
    if (!confirm("Yakin ingin menghapus akun ini?")) return;

    try {
      const res = await webFetch(`/web/admin/user/${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      alert("Akun berhasil dihapus");
      loadUsers();
    } catch {
      alert("Gagal menghapus akun");
    }
  };

  // ================= UC-04: EDIT USER =================
  const handleEdit = (user) => {
    setEditingUser(user);
    setForm({
      name: user.name || "",
      email: user.email || "",
      identifier: user.identifier || "",
      role: user.roles?.[0]?.name || "teacher",
      password: "",
    });
    setShowModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    setLoading(true);

    try {
      const res = await webFetch(`/web/admin/user/${editingUser.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          identifier: form.identifier,
          role: form.role,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error(err);
        throw new Error();
      }

      alert("Data pengguna berhasil diperbarui");

      setEditingUser(null);
      setShowModal(false);

      setForm({
        name: "",
        email: "",
        identifier: "",
        role: "teacher",
        password: "",
      });

      loadUsers();
    } catch {
      alert("Gagal memperbarui pengguna");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Manajemen Pengguna">
      <div className="max-w-5xl mx-auto space-y-6 p-4">

        {/* HEADER */}
        <div className="flex items-center justify-between border-b pb-3 gap-4">
          <h1 className="text-2xl font-semibold">Manajemen Pengguna</h1>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Cari pengguna..."
              className="border p-2 rounded w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <button
              onClick={loadUsers}
              className="w-10 h-10 flex items-center justify-center border rounded-full hover:bg-gray-100"
              title="Refresh daftar pengguna"
            >
              ↻
            </button>

            <button
              onClick={() => setShowModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded whitespace-nowrap"
            >
              Tambah Pengguna
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded border overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-3 text-left">Nama User</th>
                <th className="p-3 text-left">Identifier</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Peran</th>
                <th className="p-3 text-left">Terakhir Aktif</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users
                .filter((u) => u.roles?.[0]?.name !== "admin")
                .filter((u) =>
                  u.name?.toLowerCase().includes(search.toLowerCase())
                )
                .map((u) => (
                  <tr key={u.id} className="border-b">
                    <td className="p-3">{u.name}</td>
                    <td className="p-3">{u.identifier || "-"}</td>
                    <td className="p-3">{u.email || "-"}</td>
                    <td className="p-3 capitalize">
                      {u.roles?.[0]?.name || "-"}
                    </td>
                    <td className="p-3">{formatLastActivity(u.last_activity)}</td>
                    <td className="p-3 text-center space-x-4">
                      <button
                        onClick={() => handleEdit(u)}
                        className="text-green-600 hover:text-green-800"
                        title="Edit Pengguna"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleResetPassword(u.id)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Reset Password"
                      >
                        🔑
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Hapus Pengguna"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}

              {users.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-gray-500">
                    Belum ada data pengguna
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MODAL */}
        <Modal open={showModal}>
          <h2 className="text-lg font-bold mb-4">
            {editingUser ? "Edit Pengguna" : "Tambah Pengguna Baru"}
          </h2>

          <form onSubmit={editingUser ? handleUpdate : handleCreate} className="grid gap-4">
            <input
              className="border p-2 rounded"
              placeholder="Nama Lengkap"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              required
            />

            <input
              className="border p-2 rounded"
              placeholder="Email (opsional)"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />

            <input
              className="border p-2 rounded"
              placeholder="NIS / NIP / NUPTK"
              value={form.identifier}
              onChange={(e) =>
                setForm({ ...form, identifier: e.target.value })
              }
              required
            />

            <select
              className="border p-2 rounded"
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value })
              }
            >
              <option value="teacher">Guru</option>
              <option value="student">Murid</option>
            </select>

            {!editingUser && (
              <input
                type="password"
                className="border p-2 rounded"
                placeholder="Password Sementara"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                required
              />
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingUser(null);
                }}
                className="border px-4 py-2 rounded"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-700 text-white px-4 py-2 rounded"
              >
                {loading ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </Modal>

        {/* RESET PASSWORD MODAL */}
        <Modal open={showResetModal}>
          <h2 className="text-lg font-bold mb-4">Reset Password</h2>

          <form onSubmit={submitResetPassword} className="grid gap-4">
            <input
              type="password"
              className="border p-2 rounded"
              placeholder="Password baru (min 8 karakter)"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              required
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowResetModal(false);
                  setResetUserId(null);
                  setResetPassword("");
                }}
                className="border px-4 py-2 rounded"
              >
                Batal
              </button>

              <button
                type="submit"
                className="bg-blue-700 text-white px-4 py-2 rounded"
              >
                Simpan Password
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AppLayout>
  );
}
