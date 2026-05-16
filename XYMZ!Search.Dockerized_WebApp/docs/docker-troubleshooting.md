# Docker Troubleshooting Notes

## Error: `dependency failed to start: container xymz-api is unhealthy`

This means Docker successfully built the images, but the API container failed its health check, so Docker Compose refused to start the frontend container that depends on it.

In this fixed version, the API health check uses Node.js directly instead of relying on `wget` or `curl`, which may not always be available or reliable in minimal Linux images.

Useful commands:

```bash
docker compose down --remove-orphans
docker compose up --build
```

Check logs:

```bash
docker logs xymz-api
docker inspect --format='{{json .State.Health}}' xymz-api
```

Open the project:

```text
http://localhost:8080
```

Test the API:

```text
http://localhost:8080/api/health
```
