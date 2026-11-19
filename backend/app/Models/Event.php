<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'organizer_id',
    'category_id',
    'title',
    'description',
    'location',
    'event_date',
    'registration_deadline',
    'cancellation_deadline',
    'capacity',
    'available_seats',
    'status',
])]
class Event extends Model
{
    public function organizer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'organizer_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(EventCategory::class, 'category_id');
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(EventRegistration::class);
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(EventAttendance::class);
    }

    protected function casts(): array
    {
        return [
            'event_date' => 'datetime',
            'registration_deadline' => 'datetime',
            'cancellation_deadline' => 'datetime',
            'capacity' => 'integer',
            'available_seats' => 'integer',
        ];
    }
}
