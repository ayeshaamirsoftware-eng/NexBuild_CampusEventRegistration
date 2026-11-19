# NexBuild Community Event Registration

NexBuild is a full-stack community event platform built with Laravel 11 and React. It supports member discovery and registration, waitlists, organizer event management, registrant rosters, and attendance check-in.

## Requirements

- Windows with Laragon or another PHP/MySQL development environment
- PHP 8.2+
- Composer
- Node.js 20+
- MySQL

## Backend Setup

1. Start MySQL from Laragon.
2. Create a database named `campus_events`.
3. Open a terminal in `backend/` and install dependencies:

```powershell
composer install
cp .env.example .env
php artisan key:generate
```

4. Confirm these values in `backend/.env`:

```text
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=campus_events
DB_USERNAME=root
DB_PASSWORD=
```

5. Create and seed the database:

```powershell
php artisan migrate:fresh --seed
php artisan serve --host=127.0.0.1 --port=8000
```

The API is available at `http://127.0.0.1:8000/api`.

## Frontend Setup

Open a separate terminal in `frontend/`:

```powershell
npm install
npm run dev
```

Open `http://localhost:5173`. The frontend also supports `http://127.0.0.1:5173`.

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Organizer | `organizer@campus.edu` | `password` |
| Member/Explorer | `student1@campus.edu` | `password` |

The student demo seed includes a confirmed registration, a waitlisted registration, and a cancelled registration.

## Main Features

- Sanctum login and registration with role-based route protection
- Member event discovery, search, category filtering, sorting, and capacity indicators
- Event detail pages with deadlines and sticky booking summaries
- Confirmed registration, waitlist entry, and cancellation
- Automatic promotion of the oldest waitlisted member after eligible cancellation
- Upcoming/past registration views with status filtering
- Light, Dark, and live System themes
- Organizer event dashboard and KPIs
- Create/edit event slide-over with inline and API validation
- Publish, close, and draft event status controls
- Registrant search, status filtering, and live attendance check-in
- Loading skeletons, empty states, confirmation dialogs, and toast feedback

## Verification

From `backend/`:

```powershell
php artisan test
```

From `frontend/`:

```powershell
npm run build
```

## API Behavior

The backend is protected by Laravel Sanctum and role middleware. Registration, waitlist promotion, cancellation, organizer event management, and attendance actions continue to use the existing `/api` routes and database schema.
