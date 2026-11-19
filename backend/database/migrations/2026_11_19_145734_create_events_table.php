<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organizer_id')->constrained('users');
            $table->foreignId('category_id')->constrained('event_categories');
            $table->string('title');
            $table->text('description');
            $table->string('location');
            $table->dateTime('event_date');
            $table->dateTime('registration_deadline');
            $table->dateTime('cancellation_deadline');
            $table->unsignedInteger('capacity');
            $table->unsignedInteger('available_seats');
            $table->enum('status', ['draft', 'published', 'closed'])->default('draft');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
