# Football Coach App Roadmap

## Product Direction

The short-term goal is to build a stable coaching workflow in the web application.

The long-term goal is to become an AI-assisted coaching platform for football coaches.

---

## Phase 1 — Foundation

### Goal
Create a clean and understandable project base.

### Tasks
- improve documentation
- create architecture documentation
- create roadmap documentation
- define clear development priorities
- clean up project structure
- verify local setup for web and backend

### Success Criteria
- project is easier to understand
- documentation matches the actual product
- the next refactor steps are clear

---

## Phase 2 — MVP Core Flow

### Goal
Make the first complete coach journey work from start to finish.

### Main User Flow

Log in  
↓  
Create team  
↓  
Add players  
↓  
Browse drills  
↓  
Create training session  
↓  
Save session  

### Tasks
- stabilize login and registration
- protect authenticated routes
- stabilize team creation and team list
- stabilize player creation and player list
- make drill browsing usable
- make session creation and saving work

### Success Criteria
- one coach can complete the full workflow without manual fixes
- navigation works across the main pages
- the core product feels usable

---

## Phase 3 — Structure Refactor

### Goal
Refactor the codebase into clear feature-based modules.

### Web Tasks
- create `web/src/features/auth`
- create `web/src/features/teams`
- create `web/src/features/players`
- create `web/src/features/drills`
- create `web/src/features/sessions`
- create `web/src/features/planner`

### Backend Tasks
- create `backend/src/auth`
- create `backend/src/teams`
- create `backend/src/players`
- create `backend/src/drills`
- create `backend/src/sessions`
- create `backend/src/planner`
- create shared `common` and `prisma` modules if needed

### Success Criteria
- code is easier to navigate
- logic is grouped by domain
- future development becomes easier and safer

---

## Phase 4 — Smart Planning

### Goal
Turn the platform into a smart coaching assistant.

### Tasks
- improve rule-based training planning
- recommend drills by age and focus
- recommend drills based on player weaknesses
- generate full training sessions automatically
- support reusable session templates

### Success Criteria
- coach can generate a useful session quickly
- generated sessions are relevant and editable
- planning becomes a clear product strength

---

## Phase 5 — Player Development

### Goal
Support long-term player development.

### Tasks
- track player attributes over time
- store coach notes
- connect sessions to development goals
- create simple progress history

### Success Criteria
- coach can follow player improvement
- player data becomes useful for planning
- the platform creates long-term value

---

## Phase 6 — Advanced Coaching Tools

### Goal
Differentiate the product from simple drill libraries.

### Tasks
- tactical board
- formation planning
- match notes
- training templates
- printable/exportable session plans

### Success Criteria
- the product feels complete
- coaches can use it as their main planning workspace

---

## Phase 7 — Club Features

### Goal
Expand from one coach to larger organizations.

### Tasks
- multiple coaches per club
- shared drill library
- shared methodology
- team-based permissions
- club-level templates

### Success Criteria
- clubs can use the platform across multiple teams
- knowledge can be shared between coaches

---

## Immediate Refactor Order

1. create `docs/architecture.md`
2. create `docs/roadmap.md`
3. create new folders in `web/src/features`
4. create new folders in `backend/src`
5. move auth first
6. move teams
7. move players
8. move drills
9. move sessions
10. move planner last

---

## MVP Definition of Done

The MVP is done when a coach can:

- create an account
- log in
- create a team
- add players
- browse drills
- create a training session
- save and reopen sessions