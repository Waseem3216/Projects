# XYMZ Dockerized Search Portal

This is a Docker-ready portfolio version of **XYMZ**, a retro early-2000s search engine and web services portal.

The project is designed to help you practice Docker and show resume-ready experience with containerizing a frontend, running a backend service, using Docker Compose, and routing traffic through NGINX.

## What Docker does in this project

This project uses Docker in a realistic multi-container setup:

1. **Frontend container**
   - Uses `nginx:1.27-alpine`.
   - Serves the XYMZ static website from `/usr/share/nginx/html`.
   - Exposes the site on your machine at `http://localhost:8080`.
   - Includes an NGINX health check at `/healthz`.

2. **API container**
   - Uses `node:20-alpine`.
   - Runs a small Node.js API service.
   - Provides `/api/health` and `/api/search-info` endpoints.
   - Demonstrates how a frontend can connect to a backend service inside Docker.

3. **Docker Compose network**
   - `docker-compose.yml` creates a private bridge network called `xymz-net`.
   - The frontend container can reach the API container by using the service name `api`.
   - NGINX reverse proxies browser requests from `/api/*` to `http://api:3000/api/*`.

## Project structure

```text
XYMZ_Docker_Showcase_Project/
├── docker-compose.yml
├── README.md
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── index.html
│   └── assets/
├── api/
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
└── docs/
    └── resume-bullets.md
```

## How to open it in VS Code

1. Unzip the project.
2. Open VS Code.
3. Click **File > Open Folder**.
4. Select the folder named `XYMZ_Docker_Showcase_Project`.
5. Open a terminal in VS Code with **Terminal > New Terminal**.

## How to run it with Docker, step by step

### Step 1: Make sure Docker is running

Open Docker Desktop first. Then in the VS Code terminal, run:

```bash
docker --version
docker compose version
```

### Step 2: Build and start the project

From inside the `XYMZ_Docker_Showcase_Project` folder, run:

```bash
docker compose up --build
```

This builds both containers and starts the app.

### Step 3: Open the website

Go to:

```text
http://localhost:8080
```

You should see the XYMZ website. The right sidebar has a **Docker Status** box. When Docker is running correctly, it should show that the API is online.

### Step 4: Test the backend API

Open this in your browser:

```text
http://localhost:8080/api/health
```

You should see JSON showing the API container status.

You can also test:

```text
http://localhost:8080/api/search-info?q=retro%20web%20design
```

### Step 5: See running containers

In a second terminal, run:

```bash
docker compose ps
```

You should see:

```text
xymz-frontend
xymz-api
```

### Step 6: View logs

```bash
docker compose logs -f
```

Or view only one service:

```bash
docker compose logs -f frontend
docker compose logs -f api
```

### Step 7: Stop the project

Press `Ctrl + C` in the terminal running Docker Compose, then run:

```bash
docker compose down
```

## Useful Docker commands for this project

Rebuild everything:

```bash
docker compose build --no-cache
```

Run in the background:

```bash
docker compose up -d --build
```

Stop background containers:

```bash
docker compose down
```

Enter the frontend container:

```bash
docker exec -it xymz-frontend sh
```

Enter the API container:

```bash
docker exec -it xymz-api sh
```

## What to say on your resume

See `docs/resume-bullets.md` for resume-ready bullets.

A strong version is:

> Dockerized a retro search-engine web portal using NGINX, Node.js, and Docker Compose; configured reverse proxy routing, container health checks, and an isolated bridge network for frontend-to-API communication.

## Notes

This is a local Docker showcase project. The website can still be deployed as a static site, but the Docker version is meant to demonstrate containerization, networking, reverse proxying, and service orchestration.

## Troubleshooting: API unhealthy

If you see `container xymz-api is unhealthy`, run:

```bash
docker compose down --remove-orphans
docker compose up --build
```

This version uses a Node-based health check in `api/Dockerfile`, so it does not depend on curl or wget being installed inside the container.


## Troubleshooting: container name conflict

This version intentionally does not use fixed `container_name` values in `docker-compose.yml`. Docker Compose will automatically create unique container names based on the project folder name, which prevents conflicts with old containers from previous runs.

If you still have old containers from another copy of the project, clean them up with:

```bash
docker rm -f xymz-api xymz-frontend 2>/dev/null || true
docker compose down --remove-orphans
```

Then rebuild:

```bash
docker compose up --build
```
