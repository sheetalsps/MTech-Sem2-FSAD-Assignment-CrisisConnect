# CrisisConnect

Emergency Resource Coordination System for flood, earthquake, and local disaster response.

## Overview

CrisisConnect connects emergency requests, volunteers, and resource availability through a React frontend and Node.js microservice backend with MongoDB database.

### Features

- SOS request submission
- Volunteer matching
- Resource inventory
- AI priority classification
- Incident management (CRUD operations)
- API gateway with backend microservices

## Architecture

- `frontend/` — React + Vite user interface
- `backend/` — Node.js microservices
  - `gateway-service.js`
  - `incident-service.js`
  - `volunteer-service.js`
  - `resource-service.js`
  - `priority-service.js`

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (Community Edition)

### Installing MongoDB

#### Windows
1. Download MongoDB Community Edition from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Run the installer and follow the setup wizard
3. Start MongoDB service or run `mongod` from command line

#### Using Docker (Alternative)
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## Run locally

1. Install MongoDB (see Prerequisites above)
2. Install dependencies: `npm install`
3. Install both workspaces: `npm run install:all`
4. Start MongoDB service
5. Start the system: `npm start`

## API Endpoints

### Incidents
- `GET /api/incidents` - Get all incidents
- `GET /api/incidents/:id` - Get incident by ID
- `POST /api/incidents` - Create new incident
- `PUT /api/incidents/:id` - Update incident
- `DELETE /api/incidents/:id` - Delete incident

## Notes

This scaffold demonstrates a modular microservice architecture, frontend/backend integration, MongoDB integration, and a foundation for AI-assisted emergency classification.

## AI-assisted development

Use this project to document how GitHub Copilot or similar AI tools helped generate endpoints, components, and workflow structure.
