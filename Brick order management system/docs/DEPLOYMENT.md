# Deployment Guide

## Topology

- Angular static frontend: Vercel.
- Spring Boot API: Ubuntu 22.04/24.04 on Oracle Cloud VM, containerized with Docker Compose.
- PostgreSQL: dedicated managed database or a separately secured VM/volume. Do not expose port 5432 publicly.
- DNS: `app.example.com` to Vercel and `api.example.com` to the VM public address.

## Local stack

1. Copy `.env.example` to `.env` and set unique passwords.
2. From the repository root run `docker compose up --build`.
3. API base URL: `http://localhost:8080/api/v1`; OpenAPI: `http://localhost:8080/v3/api-docs`.
4. Local compose uses Spring Security's temporary HTTP Basic user configuration. Replace it with JWT and role authorization before any shared or public deployment.

## Oracle VM

1. Create a non-root deploy account, apply Ubuntu security updates, enable automatic security updates, and configure Oracle VCN ingress for SSH from trusted IPs plus TCP 80/443 only.
2. Install Docker Engine and the Compose plugin from Docker's official Ubuntu repository. Restrict SSH with key authentication and disable password login after verifying access.
3. Copy the application deployment files to a versioned release directory. Keep `.env` outside version control with permissions `0600`; generate production values using a password manager/secret manager.
4. Configure a separate PostgreSQL database service with backups enabled and a private network address. Set `DATABASE_URL`, `DATABASE_USERNAME`, and `DATABASE_PASSWORD` to that service.
5. Deploy an immutable image tag, check Flyway logs and `/actuator/health` (health endpoint still to be added), then run smoke tests. Roll back by redeploying the prior image; never roll back schema destructively.
6. Configure resource limits, log rotation, disk alerts, uptime checks, and OS/container patch cadence. Validate Oracle Free Tier limits and regional availability before production use.

## Nginx and TLS

An example reverse proxy is at `deploy/nginx/api.conf`. Point `api.example.com` to the VM and issue certificates with Certbot using the Nginx plugin. Renew automatically and monitor renewal. Set HSTS only after HTTPS is confirmed. Forward only required headers and set request body/time limits appropriate to invoice uploads. The frontend is deployed separately on Vercel.

## Vercel

Import `frontend` as the project root, use `npm run build`, output directory `dist/brick-order-management-ui/browser`, and configure an environment-specific API URL at build time (API base URL injection is a follow-up task). Add a rewrite for SPA route fallback. Restrict production builds to protected branches and use preview deployments for review.

## GitHub Actions

`.github/workflows/ci.yml` runs the backend and frontend build/test commands. Add protected-branch checks, dependency review, secret scanning, container scanning, and image publication before enabling deployment. Store production credentials only in GitHub Environments and use approval gates.

## Backup and recovery

- Nightly encrypted `pg_dump -Fc` to object storage in a separate account/region; retain daily, weekly, and monthly restore points.
- Keep invoice documents in versioned object storage; database backup alone is not sufficient once external files are added.
- Back up environment/secrets through a managed secret store, not in the repository.
- Alert on backup age and failures. Quarterly, restore into an isolated database and verify row counts, latest transactions, invoice PDFs, and application startup.
- Define RPO/RTO with the business. The sample script `deploy/backup-postgres.sh` is a template and needs object-storage integration and encryption configuration before production use.
