# Judge0 Setup Guide for Code-Gen Application

This guide explains how to set up the Judge0 code execution engine to work with the Code-Gen application on **Windows (Docker Desktop + WSL2)**.

## Why This Setup Is Needed

Judge0 uses a sandbox tool called **isolate** to run code safely. The version bundled with Judge0 (v1.8.1) only supports **cgroups v1**, but Docker Desktop on Windows/WSL2 uses **cgroups v2**. This causes languages like Java, Go, Kotlin, and TypeScript to fail.

The fix: upgrade isolate to **v2.0** (which supports cgroups v2) inside the Judge0 containers, and apply a compatibility wrapper.

---

## Prerequisites

- **Docker Desktop** installed and running on Windows
- **WSL2** backend enabled in Docker Desktop
- Terminal (PowerShell or CMD)

---

## Step 1: Pull and Start Judge0

```bash
# Create a any folder for clone
git clone https://github.com/judge0/judge0.git
cd judge0

# Download the config and compose files
docker compose up -d
# it may take some time to pull the images 
# (or copy them from the project)
```

### Required Files

#### `docker-compose.yml`

```yaml
x-logging:
  &default-logging
  logging:
    driver: json-file
    options:
      max-size: 100M

services:
  server:
    image: judge0/judge0:latest
    volumes:
      - ./judge0.conf:/judge0.conf:ro
    ports:
      - "2358:2358"
    privileged: true
    <<: *default-logging
    restart: always

  worker:
    image: judge0/judge0:latest
    command: ["./scripts/workers"]
    volumes:
      - ./judge0.conf:/judge0.conf:ro
    privileged: true
    <<: *default-logging
    restart: always

  db:
    image: postgres:16.2
    env_file: judge0.conf
    volumes:
      - data:/var/lib/postgresql/data/
    <<: *default-logging
    restart: always

  redis:
    image: redis:7.2.4
    command: [
      "bash", "-c",
      'docker-entrypoint.sh --appendonly no --requirepass "$$REDIS_PASSWORD"'
    ]
    env_file: judge0.conf
    <<: *default-logging
    restart: always

volumes:
  data:
```

### Start the containers

```powershell
docker compose up -d
```

Wait about 30 seconds for all services to initialize, then verify:

```powershell
docker ps --filter "name=judge0"
```

You should see 4 containers running (server, worker, db, redis).

---

## Step 2: Modify `judge0.conf`

Open `judge0.conf` and update these resource limit settings. These are needed because languages like Java, Kotlin, Go, and TypeScript require more memory, CPU time, and threads than the defaults allow.

Find and change these values:

```ini
# CPU time limits (seconds) — increased for slow compilers like TypeScript/Kotlin
CPU_TIME_LIMIT=15
MAX_CPU_TIME_LIMIT=30

# Wall time limits (seconds) — must be higher than CPU time
WALL_TIME_LIMIT=30
MAX_WALL_TIME_LIMIT=60

# Memory limits (KB) — JVM languages need large virtual memory
MEMORY_LIMIT=512000
MAX_MEMORY_LIMIT=4096000

# Stack size (KB)
STACK_LIMIT=128000
MAX_STACK_LIMIT=512000

# Process/thread limits — JVM and Go spawn many threads
MAX_PROCESSES_AND_OR_THREADS=256
MAX_MAX_PROCESSES_AND_OR_THREADS=512
```

**Important:** Leave these two settings empty (default = false). Do NOT set them to `true`:

```ini
ENABLE_PER_PROCESS_AND_THREAD_TIME_LIMIT=
ENABLE_PER_PROCESS_AND_THREAD_MEMORY_LIMIT=
```

> When these are empty/false, Judge0 uses cgroup-based resource limits (`--cg` flag), which is what we need for isolate v2.0 to work properly.

After editing, restart containers to apply:

```powershell
docker compose down
docker compose up -d
```

Wait ~30 seconds for services to start.

---

## Step 3: Run the Isolate v2.0 Setup Script

