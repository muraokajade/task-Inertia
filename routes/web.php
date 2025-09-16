<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TaskController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => redirect('/login'));

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth'])->group(function () {
    Route::get('/tasks', [TaskController::class,'index'])->name('tasks.index');
    Route::post('/tasks', [TaskController::class,'store'])->name('tasks.store');
    Route::get('/tasks/{task}/edit', [TaskController::class,'edit'])->name('tasks.edit');
    Route::put('/tasks/{task}', [TaskController::class,'update'])->name('tasks.update');
    Route::delete('/tasks/{task}', [TaskController::class,'destroy'])->name('tasks.destroy');
    Route::post('/tasks/bulk', [TaskController::class,'bulk'])->name('tasks.bulk');
    // routes/web.php（authグループ内など）
    Route::patch('/tasks/reorder', [TaskController::class, 'reorder'])->name('tasks.reorder');
});

require __DIR__ . '/auth.php';
