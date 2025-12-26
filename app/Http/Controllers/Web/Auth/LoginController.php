<?php

namespace App\Http\Controllers\Web\Auth;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class LoginController
{
    public function show()
    {
                Log::info("message gaming");
        return Inertia::render('Auth/Login');
    }

    public function store(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (!Auth::attempt($credentials, true)) {
            return back()->withErrors([
                'email' => 'Email atau password salah',
            ]);
        }

        $request->session()->regenerate();

        $user = $request->user();

        Log::info("Token and user (Login):", [ $request->session()->token(), $request->user() ]);

        if ($user->hasRole('admin')) {
            return redirect('/admin');
        }

        if ($user->hasRole('teacher')) {
            return redirect('/dashboard');
        }

        return redirect('/');
    }

    public function destroy(Request $request)
    {

        Log::info("Token and user:", [ $request->session()->token(), $request->user() ]);



        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }
}


