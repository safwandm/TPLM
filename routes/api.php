<?php

use App\Http\Controllers\KuisController;
use App\Http\Controllers\PertanyaanController;
use App\Http\Controllers\SesiKuisController;
use App\Http\Controllers\SesiPesertaController;
use App\Http\Controllers\UserController;
use App\Models\SesiKuis;
use App\Models\SesiPeserta;
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

Route::prefix('admin')->middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/user/create-user', [UserController::class, 'create_user']);
    Route::put('/user/{id}/replace-password', [UserController::class, 'replace_password']);
    Route::delete('/user/{id}/', [UserController::class, 'delete_user']);
    Route::get('/users', [UserController::class, 'list_users']);
});

Route::prefix('teacher')->middleware(['auth:sanctum', 'role:teacher|admin'])->group(function () {
    Route::get('/kuis', [KuisController::class, 'index']);
    Route::post('/kuis', [KuisController::class, 'store']);
    Route::post('/kuis/full', [KuisController::class, 'storeWithQuestions']);
    Route::get('/kuis/{id}', [KuisController::class, 'show']);  
    Route::put('/kuis/{id}', [KuisController::class, 'update']);  
    Route::delete('/kuis/{id}', [KuisController::class, 'destroy']);

    Route::post('/pertanyaan', [PertanyaanController::class, 'store']);
    Route::put('/pertanyaan/{id}', [PertanyaanController::class, 'update']);
    Route::delete('/pertanyaan/{id}', [PertanyaanController::class, 'destroy']);
});

Route::prefix('sesi')->middleware(['auth:sanctum', 'role:teacher|admin'])->group(function () {
    Route::post('/', [SesiKuisController::class, 'create']);
    Route::post('/{id}/start', [SesiKuisController::class, 'start']);
    Route::post('/{session_id}/pertanyaan/{question_id}/jawab', [SesiKuisController::class, 'submit']);
});

Route::post('/join/{kode}', [SesiPesertaController::class, 'join']);

