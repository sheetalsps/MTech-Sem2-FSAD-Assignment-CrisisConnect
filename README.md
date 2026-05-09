# CrisisConnect

Emergency Resource Coordination System for flood, earthquake, and local disaster response.

## Overview

CrisisConnect connects emergency requests, volunteers, and resource availability through a React frontend and Node.js microservice backend.

### Features

- SOS request submission
- Volunteer matching
- Resource inventory
- AI priority classification
- API gateway with backend microservices

## Architecture

- `frontend/` — React + Vite user interface
- `backend/` — Node.js microservices
  - `gateway-service.js`
  - `incident-service.js`
  - `volunteer-service.js`
  - `resource-service.js`
  - `priority-service.js`

## Run locally

1. Install dependencies: `npm install`
2. Install both workspaces: `npm run install:all`
3. Start the system: `npm start`

## Notes

This scaffold demonstrates a modular microservice architecture, frontend/backend integration, and a foundation for AI-assisted emergency classification.

## AI-assisted development

Use this project to document how GitHub Copilot or similar AI tools helped generate endpoints, components, and workflow structure.
