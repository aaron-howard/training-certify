# Training Certify

A modern web application for managing training certifications, built with TanStack Start, React 19, Drizzle ORM, and PostgreSQL.

## Local Development Setup

This project is configured for local development using Docker for the PostgreSQL database.

### Prerequisites

- [Node.js](https://nodejs.org/) (Latest LTS)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) or Docker Engine

### Getting Started

1.  **Clone the repository**
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Set up environment variables**:
    Create a `.env.local` file in the root directory (copy `.env.example` if available) and ensure `DATABASE_URL` points to your local Docker instance:
    ```env
    DATABASE_URL="postgresql://postgres:password@localhost:5432/devdb"
    VITE_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
    CLERK_SECRET_KEY="your_clerk_secret_key"
    ```
4.  **Start the database**:
    ```bash
    docker compose up -d
    ```
5.  **Run database migrations**:
    ```bash
    npx drizzle-kit push
    ```
6.  **Run the development server**:
    ```bash
    npm run dev
    ```

### Scripts

- `npm run dev`: Starts the development server on port 3000.
- `npm run build`: Builds the application for production.
- `npm run test`: Runs the test suite using Vitest.
- `npm run lint`: Runs ESLint for code quality checks.
- `npm run format`: Runs Prettier for code formatting.
- `npm run check`: Runs both formatter and linter.

## Architecture & Stack

- **Framework**: [TanStack Start](https://tanstack.com/start)
- **Frontend**: React 19, Tailwind CSS
- **Database**: PostgreSQL with [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [Clerk](https://clerk.com/)
- **Deployment**: Local-only development environment

## Database Schema

The database schema is defined in `src/db/schema.ts`. We use Drizzle Kit for managing migrations and schema pushes.

- To preview the database: `npx drizzle-kit studio`
- To generate migrations: `npx drizzle-kit generate`
- To push schema changes: `npx drizzle-kit push`

## Code Quality

We follow strict TypeScript practices and use ESLint/Prettier to ensure code consistency. All API routes are protected and use Zod for input validation.
