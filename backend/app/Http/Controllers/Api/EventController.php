<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\EventIndexRequest;
use App\Models\Event;
use App\Models\EventCategory;
use App\Models\EventRegistration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class EventController extends Controller
{
    public function categories(): JsonResponse
    {
        return response()->json(EventCategory::query()->orderBy('name')->get());
    }

    public function index(EventIndexRequest $request): JsonResponse
    {
        $events = Event::query()
            ->where('status', 'published')
            ->with([
                'category',
                'organizer:id,name,email',
            ])
            ->when($request->filled('search'), function ($query) use ($request): void {
                $search = $request->validated('search');

                $query->where(function ($query) use ($search): void {
                    $query->where('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('location', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('category_id'), function ($query) use ($request): void {
                $query->where('category_id', $request->validated('category_id'));
            })
            ->orderBy('event_date')
            ->get();

        return response()->json($events);
    }

    public function show(int $id): JsonResponse
    {
        $event = Event::query()
            ->where('status', 'published')
            ->with(['category', 'organizer:id,name,email'])
            ->findOrFail($id);

        $user = Auth::guard('sanctum')->user();
        $event->setAttribute(
            'registration_status',
            $user
                ? $event->registrations()->where('user_id', $user->id)->latest('id')->value('status')
                : null,
        );

        return response()->json($event);
    }

    public function myRegistrations(Request $request): JsonResponse
    {
        $registrations = EventRegistration::query()
            ->where('user_id', $request->user()->id)
            ->with([
                'event.category',
                'event.organizer:id,name,email',
            ])
            ->orderByDesc('id')
            ->get();

        return response()->json($registrations);
    }

    public function register(Request $request, int $id): JsonResponse
    {
        $registration = DB::transaction(function () use ($request, $id): EventRegistration {
            $event = Event::query()->whereKey($id)->lockForUpdate()->firstOrFail();

            if ($event->status !== 'published') {
                throw ValidationException::withMessages([
                    'event' => 'This event is not open for registration.',
                ]);
            }

            if (now()->gt($event->registration_deadline)) {
                throw ValidationException::withMessages([
                    'event' => 'The registration deadline has passed.',
                ]);
            }

            $hasActiveRegistration = $event->registrations()
                ->where('user_id', $request->user()->id)
                ->whereIn('status', ['confirmed', 'waitlisted'])
                ->exists();

            if ($hasActiveRegistration) {
                throw ValidationException::withMessages([
                    'event' => 'You already have an active registration for this event.',
                ]);
            }

            $status = $event->available_seats > 0 ? 'confirmed' : 'waitlisted';

            if ($status === 'confirmed') {
                $event->decrement('available_seats');
            }

            return $event->registrations()->create([
                'user_id' => $request->user()->id,
                'status' => $status,
            ]);
        });

        return response()->json([
            'registration' => $registration->load('event'),
        ], 201);
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        $registration = DB::transaction(function () use ($request, $id): EventRegistration {
            $event = Event::query()->whereKey($id)->lockForUpdate()->firstOrFail();
            $registration = $event->registrations()
                ->where('user_id', $request->user()->id)
                ->whereIn('status', ['confirmed', 'waitlisted'])
                ->lockForUpdate()
                ->first();

            if (! $registration) {
                throw ValidationException::withMessages([
                    'registration' => 'No active registration exists for this event.',
                ]);
            }

            if (now()->gt($event->cancellation_deadline)) {
                throw ValidationException::withMessages([
                    'event' => 'The cancellation deadline has passed.',
                ]);
            }

            $wasConfirmed = $registration->status === 'confirmed';
            $registration->update(['status' => 'cancelled']);

            if ($wasConfirmed) {
                $nextWaitlisted = $event->registrations()
                    ->where('status', 'waitlisted')
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->first();

                if ($nextWaitlisted) {
                    $nextWaitlisted->update(['status' => 'confirmed']);
                } else {
                    $event->increment('available_seats');
                }
            }

            return $registration;
        });

        return response()->json([
            'registration' => $registration->load('event'),
        ]);
    }
}
