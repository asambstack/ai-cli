# Dev Environment Management

Manage the local automate development environment via Tilt. Load this skill when the user asks about starting services, debugging environment issues, setting up a new machine, or managing their local dev stack.

## File Locations

| File | Location | Notes |
|------|----------|-------|
| Tiltfile | `~/.ai-agents-repo/devenv/Tiltfile` | Symlinked to `~/development/Tiltfile` |
| docker-compose.yml | `~/.ai-agents-repo/devenv/docker-compose.yml` | For o11y + context-generator containers |
| Dockerfiles | `~/.ai-agents-repo/devenv/dockerfiles/` | Symlinked to `~/development/.ai-agents-repo-devenv` |
| Config overrides | `~/.ai-agents-repo/devenv/config/` | Testhub config files |
| Bootstrap script | `~/.ai-agents-repo/devenv/bootstrap.sh` | One-time machine setup |
| This skill | `~/.ai-agents-repo/skills/dev-environment.md` | Knowledge + troubleshooting |

Always run Tilt from `~/development`.

## Quick Reference

```bash
tilt up                        # Start all auto-init services
tilt up -- --profile core      # Start without o11y/testhub/tcg
tilt down                      # Stop everything (kills all spawned processes)
tilt trigger <resource>        # Manually trigger a setup/build step
tilt logs -f <resource>        # Tail logs for a service
```

UI: http://localhost:10350

## Service Map

### Infrastructure (auto-start)
| Service | Type | Port | Notes |
|---------|------|------|-------|
| redis | external (brew) | 6379 | Must be running before tilt up |
| mysql | external (brew) | 3306 | Must be running before tilt up |
| postgresql | external (brew) | 5432 | `brew services start postgresql@14` |
| elasticsearch | native (Tilt manages) | 9200 | ES 6.8.18, started by Tilt |
| zookeeper | native (Tilt manages) | 2181 | From local Kafka install |
| kafka | native (Tilt manages) | 9092 | Depends on zookeeper |
| kafka-topics | one-shot | — | Auto-creates all topics after Kafka ready |

### Core Services (auto-start)
| Service | Node | Port | Start Command |
|---------|------|------|--------------|
| railsapp | Ruby 2.6.6 | 443 (nginx) | External — `sudo /opt/nginx/sbin/nginx -s reload` |
| seleniumhub | 16 | 8080 | `node hub.js` |
| timeout-manager | 16 | — | `node apps/timeoutManager/run.js` |
| kafka-uploader-raw | 16 | — | `CONSUMER_TOPIC=raw_logs node kafkaUploaderRun.js` |
| kafka-uploader-exception | 16 | — | `CONSUMER_TOPIC=exception_logs node kafkaUploaderRun.js` |
| kafka-uploader-console | 16 | — | `CONSUMER_TOPIC=console_logs node kafkaUploaderRun.js` |
| ws-reconnect-proxy | 16 | 9222 | `node cluster.js` |
| terminal-cleanup | 20 | — | `node index.js` |
| pusher | 20 | 8000 | `node server.js` |
| sidekiq | Ruby 2.6.6@rails602 | — | `bundle exec sidekiq` |

### Dashboards (auto-start)
| Service | Node | Port | Notes |
|---------|------|------|-------|
| browserstack-fe | 20 | 8081 | Old dashboard, needs `NODE_OPTIONS=--openssl-legacy-provider` |
| frontend-o11y | 22 | 8082 | New dashboard (monorepo `frontend/apps/o11y`), uses `BSTACK_STAGE=dynamic_urls` to point to local o11y-api |

### O11Y (manual trigger, Docker)
| Service | Port | Profile |
|---------|------|---------|
| o11y-ingest | 9090 | full, o11y |
| o11y-consumer | 9091 | full, o11y |
| o11y-logproxy | 8099 | full, o11y |
| o11y-preprocessor | 9093 | full, o11y |
| o11y-api | 8085 | full, o11y |

### Other (manual trigger)
| Service | Port | Profile |
|---------|------|---------|
| testhub | 3000 (Node 18) | full, testhub |
| context-generator | 3005 (Docker) | full, tcg |
| llm-service | 3006 (Docker) | full, tcg |

