# Football Coach App Architecture

## Overview

Football Coach App is a monorepo with three applications:

- web – Next.js frontend for coaches
- backend – NestJS API with Prisma and PostgreSQL
- mobile – React Native / Expo app

The current development priority should be the web + backend experience.

---

## Repository Structure

footballcoach-app/

backend  
mobile  
web  
docs  

README.md  

---

## High-Level System Architecture

Coach  
↓  
Web App (Next.js)  
↓  
Backend API (NestJS)  
↓  
Prisma ORM  
↓  
PostgreSQL  

---

## Core Domains

Auth  
Handles login, registration and authentication.

Teams  
Handles team creation and management.

Players  
Handles player profiles and attributes.

Drills  
Handles training exercises and drill library.

Sessions  
Handles training session creation and history.

Planner  
Handles session planning and AI-assisted suggestions.

---

## Development Principles

Feature-first structure  
Group code by domain instead of file type.

Thin controllers and pages  
Business logic should live in services and features.

Shared API logic  
Frontend API calls should be centralized.

MVP first  
Focus on the core coaching workflow before advanced features.

---

## Refactor Plan

1. create docs/architecture.md
2. create docs/roadmap.md
3. create web/src/features
4. create backend/src modules
5. move auth
6. move teams
7. move players
8. move drills
9. move sessions
10. move planner
