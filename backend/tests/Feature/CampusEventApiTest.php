<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\EventCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CampusEventApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_and_cancellation_promote_oldest_waitlisted_student(): void
    {
        $category = EventCategory::query()->create(['name' => 'Academic']);
        $event = $this->createEvent($category, [
            'capacity' => 1,
            'available_seats' => 1,
        ]);
        $firstStudent = User::factory()->create(['role' => 'student']);
        $secondStudent = User::factory()->create(['role' => 'student']);

        Sanctum::actingAs($firstStudent);
        $this->postJson("/api/events/{$event->id}/register")
            ->assertCreated()
            ->assertJsonPath('registration.status', 'confirmed');

        Sanctum::actingAs($secondStudent);
        $this->postJson("/api/events/{$event->id}/register")
            ->assertCreated()
            ->assertJsonPath('registration.status', 'waitlisted');
        $this->postJson("/api/events/{$event->id}/register")->assertUnprocessable();
        $this->getJson("/api/events/{$event->id}")
            ->assertOk()
            ->assertJsonPath('registration_status', 'waitlisted')
            ->assertJsonPath('capacity', 1);

        $otherStudent = User::factory()->create(['role' => 'student']);
        Sanctum::actingAs($otherStudent);
        $this->postJson("/api/events/{$event->id}/cancel")->assertUnprocessable();

        Sanctum::actingAs($firstStudent);
        $this->postJson("/api/events/{$event->id}/cancel")->assertOk();

        $this->assertDatabaseHas('event_registrations', [
            'event_id' => $event->id,
            'user_id' => $secondStudent->id,
            'status' => 'confirmed',
        ]);
        $this->assertDatabaseHas('events', [
            'id' => $event->id,
            'available_seats' => 0,
        ]);
    }

    public function test_organizer_can_record_and_view_confirmed_registrant_attendance(): void
    {
        $category = EventCategory::query()->create(['name' => 'Academic']);
        $organizer = User::factory()->create(['role' => 'organizer']);
        $student = User::factory()->create(['role' => 'student']);
        $event = $this->createEvent($category, [
            'organizer_id' => $organizer->id,
            'capacity' => 1,
            'available_seats' => 1,
        ]);

        Sanctum::actingAs($student);
        $this->postJson("/api/events/{$event->id}/register")->assertCreated();

        Sanctum::actingAs($organizer);
        $this->postJson("/api/organizer/events/{$event->id}/attendance", [
            'user_id' => $student->id,
            'attended' => true,
        ])->assertOk()
            ->assertJsonPath('attendance.attended', true)
            ->assertJsonStructure(['attendance' => ['checked_in_at']]);

        $this->getJson("/api/organizer/events/{$event->id}/registrants")
            ->assertOk()
            ->assertJsonPath('0.user.id', $student->id)
            ->assertJsonPath('0.attendance.attended', true);
    }

    public function test_student_cannot_access_organizer_routes_and_organizer_can_create_events(): void
    {
        $category = EventCategory::query()->create(['name' => 'Academic']);
        $student = User::factory()->create(['role' => 'student']);
        $organizer = User::factory()->create(['role' => 'organizer']);
        $payload = $this->eventPayload($category->id);

        Sanctum::actingAs($student);
        $this->getJson('/api/organizer/events')->assertForbidden();

        Sanctum::actingAs($organizer);
        $response = $this->postJson('/api/organizer/events', $payload)
            ->assertCreated()
            ->assertJsonPath('event.status', 'draft')
            ->assertJsonPath('event.available_seats', 20);
        $eventId = $response->json('event.id');

        $this->assertDatabaseHas('events', [
            'organizer_id' => $organizer->id,
            'capacity' => 20,
            'available_seats' => 20,
            'status' => 'draft',
        ]);

        $this->putJson("/api/organizer/events/{$eventId}", array_merge($payload, [
            'capacity' => 30,
        ]))->assertOk()
            ->assertJsonPath('event.available_seats', 30);
    }

    public function test_registration_forces_student_role_and_login_returns_role_with_token(): void
    {
        $registrationResponse = $this->postJson('/api/register', [
            'name' => 'New Student',
            'email' => 'new-student@example.com',
            'password' => 'strong-password',
            'password_confirmation' => 'strong-password',
            'role' => 'organizer',
        ]);

        $registrationResponse->assertCreated()
            ->assertJsonPath('user.role', 'student');

        $this->postJson('/api/login', [
            'email' => 'new-student@example.com',
            'password' => 'strong-password',
        ])->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'role']])
            ->assertJsonPath('user.role', 'student');
    }

    public function test_public_event_search_only_returns_matching_published_events(): void
    {
        $category = EventCategory::query()->create(['name' => 'Academic']);
        $this->createEvent($category, ['title' => 'Research Expo']);
        $this->createEvent($category, [
            'title' => 'Private Draft',
            'status' => 'draft',
        ]);

        $this->getJson('/api/events?search=Research&category_id='.$category->id)
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.title', 'Research Expo');
    }

    private function createEvent(EventCategory $category, array $overrides = []): Event
    {
        $organizer = User::factory()->create(['role' => 'organizer']);

        return Event::query()->create(array_merge([
            'organizer_id' => $organizer->id,
            'category_id' => $category->id,
            ...$this->eventPayload($category->id),
            'available_seats' => 20,
            'status' => 'published',
        ], $overrides));
    }

    private function eventPayload(int $categoryId): array
    {
        $eventDate = now()->addDays(20);

        return [
            'category_id' => $categoryId,
            'title' => 'Campus Event',
            'description' => 'A campus event description.',
            'location' => 'Main Hall',
            'event_date' => $eventDate->toDateTimeString(),
            'registration_deadline' => $eventDate->copy()->subDays(5)->toDateTimeString(),
            'cancellation_deadline' => $eventDate->copy()->subDays(2)->toDateTimeString(),
            'capacity' => 20,
        ];
    }
}
