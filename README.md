# CrisisConnect

Emergency resource coordination for flood, earthquake, and local disaster response: SOS reporting, volunteer coordination, inventory, and role-based operations dashboards.

## Overview

CrisisConnect is a React single-page application backed by a Node.js **API gateway** that fronts multiple **microservices**. Persistent data lives in **MongoDB** (`mongodb://localhost:27017/crisisconnect`). Authentication uses bearer tokens issued by the auth service (sessions stored in memory on the auth process).

## Features

**Citizens**

- Account signup and login with selectable roles (including dedicated volunteer signup).
- SOS requests with optional GPS, description, and image/video attachments (stored as data URLs on the incident).
- Track requests and status; share updated GPS (“live location”) and view a short location trail on incident detail.
- Chat thread per incident with responders.

**Volunteers**

- Volunteer profile registration (`pending` until staff/admin **approve** or **reject**).
- Volunteer hub: find **nearby** open incidents (GPS + radius), **offer help**, and manage **assignments** (accept/decline, progress notes, complete).
- Navigation aid via **Open in Google Maps** links from incident coordinates.

**Staff and administrators**

- Incident CRUD, volunteer roster CRUD, resource CRUD.
- Assign responders to incidents from the roster; broadcast-style emergency **alerts** (admin creates broadcasts visible on the dashboard).
- **Analytics** summary (counts by status/priority, seven-day volume, active assignments).
- **Admin**: user list, role changes, account deletion.

**Resources**

- Inventory with categories and quantities; specialized modes for **hospital beds** (ward/unit labels) and **blood donation needs** (group + urgency).

**Platform**

- Keyword-based **priority** suggestion (“AI” classification service).
- **Swagger / OpenAPI** documentation served by the gateway.

## Architecture

| Layer | Location | Notes |
|--------|-----------|--------|
| Frontend | `frontend/` | React (Vite), dev server default port **5173** |
| API gateway | `backend/gateway-service.js` | Port **4000**, JWT verification, routing, **Swagger UI** |
| Incident service | `backend/incident-service.js` | Port **5001**, incidents, broadcasts, analytics summary |
| Volunteer service | `backend/volunteer-service.js` | Port **5002**, volunteer profiles (MongoDB) |
| Resource service | `backend/resource-service.js` | Port **5003**, resource inventory |
| Priority service | `backend/priority-service.js` | Port **5004**, priority classification |
| Auth service | `backend/auth-service.js` | Port **5005**, users and tokens |

All browser and Swagger traffic goes through **`http://localhost:4000`** (prefixed with `/api/…` as documented in OpenAPI).

## User roles

| Role | Typical access |
|------|----------------|
| `user` | Citizen: SOS, my requests, incident detail/chat |
| `volunteer` | Citizen features plus volunteer hub, nearby incidents, assignments (after profile approval) |
| `staff` | Manage incidents, volunteers, resources; analytics; approve volunteers |
| `admin` | Staff capabilities plus user administration and emergency broadcasts |

## Prerequisites

- **Node.js** (v14 or higher recommended; current stack tested with modern Node LTS).
- **MongoDB** (Community Edition or compatible), listening on `localhost:27017`.

### Installing MongoDB

#### Windows

1. Download MongoDB Community Edition from [mongodb.com](https://www.mongodb.com/try/download/community).
2. Run the installer and follow the setup wizard.
3. Start the MongoDB Windows service or run `mongod` from the command line.

#### Using Docker (alternative)

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## Run locally

1. Install and start **MongoDB** (see above).
2. From the repository root: `npm install`
3. Install workspace packages: `npm run install:all`
4. Start the full stack (all backend services + Vite frontend): `npm start`

After startup:

- **Web UI:** [http://localhost:5173](http://localhost:5173)
- **API gateway:** [http://localhost:4000](http://localhost:4000) (`/api/...` routes)

To run **only the backend** processes (no Vite): `npm run start:backend` from the repo root. To run the gateway alone (other services must still be up for full functionality): `npm --prefix backend run start`.

## API documentation

With the API gateway running on port **4000**, interactive docs and the machine-readable spec are available at:

- **Swagger UI:** [http://localhost:4000/api-docs](http://localhost:4000/api-docs)
- **OpenAPI YAML (HTTP):** [http://localhost:4000/openapi.yaml](http://localhost:4000/openapi.yaml)

The same specification is checked into the repo at [`backend/openapi.yaml`](backend/openapi.yaml). In Swagger UI, open **Authorize** and paste a token from `POST /api/auth/login` or `POST /api/auth/signup` (Bearer auth is applied automatically).

## API surface (summary)

The gateway exposes **dozens** of routes. Use **Swagger UI** for the authoritative list, request bodies, and **Try it out**. Highlights:

| Area | Examples |
|------|-----------|
| Auth | `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me` |
| Incidents | CRUD, `GET /api/incidents/nearby`, live location, chat messages, assignment offer/patch, `GET /api/my-requests`, `GET /api/my-assignments` |
| Volunteers | Public vs staff roster via `GET /api/volunteers`, `POST /api/volunteers/register`, approval patch, CRUD (staff) |
| Resources | `GET/POST/PUT/DELETE /api/resources` (no `GET /api/resources/:id` on the gateway; list carries full documents) |
| Operations | `GET /api/analytics/summary`, `GET/POST /api/broadcasts` |
| Admin users | `GET/PUT/DELETE /api/users` |
| Priority | `POST /api/priority` (no JWT required) |

## Notes

- If login fails with **authentication service unavailable**, ensure MongoDB is running and **all** required services are started (especially **auth** on port 5005 and the **gateway** on 4000).
- Large SOS media payloads increase request size; the gateway and incident service accept an enlarged JSON body limit for that purpose.

## AI-assisted development

Use this project to document how GitHub Copilot or similar AI tools helped generate endpoints, components, and workflow structure.
