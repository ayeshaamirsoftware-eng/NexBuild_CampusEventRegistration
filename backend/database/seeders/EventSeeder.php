<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\EventCategory;
use App\Models\User;
use Illuminate\Database\Seeder;

class EventSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $organizer = User::query()
            ->where('email', 'organizer@campus.edu')
            ->firstOrFail();

        $events = [
            [
                'title' => 'Campus Innovation Expo',
                'description' => 'Explore student-led projects and emerging ideas from across campus.',
                'category' => 'Academic & Research',
                'location' => 'University Convention Hall',
                'days_until_event' => 30,
                'capacity' => 250,
                'available_seats' => 1,
                'status' => 'published',
            ],
            [
                'title' => 'Welcome Week Picnic',
                'description' => 'Meet fellow students and enjoy an afternoon on the campus lawn.',
                'category' => 'Social & Recreation',
                'location' => 'North Campus Green',
                'days_until_event' => 35,
                'capacity' => 80,
                'available_seats' => 80,
                'status' => 'published',
            ],
            [
                'title' => 'Undergraduate Research Showcase',
                'description' => 'Students present their research and answer questions from the community.',
                'category' => 'Academic & Research',
                'location' => 'Science Building Atrium',
                'days_until_event' => 40,
                'capacity' => 150,
                'available_seats' => 122,
                'status' => 'published',
            ],
            [
                'title' => 'Career Networking Fair',
                'description' => 'Connect with employers, alumni, and campus career services.',
                'category' => 'Career & Professional Development',
                'location' => 'Student Center Ballroom',
                'days_until_event' => 45,
                'capacity' => 300,
                'available_seats' => 75,
                'status' => 'published',
            ],
            [
                'title' => 'Campus Open Mic Night',
                'description' => 'An evening of music, poetry, and performances by campus artists.',
                'category' => 'Arts & Culture',
                'location' => 'Black Box Theater',
                'days_until_event' => 50,
                'capacity' => 100,
                'available_seats' => 54,
                'status' => 'draft',
            ],
        ];

        foreach ($events as $event) {
            $eventDate = now()->addDays($event['days_until_event'])->setTime(18, 0);

            Event::updateOrCreate(
                ['title' => $event['title']],
                [
                    'organizer_id' => $organizer->id,
                    'category_id' => EventCategory::query()
                        ->where('name', $event['category'])
                        ->firstOrFail()
                        ->id,
                    'description' => $event['description'],
                    'location' => $event['location'],
                    'event_date' => $eventDate,
                    'registration_deadline' => $eventDate->copy()->subDays(7),
                    'cancellation_deadline' => $eventDate->copy()->subDays(3),
                    'capacity' => $event['capacity'],
                    'available_seats' => $event['available_seats'],
                    'status' => $event['status'],
                ],
            );
        }
    }
}
