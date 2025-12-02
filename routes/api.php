<?php

use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

Route::post('/login', function (Request $request) {
    $request->validate([
        'name' => 'required',
        'password' => 'required'

    ]);

    $user = User::where('name', $request->name)->first();

    if (! $user || ! Hash::check($request->password, $user->password)) {

        throw ValidationException::withMessages([

            'name' => ['The provided credentials are incorrect.'],

        ]);

    }
    
    $token = $user->createToken('web')->plainTextToken;

    return response()->json(['token' => $token, 'user' => $user]);
});

Route::middleware('auth:sanctum')->get('/current-user', fn () => response()->json($request->user()));

Route::prefix('admin')->middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/create-user', [UserController::class, 'create_user']);
});

Route::middleware(['auth:sanctum', 'role:teacher|admin'])->group(function () {
    Route::get('/teacher', fn () => ['message' => 'Teacher area']);
});

Route::middleware(['auth:sanctum', 'role:student|admin|teacher'])->group(function () {
    Route::get('/student', fn () => ['message' => 'Student area']);
});

