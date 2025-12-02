<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function create_user(Request $request)
    {
        $fields = $request->validate([
            'name' => 'required|string|unique:users,name',
            'password' => 'required|string|min:6',
            'role' => 'required|string|in:admin,teacher,student'
        ]);
    
        $user = User::create([
            'name' => $fields['name'],
            'password' => Hash::make($fields['password'])
        ]);
    
        $user->assignRole($fields['role']);
    
        return response()->json(['user' => $user], 201);
    }
}
