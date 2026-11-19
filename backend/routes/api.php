<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\OrganizerEventController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/categories', [EventController::class, 'categories']);
Route::get('/events', [EventController::class, 'index']);
Route::get('/events/{id}', [EventController::class, 'show']);

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', fn (Request $request) => response()->json($request->user()));

    Route::middleware('role:student')->group(function (): void {
        Route::get('/my-registrations', [EventController::class, 'myRegistrations']);
        Route::post('/events/{id}/register', [EventController::class, 'register']);
        Route::post('/events/{id}/cancel', [EventController::class, 'cancel']);
    });

    Route::prefix('organizer')
        ->middleware('role:organizer')
        ->group(function (): void {
            Route::get('/events', [OrganizerEventController::class, 'index']);
            Route::post('/events', [OrganizerEventController::class, 'store']);
            Route::put('/events/{id}', [OrganizerEventController::class, 'update']);
            Route::patch('/events/{id}/status', [OrganizerEventController::class, 'updateStatus']);
            Route::get('/events/{id}/registrants', [OrganizerEventController::class, 'registrants']);
            Route::post('/events/{id}/attendance', [OrganizerEventController::class, 'attendance']);
        });
});
