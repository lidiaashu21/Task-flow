# TaskFlow

**TaskFlow** is a lightweight full-stack team task management platform inspired by tools such as Trello and Linear. It helps teams organize projects, manage tasks, assign responsibilities, discuss work, and track progress.

Built as a full-stack internship project with a focus on **clean architecture, maintainability, validation, authentication, testing, and practical UX**.

## 🚀 Features

- User registration and login
- Project creation and member invitations
- Task creation, editing, deletion, and assignment
- Task status: `Todo`, `In Progress`, `Done`
- Task priority and due dates
- Task comments
- Search, filtering, and sorting
- Project dashboard with task statistics
- Direct and project messaging
- Responsive desktop and mobile UI
- Backend and frontend tests

## 🛠️ Tech Stack

**Frontend**

- Next.js
- React
- TypeScript
- Tailwind CSS

**Backend**

- Node.js
- Express
- TypeScript
- Drizzle ORM
- PostgreSQL
- JWT
- Zod

**Testing**

- Vitest
- React Testing Library

**Package Manager:** npm

## 🏗️ Architecture

```text
                 ┌─────────────────┐
                 │  Next.js Client │
                 └────────┬────────┘
                          │ REST API
                          ▼
                 ┌─────────────────┐
                 │ Express Backend │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │   PostgreSQL    │
                 └─────────────────┘
```

The backend uses a modular architecture:

```text
Routes → Controllers → Services → Repositories → Database
```

This separates HTTP handling, business logic, and database access.

## 📁 Project Structure

```text
taskflow/
├── design/              # ERD, API contract, wireframes
├── backend/             # Express REST API
│   ├── src/
│   ├── tests/
│   └── drizzle/
├── frontend/            # Next.js application
│   └── src/
└── README.md
```

## ⚙️ Getting Started

### Requirements

- Node.js 20+
- npm
- PostgreSQL

### 1. Clone and install

```bash
git clone <repository-url>
cd taskflow
npm install
```

If frontend and backend have separate dependencies:

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Environment variables

Create:

```text
backend/.env
frontend/.env.local
```

Use the provided `.env.example` files as templates.

Configure the PostgreSQL connection and required application secrets.

**Never commit real secrets.**

### 3. Database

From `backend/`:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 4. Run the application

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

Open **http://localhost:3000**.

## 🧪 Testing

The backend includes authentication and task CRUD tests covering successful and invalid requests.

The frontend includes tests for key functionality such as task creation and filtering.

```bash
npm test
```

For individual applications:

```bash
cd backend
npm test
```

```bash
cd frontend
npm test
```

## 🎨 Design

The design artifacts are included in:

```text
design/
├── erd.png
├── api-contract.md
└── wireframes/
```

These contain the database design, API contract, and core application wireframes.

## 🧠 Key Design Decisions

**PostgreSQL + Drizzle**
A relational database was chosen because TaskFlow has clear relationships between users, projects, memberships, tasks, comments, and messages. Drizzle provides type-safe database access.

**Modular Express Backend**
Routes, controllers, services, and repositories are separated to keep responsibilities clear and make the application easier to maintain.

**JWT Authentication**
JWT is used to protect authenticated API endpoints and manage user authentication.

**Zod Validation**
Incoming data is validated before reaching business logic or the database, providing predictable API errors and safer data handling.

**Next.js App Router**
The App Router provides a structured routing system and supports reusable layouts and components.

## 🤖 AI Usage

As a junior developer, I used **Claude** as a development assistant throughout the project. AI was mainly used to understand concepts, explore implementation approaches, debug issues, and review code.

| Area               | How Claude Was Used                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------- |
| Architecture       | Reviewed project structure and separation of responsibilities                               |
| Database & Drizzle | Helped understand schemas, relationships, migrations, and queries                           |
| Authentication     | Assisted with JWT, password handling, and protected routes                                  |
| API                | Assisted with Express routes, controllers, services, and repositories                       |
| Validation         | Helped with Zod schemas and error handling                                                  |
| Projects & Members | Assisted with project and membership logic                                                  |
| Tasks              | Assisted with CRUD, assignment, status, priority, due dates, filtering, sorting, and search |
| Comments           | Helped structure comment functionality                                                      |
| Messaging          | Assisted with conversations and messages                                                    |
| Frontend           | Helped with Next.js pages, components, and UI patterns                                      |
| Forms & UI         | Assisted with validation, loading/error states, and responsive UI                           |
| Dashboard          | Helped with dashboard statistics and component structure                                    |
| TypeScript         | Clarified types and type-safe implementation patterns                                       |
| Testing            | Assisted with test structure and debugging                                                  |
| Debugging          | Helped identify errors and possible solutions                                               |
| Documentation      | Assisted with README organization and technical writing                                     |

My workflow was:

**Understand → Ask Claude → Implement → Test → Debug → Review → Adapt**

AI-generated suggestions were reviewed and tested before being used. I remain responsible for understanding and explaining the submitted implementation.

## ⚖️ Trade-offs & Assumptions

The project intentionally uses a **simple modular monolithic architecture** rather than over-engineering the application.

Where requirements were open-ended, reasonable implementation decisions were made to keep the core workflow simple and maintainable. Project membership controls access to project-related functionality, and tasks use three primary statuses: `Todo`, `In Progress`, and `Done`.

## 🔮 Future Improvements

With more time, I would add:

- Real-time messaging
- Drag-and-drop Kanban board
- Task activity history
- Pagination for large task lists
- More comprehensive test coverage
- Notifications
- More granular project permissions
