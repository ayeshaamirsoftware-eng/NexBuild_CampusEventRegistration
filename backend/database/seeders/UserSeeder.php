<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = [
            [
                'name' => 'Campus Organizer',
                'email' => 'organizer@campus.edu',
                'role' => 'organizer',
            ],
            [
                'name' => 'Student One',
                'email' => 'student1@campus.edu',
                'role' => 'student',
            ],
            [
                'name' => 'Student Two',
                'email' => 'student2@campus.edu',
                'role' => 'student',
            ],
            [
                'name' => 'Student Three',
                'email' => 'student3@campus.edu',
                'role' => 'student',
            ],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(
                ['email' => $user['email']],
                [
                    'name' => $user['name'],
                    'role' => $user['role'],
                    'password' => 'password',
                ],
            );
        }
    }
}