This is the critical step. You need to run a setup script **inside both the server and worker containers**.

### Save this script as `setup-isolate-v2.sh` in your Judge0 directory:

```bash
#!/bin/bash
# Judge0 Isolate v2.0 Setup Script for cgroup v2 compatibility
# Run as root inside Judge0 worker/server containers
# This script must be run EVERY TIME containers are restarted.
set -e

echo "===== Judge0 Isolate v2.0 Setup ====="

# Step 1: Build isolate v2.0 from source (skip if already built)
if [ -f /usr/local/bin/isolate.real ]; then
    echo "[1/5] Isolate v2.0 already installed, skipping build."
else
    echo "[1/5] Building isolate v2.0..."
    cd /tmp
    rm -rf isolate-build
    git clone --depth 1 --branch v2.0 https://github.com/ioi/isolate.git isolate-build 2>&1 | tail -1
    cd isolate-build
    make isolate 2>&1 | tail -1

    # Install the real binary
    echo "[2/5] Installing isolate v2.0..."
    cp /usr/local/bin/isolate /usr/local/bin/isolate.v1.bak 2>/dev/null || true
    cp isolate /usr/local/bin/isolate.real
    chmod 4755 /usr/local/bin/isolate.real

    # Update config for cgroup v2
    echo "[3/5] Configuring isolate for cgroup v2..."
    cp default.cf /usr/local/etc/isolate
    sed -i 's|cg_root = auto:/run/isolate/cgroup|cg_root = /sys/fs/cgroup/isolate|' /usr/local/etc/isolate

    rm -rf /tmp/isolate-build
fi

# Step 4: Install wrapper script (strips flags removed in v2.0)
echo "[4/5] Installing isolate wrapper..."
cat > /usr/local/bin/isolate << 'WRAPPER'
#!/bin/bash
ARGS=()
for arg in "$@"; do
    case "$arg" in
        --cg-timing|--no-cg-timing)
            ;;
        *)
            ARGS+=("$arg")
            ;;
    esac
done
exec /usr/local/bin/isolate.real "${ARGS[@]}"
WRAPPER
chmod 755 /usr/local/bin/isolate
mkdir -p /run/isolate/locks

# Step 5: Set up cgroup v2 hierarchy
echo "[5/5] Setting up cgroup v2 hierarchy..."
mkdir -p /sys/fs/cgroup/system.slice 2>/dev/null || true
mkdir -p /sys/fs/cgroup/isolate 2>/dev/null || true

for pid in $(cat /sys/fs/cgroup/cgroup.procs 2>/dev/null); do
    echo $pid > /sys/fs/cgroup/system.slice/cgroup.procs 2>/dev/null || true
done

echo "+memory +pids +cpu +cpuset" > /sys/fs/cgroup/cgroup.subtree_control 2>/dev/null || true
echo "+memory +pids +cpu +cpuset" > /sys/fs/cgroup/isolate/cgroup.subtree_control 2>/dev/null || true

# Verify
echo ""
echo "===== Verification ====="
echo "Isolate version: $(isolate.real --version 2>&1 | head -1)"
echo "Cgroup controllers: $(cat /sys/fs/cgroup/isolate/cgroup.controllers 2>/dev/null)"

isolate --cleanup --cg 2>/dev/null || true
BOX=$(isolate --init --cg 2>&1)
if [ -d "$BOX/box" ]; then
    echo "Sandbox test: PASS (box at $BOX)"
else
    echo "Sandbox test: FAIL ($BOX)"
fi
isolate --cleanup --cg 2>/dev/null || true

echo ""
echo "===== Setup Complete ====="
```

### Run the script on both containers:

```powershell
# Copy script to worker and run it
docker cp setup-isolate-v2.sh judge0-worker-1:/tmp/setup-isolate-v2.sh
docker exec --user root judge0-worker-1 bash /tmp/setup-isolate-v2.sh

# Copy script to server and run it  
docker cp setup-isolate-v2.sh judge0-server-1:/tmp/setup-isolate-v2.sh
docker exec --user root judge0-server-1 bash /tmp/setup-isolate-v2.sh
```