## Node Version Map

Services use different Node versions via nvm. Tilt handles this via `serve_env` PATH overrides.

| Version | Path | Services |
|---------|------|----------|
| v16.20.2 | `~/.nvm/versions/node/v16.20.2/bin` | seleniumhub, timeout-manager, kafka-uploaders, ws-reconnect-proxy |
| v18.12.1 | `~/.nvm/versions/node/v18.12.1/bin` | (unused — testhub moved to v20) |
| v20.17.0 | `~/.nvm/versions/node/v20.17.0/bin` | pusher, terminal-cleanup, browserstack-fe |
| v22.15.0 | `~/.nvm/versions/node/v22.15.0/bin` | frontend-o11y (new dashboard) |

## Dependency Chain

```
redis, mysql ──► railsapp (nginx/passenger, external)
       │              │
       │              ├──► seleniumhub ──► timeout-manager
       │              │         │──► kafka-uploaders (x3)
       │              │         └──► ws-reconnect-proxy
       │              ├──► sidekiq
       │              └──► browserstack-fe
       │
       └──► pusher
       └──► terminal-cleanup

zookeeper ──► kafka ──► kafka-topics
                  │──► seleniumhub (above)
                  │──► kafka-uploaders (above)
                  └──► testhub

postgresql, elasticsearch ──► o11y-* services
```

## First-Time Setup (New Machine)

1. Run `~/.ai-agents-repo/devenv/bootstrap.sh` (installs prereqs, needs sudo)
2. Open Tilt UI → click setup triggers under **setup** label in this order:
   - `setup-railsapp` (copies configs)
   - `setup-seleniumhub` (npm install + config)
   - `setup-pusher` (npm install + config)
   - `setup-ws-reconnect-proxy` (npm install + config)
   - `setup-terminal-service` (npm install)
   - `setup-testhub` (runs testhub_setup.sh)
   - `setup-browserstack-fe` (runs setup_fe.sh)
   - `setup-o11y-pipeline` (runs TestObservability_setup.sh) — if needed
   - `setup-o11y-api` (DB migrate + ES template) — if needed
3. Start railsapp: `sudo /opt/nginx/sbin/nginx`
4. Run `tilt up`

## Troubleshooting Playbook

### "node: command not found"
**Cause:** Tilt doesn't source .zshrc, so nvm isn't in PATH.
**Fix:** Ensure the service has `serve_env=NODE16_ENV`, `NODE18_ENV`, or `NODE20_ENV` in the Tiltfile.

### "conf.json not found" or config errors
**Cause:** Sample config not copied.
**Fix:** The Tiltfile auto-copies `.sample` → config via `cmd`. If it's a different config file, add a `copy_if_missing()` call in the Tiltfile's `cmd` for that service.

### RailsApp not detected (health check failing)
**Cause:** nginx/passenger not running.
**Fix:** `sudo /opt/nginx/sbin/nginx -s reload` — or `sudo /opt/nginx/sbin/nginx` if not started.

### Sidekiq fails to start
**Cause:** Wrong gemset or missing GEM_HOME.
**Fix:** Ensure `serve_env=RAILS_ENV` is set (uses ruby-2.6.6@rails602 gemset).

### O11Y Docker build fails with "no match for platform"
**Cause:** Base image doesn't have ARM64 build.
**Fix:** Use `eclipse-temurin:17-jre` (not `-alpine`) in the Dockerfiles under `local-setup/dockerfiles/`.

### Kafka topics not created
**Cause:** kafka-topics resource ran before Kafka was ready, or Kafka restarted.
**Fix:** In Tilt UI, click trigger on `kafka-topics` to re-run.

### Port already in use
**Cause:** Orphaned process from a previous session.
**Fix:** `lsof -ti:<port> | xargs kill` then restart the service in Tilt.

### Elasticsearch won't start
**Cause:** Another ES instance running, or insufficient memory.
**Fix:** Check `lsof -ti:9200`, kill if needed. ES 6.8.18 needs ~1GB heap.

