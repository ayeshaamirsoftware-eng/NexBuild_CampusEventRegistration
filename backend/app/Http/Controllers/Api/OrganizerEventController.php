<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AttendanceRequest;
use App\Http\Requests\StoreEventRequest;
use App\Http\Requests\UpdateEventRequest;
use App\Http\Requests\UpdateEventStatusRequest;
use App\Models\Event;
use App\Models\EventAttendance;
use App\Models\EventRegistration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrganizerEventController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $events = Event::query()
            ->where('organizer_id', $request->user()->id)
            ->with('category')
            ->withCount([
                'registrations as confirmed_count' => fn ($query) => $query->where('status', 'confirmed'),
                'registrations as waitlisted_count' => fn ($query) => $query->where('status', 'waitlisted'),
            ])
            ->orderBy('event_date')
            ->get();

        return response()->json($events);
    }

    public function store(StoreEventRequest $request): JsonResponse
    {
        $event = Event::query()->create([
            ...$request->validated(),
            'organizer_id' => $request->user()->id,
            'available_seats' => $request->validated('capacity'),
            'status' => 'draft',
        ]);

        return response()->json(['event' => $event->load('category')], 201);
    }

    public function update(UpdateEventRequest $request, int $id): JsonResponse
    {
        $event = DB::transaction(function () use ($request, $id): Event {
            $event = Event::query()
                ->where('organizer_id', $request->user()->id)
                ->whereKey($id)
                ->lockForUpdate()
                ->firstOrFail();

            $data = $request->validated();
            $capacity = (int) $data['capacity'];

            if ($capacity !== $event->capacity) {
                $confirmedCount = $event->registrations()
                    ->where('status', 'confirmed')
                    ->count();

                if ($capacity < $confirmedCount) {
                    throw ValidationException::withMessages([
                        'capacity' => 'Capacity cannot be lower than the number of confirmed registrants.',
                    ]);
                }

                $data['available_seats'] = $capacity - $confirmedCount;
            }

            $event->update($data);

            return $event->load('category');
        });

        return response()->json(['event' => $event]);
    }

    public function updateStatus(UpdateEventStatusRequest $request, int $id): JsonResponse
    {
        $event = Event::query()
            ->where('organizer_id', $request->user()->id)
            ->whereKey($id)
            ->firstOrFail();

        $event->update($request->validated());

        return response()->json(['event' => $event]);
    }

    public function registrants(Request $request, int $id): JsonResponse
    {
        $event = Event::query()
            ->where('organizer_id', $request->user()->id)
            ->findOrFail($id);

        $registrations = $event->registrations()
            ->whereIn('status', ['confirmed', 'waitlisted'])
            ->with('user:id,name,email')
            ->orderBy('id')
            ->get();
        $attendances = EventAttendance::query()
            ->where('event_id', $event->id)
            ->whereIn('user_id', $registrations->pluck('user_id'))
            ->get()
            ->keyBy('user_id');

        return response()->json($registrations->map(fn (EventRegistration $registration): array => [
            'id' => $registration->id,
            'status' => $registration->status,
            'user' => $registration->user,
            'attendance' => $attendances->get($registration->user_id),
        ])->values());
    }

    public function attendance(AttendanceRequest $request, int $id): JsonResponse
    {
        $attendance = DB::transaction(function () use ($request, $id): EventAttendance {
            $event = Event::query()
                ->where('organizer_id', $request->user()->id)
                ->whereKey($id)
                ->lockForUpdate()
                ->firstOrFail();
            $userId = $request->validated('user_id');
            $isConfirmedRegistrant = $event->registrations()
                ->where('user_id', $userId)
                ->where('status', 'confirmed')
                ->exists();

            if (! $isConfirmedRegistrant) {
                throw ValidationException::withMessages([
                    'user_id' => 'Attendance can only be recorded for a confirmed registrant.',
                ]);
            }

            $attendance = EventAttendance::query()
                ->where('event_id', $event->id)
                ->where('user_id', $userId)
                ->lockForUpdate()
                ->first() ?? new EventAttendance([
                    'event_id' => $event->id,
                    'user_id' => $userId,
                ]);
            $attended = $request->boolean('attended');
            $attendance->attended = $attended;
            $attendance->checked_in_at = $attended
                ? ($attendance->checked_in_at ?? now())
                : null;
            $attendance->save();

            return $attendance;
        });

        return response()->json(['attendance' => $attendance]);
    }
}
