<?php

use App\Http\Controllers\ExportKuisController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

use Inertia\Inertia;

use App\Http\Controllers\LoginController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\KuisController;
use App\Http\Controllers\PertanyaanController;
use App\Http\Controllers\SesiKuisController;
use App\Http\Controllers\SesiPesertaController;

/*
|--------------------------------------------------------------------------
| PUBLIC PAGES (INERTIA VIEWS)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'role:admin'])->get(
    '/admin/users',
    fn () => Inertia::render('Admin/AdminDashboard')
);

Route::middleware(['auth', 'role:teacher|admin'])->group(function ()  {


});

Route::get('/', fn () =>
    Inertia::render('Murid/JoinQuiz')
);

Route::get('/login', fn () =>
    Inertia::render('Auth/Login')
)->name('login');


Route::middleware(['auth', 'role:admin'])->get(
    '/admin',
    fn () => Inertia::render('Admin/AdminDashboard')
);

Route::middleware(['auth', 'role:teacher'])->get(
    '/dashboard',
    fn () => Inertia::render('Guru/GuruDashboard')
);

Route::get('/quizzes/create', fn () =>
    Inertia::render('Guru/Create')
);

Route::get('/quizzes/{id}/edit', fn ($id) =>
    Inertia::render('Guru/Edit', ['quizId' => $id])
);

Route::get('/sesi/{id}', fn ($id) =>
    Inertia::render('Guru/GuruQuiz', ['id' => $id])
);

Route::get('/menunggu/{id}', fn ($id) =>
    Inertia::render('Murid/WaitingRoom', ['id' => $id])
);

Route::get('/kuis/{id}', fn ($id) =>
    Inertia::render('Murid/MuridQuiz', ['id' => $id])
);

/*
|--------------------------------------------------------------------------
| AUTH (SESSION / COOKIE)
|--------------------------------------------------------------------------
*/

Route::post('/web/login', [LoginController::class, 'store']);
Route::post('/web/logout', [LoginController::class, 'logout']);

Route::middleware('auth')->get('/web/current-user', function (Request $request) {
    return response()->json([
        'user'  => $request->user(),
        'roles' => $request->user()->getRoleNames(),
    ]);
});

/*
|--------------------------------------------------------------------------
| ADMIN (SESSION AUTH)
|--------------------------------------------------------------------------
*/

Route::prefix('web/admin')
    ->middleware(['auth', 'role:admin'])
    ->group(function () {

        Route::post('/user/create-user', [UserController::class, 'create_user']);
        Route::put('/user/{id}/replace-password', [UserController::class, 'replace_password']);
        Route::delete('/user/{id}', [UserController::class, 'delete_user']);
        Route::get('/users', [UserController::class, 'list_users']);
    });

/*
|--------------------------------------------------------------------------
| TEACHER / QUIZ (SESSION AUTH)
|--------------------------------------------------------------------------
*/

Route::prefix('web/teacher')
    ->middleware(['auth', 'role:teacher|admin'])
    ->group(function () {

        // KUIS
        Route::get('/kuis', [KuisController::class, 'index']);
        Route::post('/kuis', [KuisController::class, 'store']);
        Route::post('/kuis/full', [KuisController::class, 'storeWithQuestions']);
        Route::get('/kuis/{id}', [KuisController::class, 'show']);
        Route::put('/kuis/{id}', [KuisController::class, 'update']);
        Route::delete('/kuis/{id}', [KuisController::class, 'destroy']);

        // HISTORY
        Route::get('/kuis/{id}/history', [SesiKuisController::class, 'list_sesi']);

        // QUESTIONS
        Route::post('/pertanyaan', [PertanyaanController::class, 'store']);
        Route::put('/pertanyaan/{id}', [PertanyaanController::class, 'update']);
        Route::delete('/pertanyaan/{id}', [PertanyaanController::class, 'destroy']);

        Route::get('/export/sesi/{sesiId}/csv', [ExportKuisController::class, 'exportBySesi']);
        Route::get('/export/sesi/{sesiId}/detail/csv', [ExportKuisController::class, 'exportSesiDetail']);
    });

/*
|--------------------------------------------------------------------------
| SESI KUIS (SESSION AUTH)
|--------------------------------------------------------------------------
*/

Route::prefix('web/sesi')
    ->middleware(['auth', 'role:teacher|admin'])
    ->group(function () {

        Route::post('/', [SesiKuisController::class, 'create']);
        Route::post('/{id}/start', [SesiKuisController::class, 'start']);
        Route::get('/{id}', [SesiKuisController::class, 'detail_sesi']);
        Route::post('/{id}/abort', [SesiKuisController::class, 'abort']);
    });

/*
|--------------------------------------------------------------------------
| PUBLIC API-LIKE ROUTES (NO AUTH)
|--------------------------------------------------------------------------
| Shared by students (same as api.php)
|--------------------------------------------------------------------------
*/

Route::post(
    'web/sesi/{session_id}/pertanyaan/{question_id}/jawab',
    [SesiKuisController::class, 'submit']
);
Route::get('/sesi/{id}/config', [SesiKuisController::class, 'config']);
Route::post('/join/{kode}', [SesiPesertaController::class, 'join']);
Route::get('/sesi/peserta/{peserta_id}', [SesiPesertaController::class, 'get']);
Route::get('/sesi/{session_id}/restore/{peserta_id}', [SesiPesertaController::class, 'restore']);