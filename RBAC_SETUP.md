# Role-Based Access Control — setup

The site now has a real, backend-enforced RBAC system running as **Vercel
serverless functions** (`/api/*`) backed by **Postgres**. Permissions are
checked on every API request, so they cannot be bypassed by editing the page,
typing a URL, or calling an API directly.

## Roles

| Role     | Can see / do                                                                 |
|----------|------------------------------------------------------------------------------|
| **Admin**   | Everything: manage users, manage competitions (create/edit/activate/open/close), view all registrations, and all site pages. |
| **Council** | Only **Advisory Council** content and **Competitions** (view + register). Nothing else. |
| **Student** | Only **Competitions** (view the ones the Admin has opened, and register). |

Admin creates every account (name + email + password + role). There is no
self-signup, and only Admin can create, edit, activate/deactivate, or delete
users.

## One-time setup (≈5 minutes)

1. **Create a Postgres database.** Any of these free options works:
   - Vercel → your project → **Storage → Create → Postgres** (auto-adds `DATABASE_URL`), or
   - [Neon](https://neon.tech) / [Supabase](https://supabase.com) → copy the connection string.

2. **Set Environment Variables** in Vercel → Project → **Settings → Environment
   Variables** (Production + Preview):

   | Name             | Value                                                        |
   |------------------|--------------------------------------------------------------|
   | `DATABASE_URL`   | your Postgres connection string                              |
   | `JWT_SECRET`     | a long random string (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) |
   | `ADMIN_EMAIL`    | the first admin's email (e.g. `admin@iiu.edu.pk`)            |
   | `ADMIN_PASSWORD` | a strong password for that first admin                       |

   (If you use Vercel Postgres it may add `POSTGRES_URL` instead — either copy it
   into `DATABASE_URL`, or rename it.)

3. **Redeploy.** On the first API call the tables are created automatically and
   the first **Admin** account is seeded from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

4. **Log in** as that Admin, then create Council and Student accounts from the
   Admin → Users screen.

## API (all JSON; send `Authorization: Bearer <token>` after login)

| Method & path                         | Who      | Purpose                              |
|---------------------------------------|----------|--------------------------------------|
| `POST /api/auth/login`                | public   | email + password → token + role      |
| `GET  /api/auth/me`                   | any      | current user                         |
| `GET/POST /api/users`                 | admin    | list / create users                  |
| `PATCH/DELETE /api/users/:id`         | admin    | edit (role, active, password) / delete |
| `GET /api/competitions`               | any      | admin: all; council/student: only open ones |
| `POST /api/competitions`              | admin    | create                               |
| `PATCH/DELETE /api/competitions/:id`  | admin    | edit / activate / open / close / delete |
| `POST /api/competitions/:id/register` | student, council | register for an open competition |
| `GET /api/competitions/:id/registrations` | admin | who registered                    |

Every non-public route returns **401** without a valid token and **403** if the
role is not allowed — enforced server-side, independent of the UI.
