<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Web\Auth\LoginController;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Murid/JoinQuiz');
});


Route::get('/quizzes/create', action: function () {
    return Inertia::render('Guru/Create');
});

Route::get('/quizzes/{id}/edit', function ($id) {
    return Inertia::render('Guru/Edit', [
        'quizId' => $id  
    ]);
});

Route::get('/login', [LoginController::class, 'show'])->name('login');
Route::post('/login', [LoginController::class, 'store']);
Route::post('/logout', [LoginController::class, 'destroy']);

Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', fn () => Inertia::render('Guru/Dashboard'));
});

Route::get('/dashboard', fn () => Inertia::render('Guru/Dashboard'));
Route::get('/sesi/{id}', fn ($id) => Inertia::render('Guru/GuruQuiz', ['id' => $id]));
Route::get('/menunggu/{id}', fn ($id) => Inertia::render('Murid/WaitingRoom', ['id' => $id]));
Route::get('/kuis/{id}', fn ($id) => Inertia::render('Murid/Quiz', ['id' => $id]));
Route::get('/admin', fn () => Inertia::render('Admin'));