### Elasticsearch indices are read-only (flood stage watermark)
**Cause:** Disk usage exceeds 95%. ES locks all indices to prevent data loss.
**Fix:** Run these two commands:
```bash
curl -X PUT "localhost:9200/_cluster/settings" -H 'Content-Type: application/json' -d '{"transient":{"cluster.routing.allocation.disk.watermark.flood_stage":"99%","cluster.routing.allocation.disk.watermark.high":"98%","cluster.routing.allocation.disk.watermark.low":"97%"}}'
curl -X PUT "localhost:9200/_all/_settings" -H 'Content-Type: application/json' -d '{"index.blocks.read_only_allow_delete":null}'
```
Then free disk space if possible. For local dev, the relaxed watermarks are fine.

### Kibana
Not required for the local E2E flow. The frontend reads from o11y-api, not Kibana. Only needed for manual ES data inspection. Run manually if needed: `cd ~/development/elasticsearch/kibana-6.8.18-darwin-x86_64/bin && ./kibana`

## Local O11Y E2E Config Checklist

When a user wants to run observability sessions locally (data flows through the full pipeline and shows in both dashboards), these configs must all point to local services:

### railsapp (`config/initializers/config.yml`)
```yaml
o11y:
  hosts: ["http://localhost:8085"]      # local o11y-api (NOT staging)

testhub:
  url: "http://localhost:3000"           # local testhub (usually already correct)

kafka:
  brokers:
    - 'localhost:9092'                   # local Kafka (NOT staging MSK)
```

### o11y-pipeline (application.properties — already correct by default)
- Kafka, PostgreSQL, Elasticsearch, Redis, Testhub all point to localhost
- Credentials match values in `~/.ai-agents-repo/devenv/config.yaml`

### o11y-api (application.properties — already correct by default)
- PostgreSQL, MySQL (testhub DB), Elasticsearch, Redis all point to localhost
- NOTE: `spring.datasource.testhub.password` is empty in properties — the docker-compose env override injects the password from config.yaml

### testhub (secret/keys.json — already correct by default)
- Kafka broker and MySQL both point to localhost
- Credentials in `secret/dbConfig.json`

### frontend-o11y (.env)
- `BSTACK_STAGE=dynamic_urls` with `VITE_API_URL=http://localhost:8085` (set by Tilt from `devenv/config/frontend-o11y-local.env`)

### Data flow
```
Test session → SeleniumHub → RailsApp → Kafka (localhost:9092)
                                          ↓
                              o11y-pipeline ingest (9090) → Kafka topics
                                          ↓
                              o11y-pipeline consumer (9091) → PostgreSQL + Elasticsearch
                                          ↓
                              o11y-api (8085) ← frontend-o11y (8082) reads from here
                                          ↓
                              testhub (3000) ← also reads/writes session data
```

## Updating the Tiltfile

When you discover something new about the environment:
- **Config change** (port, command, dependency) → update the Tiltfile directly
- **Knowledge** (gotcha, workaround, troubleshooting) → add to this skill file's Troubleshooting section
- **User preference** (preferred profile, services they always skip) → save to Claude memory

## Learned Knowledge

<!-- Claude appends new learnings below this line -->
- kafka-uploader for exception_logs is not needed locally — conf.json doesn't have consumer config for it, and S3 uploads aren't needed in dev (2026-03-25)
- For local o11y E2E: railsapp config.yml must change o11y.hosts to localhost:8085 and kafka.brokers to localhost:9092. All other services already point to localhost by default. o11y-api has empty testhub DB password in properties — docker-compose injects it from devenv/config.yaml (2026-03-25)
- testhub needs Node 20 despite .nvmrc saying 18.12.1 — cheerio/undici dependency uses `File` global only available in Node 20+ (2026-03-25)
- frontend-o11y (new dashboard) runs on port 8082 to avoid conflict with browserstack-fe on 8081. Uses `BSTACK_STAGE=dynamic_urls` with VITE_API_* env vars to point to local o11y-api:8085 and testhub:3000. Config at `~/.ai-agents-repo/devenv/config/frontend-o11y-local.env`. To switch to staging APIs, change .env to `BSTACK_STAGE=local-staging` (2026-03-25)
