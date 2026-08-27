# Realtime Collaboration Platform

A backend foundation for collaborative workspaces, built with Node.js, Express, Supabase, and Redis.

The platform currently provides authentication, user profiles, and workspace management. Its database is designed to support documents, messages, invitations, and whiteboards as the collaboration features expand.

## Features

- Supabase email/password authentication
- JWT-protected API routes
- User profile lookup
- Workspace creation, listing, retrieval, renaming, and deletion
- Redis connection for application caching and realtime-oriented infrastructure
- Supabase migrations for the core collaboration data model
- Structured HTTP logging with Pino
- Environment validation with Zod
- Graceful HTTP server and Redis shutdown

## Technology Stack

| Layer | Technology |
| --- | --- |
| Runtime | Node.js (ES modules) |
| API | Express 5 |
| Authentication and database | Supabase |
| Cache and infrastructure | Redis via `ioredis` |
| Logging | Pino and `pino-http` |
| Validation | Zod |
| Development | Nodemon and Supabase CLI |

## Project Structure

```text
.
├── server/
│   ├── src/
│   │   ├── config/          # Environment, Supabase, and Redis clients
│   │   ├── controllers/     # HTTP request handlers
│   │   ├── middleware/      # Authentication and error handling
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Application and data-access logic
│   │   ├── app.js           # Express application
│   │   └── index.js         # Application entry point
│   └── package.json
└── supabase/
    ├── migrations/          # Database schema and stored procedures
    └── config.toml
```

## Prerequisites

- Node.js 20 or newer
- A Supabase project
- A Redis instance
- Supabase CLI, if you want to run migrations locally

## Getting Started

### 1. Install dependencies

From the repository root:

```bash
npm install
cd server
npm install
```

### 2. Configure environment variables

Create `server/.env` with the following values:

```env
NODE_ENV=development
PORT=3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
REDIS_URL=redis://localhost:6379
```

Keep `SUPABASE_SERVICE_ROLE_KEY` private. It must only be used by the server and must never be exposed to a browser or committed to source control.

### 3. Apply the database migrations

For a local Supabase environment:

```bash
npx supabase start
npx supabase db reset
```

To link and push migrations to a hosted Supabase project, use the Supabase CLI workflow for your project:

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

### 4. Start the API

From the `server` directory:

```bash
npm run dev
```

For a production-style start:

```bash
npm start
```

The API listens on `http://localhost:3000` by default. Confirm it is running with:

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{"status":"ok"}
```

## API Reference

All successful API responses use the shape `{ "success": true, "data": ... }`. Protected routes require a Supabase access token:

```http
Authorization: Bearer <access-token>
```

### Authentication

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/signup` | No | Create an account with `name`, `email`, and `password` |
| `POST` | `/api/auth/login` | No | Authenticate with `email` and `password` |

### Users

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/users/me` | Yes | Return the authenticated user profile |

### Workspaces

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/workspaces` | Yes | Create a workspace with `name` |
| `GET` | `/api/workspaces` | Yes | List workspaces available to the authenticated user |
| `GET` | `/api/workspaces/:id` | Yes | Get one workspace |
| `PATCH` | `/api/workspaces/:id` | Yes | Rename a workspace with `name` |
| `DELETE` | `/api/workspaces/:id` | Yes | Delete a workspace |

Example workspace request:

```bash
curl -X POST http://localhost:3000/api/workspaces \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Product Design\"}"
```

## Database Model

The initial migrations define these core entities:

- `users` - application profiles linked to `auth.users`
- `workspaces` - collaborative spaces owned by a user
- `workspace_members` - workspace membership and roles
- `invitations` - pending and completed workspace invitations
- `documents` - workspace documents
- `messages` - workspace messages
- `whiteboards` - persisted whiteboard state

Workspace creation uses the `create_workspace_with_owner` database function so the workspace owner, owner membership, and initial whiteboard are created together.

## Development Notes

- The server exits during startup when required environment variables are missing or invalid.
- Protected routes validate Supabase JWTs using Supabase's published JWKS endpoint.
- The current automated test script is a placeholder; add API and service tests as the platform grows.

## License

This project is currently marked as `ISC` in its package metadata.