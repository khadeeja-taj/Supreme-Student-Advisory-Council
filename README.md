# Supreme Student Advisory Council — IIUI

A full-stack registration website for the **Supreme Student Advisory Council**,
International Islamic University, Islamabad (IIUI).

- **Front-end:** HTML + CSS + JavaScript (bilingual English / العربية, RTL support).
- **Back-end:** Node.js + Express REST API with **token-based admin authentication**.
- **Database:** SQLite (via `better-sqlite3`) — every registration is stored
  centrally, so the admin sees submissions from **all** students on **any**
  device.

---

## Project structure

```
.
├── server.js            # Express app: API + serves the front-end
├── db.js                # SQLite database layer
├── package.json
├── .env.example         # copy to .env and fill in
├── Dockerfile           # container deploy (any host)
├── render.yaml          # one-click deploy to Render.com
└── public/              # the front-end (static files)
    ├── index.html
    ├── css/styles.css
    ├── js/app.js
    └── assets/          # logos, hero background, president photo
```

## API

| Method | Route                  | Access | Purpose                        |
|--------|------------------------|--------|--------------------------------|
| POST   | `/api/register`        | public | Submit a registration          |
| POST   | `/api/admin/login`     | public | Exchange password for a token  |
| GET    | `/api/registrations`   | admin  | List all registrations         |
| DELETE | `/api/registrations`   | admin  | Delete all registrations       |
| GET    | `/api/health`          | public | Health check                   |

Admin routes require an `Authorization: Bearer <token>` header. The token is
issued by `/api/admin/login` and expires after `TOKEN_TTL` (default 8h).

---

## Run it locally

You need [Node.js](https://nodejs.org/) 18 or newer.

```bash
# 1. install dependencies
npm install

# 2. create your config
cp .env.example .env
#    then edit .env and set ADMIN_PASSWORD and JWT_SECRET

# 3. start the server
npm start
```

Open **http://localhost:3000**.

Generate a strong `JWT_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Admin panel

- Click **Admin** in the navbar.
- Log in with the `ADMIN_PASSWORD` you set in `.env`.
- View totals per council and per faculty, and clear all records.

---

## Environment variables

| Variable         | Required | Default        | Notes                                             |
|------------------|----------|----------------|---------------------------------------------------|
| `PORT`           | no       | `3000`         | Most hosts set this automatically.                |
| `ADMIN_PASSWORD` | **yes**  | `sac2026`      | The admin login password. **Change it.**          |
| `JWT_SECRET`     | **yes**  | insecure dev   | Long random string used to sign tokens.           |
| `TOKEN_TTL`      | no       | `8h`           | How long an admin stays logged in.                |
| `DB_PATH`        | no       | `./data/council.db` | Point at a persistent disk in production.    |
| `CORS_ORIGIN`    | no       | `*`            | Restrict which site may call the API.             |

---

## Two ways to run this

This project works in **two modes from the same code**:

| Mode | Where it runs | Data storage |
|------|---------------|--------------|
| **Static** | GitHub Pages (free) | Saved in each visitor's own browser. Simplest to publish; the admin only sees registrations made in that same browser. |
| **Full** | Render / Railway / Docker | Saved in a central SQLite database. The admin sees registrations from **every** device. |

The front-end automatically uses the database when a back-end is present, and
falls back to browser storage when there isn't one — so you don't change any
code to switch between them.

---

## Deploy on GitHub Pages (static, free, no server)

The `docs/` folder is a ready-to-publish copy of the site.

1. Push this repo to GitHub (already done if you're reading this on GitHub).
2. In your repo, open **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Set **Branch** to your branch and **Folder** to **`/docs`**, then **Save**.
5. Wait ~1 minute. GitHub gives you a link like
   `https://<your-username>.github.io/Supreme-Student-Advisory-Council/`.

That's it — no terminal, no `npm`. To change the admin password for static mode,
edit `STATIC_ADMIN_PASSWORD` near the top of `docs/js/app.js`.

> Static mode stores each browser's registrations locally. If you need to
> collect submissions centrally, use the **Full** deploy below.

---

## Deploy the full version (central database) to a domain

This app serves the front-end and the API together, so you deploy it as **one**
Node service. Pick any host below, then point your domain at it.

### Option A — Render.com (easiest, has a free tier)

1. Push this repo to GitHub.
2. On Render: **New → Blueprint**, select this repo. Render reads `render.yaml`
   and provisions the service **plus a 1 GB persistent disk** for the database.
3. Set `ADMIN_PASSWORD` when prompted (`JWT_SECRET` is generated for you).
4. After it deploys, open **Settings → Custom Domains**, add your domain, and
   create the CNAME record Render shows you at your domain registrar.

### Option B — Railway / Fly.io / any Node host

- Build command: `npm install`
- Start command: `node server.js`
- Set the environment variables from the table above.
- Attach a **persistent volume** and set `DB_PATH` to a path on it (e.g.
  `/data/council.db`) so registrations survive restarts and redeploys.

### Option C — Docker (VPS or any container host)

```bash
docker build -t ssac .
docker run -d -p 80:3000 \
  -e ADMIN_PASSWORD='your-strong-password' \
  -e JWT_SECRET='your-long-random-secret' \
  -e DB_PATH='/data/council.db' \
  -v ssac-data:/data \
  ssac
```

Then point your domain's `A` record at the server's IP address.

> **A note on GitHub Pages:** GitHub Pages can only host static files — it
> cannot run this Node back-end, so registrations would not be saved centrally
> there. Use one of the hosts above for the full app. (If you only ever want the
> static pages, the front-end in `public/` will open on its own, but the API
> calls will not work.)

---

## Security notes

- Always set a strong `ADMIN_PASSWORD` and a random `JWT_SECRET` in production.
- The login endpoint is rate-limited (20 attempts / 15 min) and registration is
  rate-limited (10 / min) to discourage abuse.
- Serve the site over HTTPS (Render, Railway, Fly and most hosts provide this
  automatically once your domain is attached).

## Color palette

| Token  | Value     |
|--------|-----------|
| Navy   | `#023047` |
| Teal   | `#219EBC` |
| Sky    | `#8ECAE6` |
| Amber  | `#FFB703` |
| Orange | `#FB8500` |
| Paper  | `#F5FAFC` |
