<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function create_user(Request $request)
    {
        $fields = $request->validate([
            'email' => 'required|email|string|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|string|in:admin,teacher'
        ]);
    
        $user = User::create([
            'email' => $fields['email'],
            'password' => Hash::make($fields['password'])
        ]);
    
        $user->assignRole($fields['role']);
    
        return response()->json(['user' => $user], 201);
    }

    public function replace_password(Request $request, $id)
    {
        $request->validate([
            'password' => 'required|string|min:6'
        ]);

        $user = User::findOrFail($id);

        $user->update([
            'password' => Hash::make($request->password)
        ]);

        return response()->json([
            'message' => 'Password updated successfully.',
        ], 200);
    }

    public function list_users()
    {
        $users = User::with('roles')->get();

        return response()->json([
            'users' => $users
        ], 200);
    }

    public function delete_user($id)
    {
        $user = User::findOrFail($id);

        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully.'
        ], 200);
    }

}
