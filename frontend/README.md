# Zenith Lite Frontend

Forensic analytics platform for construction project analysis.

## Quick Start with Docker Compose

```bash
# Start all services (frontend, mock API, PostgreSQL)
docker-compose up

# Start in detached mode
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Services

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | Next.js dev server with hot reload |
| Mock API | 8200 | JSON Server for local development |
| PostgreSQL | 5432 | Optional database for persistence |

### Environment Variables

Create `.env.local` for local development:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8200
DATABASE_URL=postgresql://zenith:zenith_dev@localhost:5432/zenith_db
```

### Development

The frontend uses volume mounting for hot reload:

```bash
# Start only frontend (native)
npm run dev
```

## Technology Stack

- Next.js 15 with App Router
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion
- Recharts
- Zustand (state management)
