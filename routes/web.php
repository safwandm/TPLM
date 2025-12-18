<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use SebastianBergmann\Environment\Console;

Route::get('/', function () {
    return Inertia::render('Murid/JoinQuiz');
});


Route::get('/quizzes/create', action: function () {
    return Inertia::render('Guru/Create');
});

Route::get('/quizzes/{id}/edit', function ($id) {
    return Inertia::render('Guru/Edit', [
        'id' => $id  
    ]);
});


Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});


Route::get('/login', fn () => Inertia::render('Auth/Login'));
Route::get('/dashboard', fn () => Inertia::render('Guru/Dashboard'));
Route::get('/sesi/{id}', fn ($id) => Inertia::render('Guru/GuruQuiz', ['id' => $id]));
Route::get('/menunggu/{id}', fn ($id) => Inertia::render('Murid/WaitingRoom', ['id' => $id]));
Route::get('/kuis/{id}', fn ($id) => Inertia::render('Murid/Quiz', ['id' => $id]));
Route::get('/admin', fn () => Inertia::render('Admin'));