You should see **"Sandbox test: PASS"** for both containers.

> **Note:** The first run will take ~1 minute to compile isolate from source. Subsequent runs (after restart) are faster because the binary persists in the container layer — only the cgroup setup needs to be redone.

---

## Step 4: Verify All Languages Work

Test the Judge0 API directly:

```powershell
# Quick test with Python
Invoke-RestMethod -Uri "http://localhost:2358/submissions/?base64_encoded=false&wait=true" `
  -Method Post -ContentType "application/json" `
  -Body '{"language_id": 71, "source_code": "print(\"Hello World\")"}'
```

Or run the full test script from the backend directory:

```powershell
cd backend
python test_all_languages.py
```

Expected result: **13 passed, 0 failed**

### Supported Languages

| Language | Judge0 ID | Version |
|----------|-----------|---------|
| Python | 71 | 3.8.1 |
| JavaScript | 63 | Node.js 12.14.0 |
| TypeScript | 74 | 3.7.4 |
| Java | 62 | OpenJDK 13.0.1 |
| C++ | 54 | GCC 9.2.0 |
| C | 50 | GCC 9.2.0 |
| C# | 51 | Mono 6.6.0 |
| Ruby | 72 | 2.7.0 |
| Go | 60 | 1.13.5 |
| PHP | 68 | 7.4.1 |
| Swift | 83 | 5.2.3 |
| Kotlin | 78 | 1.3.70 |
| Rust | 73 | 1.40.0 |

---

## Important: After Every Container Restart

When you restart Docker Desktop or run `docker compose down && docker compose up -d`, the cgroup hierarchy is lost (it's in-memory). You must **re-run Step 3** on both containers.

Quick one-liner to re-setup after restart:

```powershell
docker cp setup-isolate-v2.sh judge0-worker-1:/tmp/setup-isolate-v2.sh; docker exec --user root judge0-worker-1 bash /tmp/setup-isolate-v2.sh; docker cp setup-isolate-v2.sh judge0-server-1:/tmp/setup-isolate-v2.sh; docker exec --user root judge0-server-1 bash /tmp/setup-isolate-v2.sh
```

> The script is smart — if isolate v2.0 binary already exists, it skips the build step and only re-applies the cgroup setup + wrapper.

---

## Troubleshooting

### "Connection refused" on `localhost:2358`
- Wait 30 seconds after `docker compose up` for services to start
- Check container status: `docker ps --filter "name=judge0"`

### Languages fail with "Internal Error"
- Re-run Step 3 (cgroup setup was lost)
- Check: `docker exec judge0-worker-1 cat /sys/fs/cgroup/isolate/cgroup.controllers`
  - Should show: `cpuset cpu memory pids`

### Java/Kotlin crash or time out
- Verify `MAX_MEMORY_LIMIT=4096000` in judge0.conf
- Verify `MAX_MAX_PROCESSES_AND_OR_THREADS=512` in judge0.conf
- Kotlin's first compile is slow (~6-8 seconds) — this is normal

### "Sandbox test: FAIL" in setup script
- Make sure containers have `privileged: true` in docker-compose.yml
- Check Docker Desktop is using WSL2 backend

---

## Summary of Changes Made

| What | Why |
|------|-----|
| Increased `CPU_TIME_LIMIT` to 15s | TypeScript/Kotlin need more compile time |
| Increased `MAX_MEMORY_LIMIT` to 4GB | JVM languages map large virtual address spaces |
| Increased `MAX_PROCESSES_AND_OR_THREADS` to 256 | Go/Java spawn many goroutines/threads |
| Upgraded isolate v1.8.1 → v2.0 | v1.8.1 doesn't support cgroups v2 (used by Docker Desktop/WSL2) |
| Added isolate wrapper script | Strips `--cg-timing`/`--no-cg-timing` flags that v2.0 removed |
| Set up cgroup v2 hierarchy | Required for isolate v2.0 to manage sandbox resource limits |
