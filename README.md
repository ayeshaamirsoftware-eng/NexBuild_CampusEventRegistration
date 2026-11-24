# Campus Event Registration System

A full-stack campus event management and seat registration platform built with Laravel 11 and React. Students can browse upcoming events, reserve seats, join waitlists when events reach capacity, and manage registrations. Organizers can manage events, review attendee rosters, and record event check-ins.

## Tech Stack

- **Backend:** PHP 8.3, Laravel 11, Laravel Sanctum token authentication, MySQL
- **Frontend:** React, Vite, React Router, Axios, Tailwind CSS v4, Lucide icons

## Project Structure

```text
backend/     Laravel REST API, migrations, seeders, and feature tests
frontend/    React + Vite single-page client
README.md    Setup and project documentation
```

## Requirements

- Windows with Laragon or another PHP/MySQL environment
- PHP 8.2 or newer and Composer
- Node.js and npm
- MySQL

## Setup

### 1. Configure the database

Start MySQL in Laragon and create a database named `campus_events`.

In `backend/.env`, configure the database connection:

```dotenv
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=campus_events
DB_USERNAME=root
DB_PASSWORD=
```

### 2. Start the Laravel API

In a PowerShell terminal:

```powershell
Set-Location .\backend
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve --host=127.0.0.1 --port=8000
```

The API base URL is `http://127.0.0.1:8000/api`.

To reset the database and reseed all sample data, run `php artisan migrate:fresh --seed`. **This deletes existing database records.**

### 3. Start the React client

In a second PowerShell terminal:

```powershell
Set-Location .\frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`. The API CORS configuration also allows `localhost` and `127.0.0.1` on ports `5173` and `5174`.

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Organizer | `organizer@campus.edu` | `password` |
| Student | `student1@campus.edu` | `password` |

Seed data includes sample events and confirmed, waitlisted, and cancelled registrations for the student account.

## Features

- Token-based login and registration with student and organizer role protection
- Event discovery with search, category filters, sorting, and seat availability
- Event details, registration deadlines, cancellation policies, and responsive local event imagery
- Seat confirmation, waitlist registration, and cancellation
- Automatic promotion of the oldest waitlisted student when an eligible confirmed registration is cancelled
- Student registration list with status filters and upcoming/past grouping
- Organizer dashboard with event and registration KPIs
- Create and edit events, with client and API validation
- Publish, close, and draft event status management
- Attendee roster with search, status filters, and attendance check-in timestamps
- Light, dark, and system themes
- Responsive layouts, loading states, empty states, confirmation dialogs, and toast notifications

## API Routes

Public routes:

- `POST /api/register`
- `POST /api/login`
- `GET /api/categories`
- `GET /api/events`
- `GET /api/events/{id}`

Authenticated student routes:

- `GET /api/my-registrations`
- `POST /api/events/{id}/register`
- `POST /api/events/{id}/cancel`

Authenticated organizer routes:

- `GET /api/organizer/events`
- `POST /api/organizer/events`
- `PUT /api/organizer/events/{id}`
- `PATCH /api/organizer/events/{id}/status`
- `GET /api/organizer/events/{id}/registrants`
- `POST /api/organizer/events/{id}/attendance`

## Run Tests and Build

Backend tests:

```powershell
Set-Location .\backend
php artisan test
```

Frontend production build:

```powershell
Set-Location .\frontend
npm run build
```
