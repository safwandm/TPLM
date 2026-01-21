<?php

use App\Http\Controllers\KuisController;
use App\Http\Controllers\PertanyaanController;
use App\Http\Controllers\SesiKuisController;
use App\Http\Controllers\SesiPesertaController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;


Route::middleware('auth:sanctum')->post('/logout', function (Request $request) {
    $request->user()->currentAccessToken()->delete();

    return response()->json([
        'message' => 'Logged out'
    ]);
});

Route::middleware('auth:sanctum')->post('/logout-all', function (Request $request) {
    $request->user()->tokens()->delete();

    return response()->json([
        'message' => 'All tokens revoked'
    ]);
});

Route::middleware('auth:sanctum')->get('/current-user', function (Request $request) {
    $user = $request->user();

    return response()->json([
        'user' => $user,
        'roles' => $user->getRoleNames(), 
    ]);
});


Route::prefix('admin')->middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::post('/user/create-user', [UserController::class, 'create_user']);
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

    Route::get('/kuis/{id}/history', [SesiKuisController::class, 'list_sesi']);

    Route::post('/pertanyaan', [PertanyaanController::class, 'store']);
    Route::put('/pertanyaan/{id}', [PertanyaanController::class, 'update']);
    Route::delete('/pertanyaan/{id}', [PertanyaanController::class, 'destroy']);
});

Route::prefix('sesi')->middleware(['auth:sanctum', 'role:teacher|admin'])->group(function () {
    Route::post('/', [SesiKuisController::class, 'create']);
    Route::post('/{id}/start', [SesiKuisController::class, 'start']);
});

Route::get('/sesi/{id}', [SesiKuisController::class, 'detail_sesi']);

Route::post('/sesi/{session_id}/pertanyaan/{question_id}/jawab', [SesiKuisController::class, 'submit']);
Route::get('/sesi/{id}', [SesiKuisController::class, 'detail_sesi']);

// Route::get('/sesi/{id}/config', [SesiKuisController::class, 'config']);

Route::post('/join/{kode}', [SesiPesertaController::class, 'join']);

