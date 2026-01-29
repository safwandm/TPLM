import { useEffect, useState } from "react";
import webFetch from "@/lib/webFetch";
import AppLayout from "@/Layouts/AppLayout";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    identifier: "",
    role: "teacher",
    password: "",
  });

  // ================= LOAD USERS =================
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
  const handleResetPassword = async (userId) => {
    const password = prompt("Masukkan password baru (min 8 karakter):");
    if (!password) return;

    try {
      const res = await webFetch(
        `/web/admin/user/${userId}/replace-password`,
        {
          method: "PUT",
          body: JSON.stringify({
            password,
            password_confirmation: password,
          }),
        }
      );

      if (!res.ok) throw new Error();

      alert("Password berhasil diperbarui");
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

  return (
    <AppLayout title="Manajemen Pengguna">
      <div className="p-6 space-y-6">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Manajemen pengguna</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-700 text-white px-4 py-2 rounded"
          >
            ➕ Tambahkan Pengguna
          </button>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full">
            <thead className="bg-orange-400">
              <tr>
                <th className="p-3 text-left">Nama User</th>
                <th className="p-3 text-left">Peran</th>
                <th className="p-3 text-left">Terakhir Login</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b">
                  <td className="p-3">{u.name}</td>
                  <td className="p-3 capitalize">
                    {u.roles?.[0]?.name || "-"}
                  </td>
                  <td className="p-3">{u.last_login_at || "-"}</td>
                  <td className="p-3 text-center space-x-3">
                    <button
                      onClick={() => handleResetPassword(u.id)}
                      className="text-blue-600"
                    >
                      🔑
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="text-red-600"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-4 text-center text-gray-500">
                    Belum ada data pengguna
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MODAL */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded p-6 w-full max-w-lg">
              <h2 className="text-lg font-bold mb-4">
                Tambah Pengguna Baru
              </h2>

              <form onSubmit={handleCreate} className="grid gap-4">
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

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
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
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
