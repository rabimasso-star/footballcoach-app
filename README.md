# Football Coach App ⚽

Football Coach App is a platform designed to help football coaches manage teams, plan training sessions, and develop players more efficiently.

The goal is to create an **all-in-one coaching platform** that combines player management, training planning, and intelligent coaching tools.

This project is currently under active development.

---

# Features

The platform is designed to support coaches with:

### Team Management
- Create and manage teams
- Organize squad lists
- Track team attributes

### Player Profiles
- Add players to teams
- Track player attributes
- Monitor player development

### Drill Library
- Browse training drills
- Filter drills by category
- Select drills for sessions

### Training Session Planner
Create structured training sessions.

Example:

Warmup – 15 min  
Passing Drill – 20 min  
Small Sided Game – 25 min  
Finishing – 15 min

### Smart Session Planning
Generate training sessions based on:

- age group
- team skill level
- training focus

---

# Project Architecture

This project is organized as a **monorepo** containing multiple applications.

footballcoach-app  
│  
├── backend  
│   NestJS API with Prisma and PostgreSQL  
│  
├── web  
│   Next.js frontend application  
│  
├── mobile  
│   React Native mobile app (planned)  
│  
└── docs  
Project documentation

---

# Tech Stack

## Frontend

- Next.js
- React
- TypeScript
- TailwindCSS

## Backend

- NestJS
- Prisma ORM
- PostgreSQL

## Mobile (Planned)

- React Native
- Expo

---

# Getting Started

## 1 Clone the repository

git clone https://github.com/rabimasso-star/footballcoach-app.git

---

## 2 Install dependencies

Backend

cd backend  
npm install  

Frontend

cd web  
npm install  

---

## 3 Setup environment variables

Create `.env` files.

Backend example:

DATABASE_URL=postgresql://user:password@localhost:5432/footballcoach  
JWT_SECRET=your_secret  

Frontend example:

NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1  

---

## 4 Run development servers

Backend

npm run start:dev  

Frontend

npm run dev  

Open in browser

http://localhost:3001

---

# Future Features

The long-term vision of the platform includes:

- Tactical board for match and training planning
- Weekly training planner
- AI training session generator
- Player development tracking
- Match analysis tools
- Club management tools

---

# Target Users

Football Coach App is designed for:

- Youth football coaches
- Amateur football teams
- Football academies
- Grassroots football organizations

---

# Contributing

Contributions are welcome.

If you would like to contribute:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

---

# License

MIT License
