<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * UC-01: Buat akun baru (Guru / Siswa)
     */
    public function create_user(Request $request)
    {
        $fields = $request->validate([
            'name'       => 'required|string|max:255',
            'email'      => 'nullable|email|string|unique:users,email',
            'identifier' => 'required|string|unique:users,identifier', // NIS / NIP / NUPTK
            'password'   => 'required|string|min:8',
            'role'       => 'required|string|in:teacher,student',
        ]);

        $user = User::create([
            'name'       => $fields['name'],
            'email'      => $fields['email'] ?? null,
            'identifier' => $fields['identifier'],
            'password'   => Hash::make($fields['password']),
        ]);

        // Assign role (Spatie)
        $user->assignRole($fields['role']);

        return response()->json([
            'message' => 'Akun berhasil dibuat.',
            'user'    => $user
        ], 201);
    }

    /**
     * UC-02: Ganti / Reset password pengguna
     */
    public function replace_password(Request $request, $id)
    {
        $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::findOrFail($id);

        $user->update([
            'password' => Hash::make($request->password)
        ]);

        return response()->json([
            'message' => 'Password berhasil diperbarui.',
        ], 200);
    }

    /**
     * List semua user (untuk halaman admin)
     */
    public function list_users()
    {
        $users = User::with('roles')
            ->orderBy('name')
            ->get();

        return response()->json([
            'users' => $users
        ], 200);
    }

    /**
     * UC-03: Hapus akun pengguna
     */
    public function delete_user($id)
    {
        $user = User::findOrFail($id);

        $user->delete();

        return response()->json([
            'message' => 'Akun berhasil dihapus.'
        ], 200);
    }
}
