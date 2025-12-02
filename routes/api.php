<?php

use Illuminate\Support\Facades\Route;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

Route::post('/login', function (Request $request) {
    $request->validate([
        'email' => 'required|email',
        'password' => 'required'

    ]);

    $user = User::where('email', $request->email)->first();

    if (! $user || ! Hash::check($request->password, $user->password)) {

        throw ValidationException::withMessages([

            'email' => ['The provided credentials are incorrect.'],

        ]);

    }
    
    $token = $user->createToken('web')->plainTextToken;

    return response()->json(['token' => $token, 'user' => $user]);
});

Route::middleware('auth:sanctum')->get('/current-user', fn () => response()->json($request->user()));

Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/admin', fn () => ['message' => 'Admin area']);
});

Route::middleware(['auth:sanctum', 'role:teacher|admin'])->group(function () {
    Route::get('/teacher', fn () => ['message' => 'Teacher area']);
});

Route::middleware(['auth:sanctum', 'role:student|admin|teacher'])->group(function () {
    Route::get('/student', fn () => ['message' => 'Student area']);
});

