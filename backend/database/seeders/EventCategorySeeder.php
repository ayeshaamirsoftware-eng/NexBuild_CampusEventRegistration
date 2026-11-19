<?php

namespace Database\Seeders;

use App\Models\EventCategory;
use Illuminate\Database\Seeder;

class EventCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach ([
            'Academic & Research',
            'Arts & Culture',
            'Career & Professional Development',
            'Social & Recreation',
        ] as $name) {
            EventCategory::firstOrCreate(['name' => $name]);
        }
    }
}
