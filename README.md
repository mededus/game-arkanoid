# Arkanoid

A browser-based Arkanoid clone built with [Phaser 3](https://phaser.io/) and [Vite](https://vite.dev/).
All graphics and audio are generated programmatically — no external asset files required.

---

## Running with Docker (recommended)

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) installed and running.

### 1. Build the image

```bash
docker build -t arkanoid .
```

This runs a two-stage build:
1. **builder** — installs Node dependencies and runs `vite build` inside the container.
2. **runtime** — copies only the compiled static files into a lean nginx image.

The final image is roughly 50 MB and contains no Node.js or source code.

### 2. Run the container

```bash
docker run -d --name arkanoid -p 5173:80 arkanoid
```

Open **http://localhost:5173** in your browser.

| Flag | Meaning |
|------|----------|
| `-d` | Run in the background (detached) |
| `--name arkanoid` | Give the container a memorable name |
| `-p 5173:80` | Map host port 5173 → container port 80 |

Change `5173` to any free port on your machine if needed.

### 3. Stop and remove the container

```bash
docker stop arkanoid
docker rm arkanoid
```

### 4. Remove the image

```bash
docker rmi arkanoid
```

---

## Useful variations

**Run on a different host port:**
```bash
docker run -d --name arkanoid -p 3000:80 arkanoid
```

**Run in the foreground (see nginx logs directly):**
```bash
docker run --rm --name arkanoid -p 5173:80 arkanoid
```

**Check container logs:**
```bash
docker logs arkanoid
```

**Rebuild after source changes:**
```bash
docker build -t arkanoid .
docker stop arkanoid && docker rm arkanoid
docker run -d --name arkanoid -p 5173:80 arkanoid
```

---

## Local development (without Docker)

```bash
npm install
npm run dev
```

Open **http://localhost:5173**.

---

## Project structure

```
arkanoid/
├── src/
│   ├── main.js              # Phaser game config & bootstrap
│   ├── constants.js         # Shared numeric constants
│   ├── levels/              # Level layout definitions
│   ├── scenes/
│   │   ├── BootScene.js     # Generates all textures at startup
│   │   ├── MenuScene.js     # Title / start screen
│   │   ├── GameScene.js     # Main gameplay loop
│   │   └── UIScene.js       # HUD overlay (score, lives, level)
│   └── objects/
│       ├── PowerUp.js       # Power-up effects & timers
│       └── AudioManager.js  # Procedural SFX + background music
├── index.html
├── vite.config.js
├── Dockerfile
├── nginx.conf               # nginx config used inside the container
└── .dockerignore
```

---

## Controls

| Input | Action |
|-------|--------|
| Mouse move | Move paddle |
| Click | Launch ball / fire laser (with laser power-up) |
| `+` / `-` | Increase / decrease ball speed |
