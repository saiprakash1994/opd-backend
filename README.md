# OPD Backend - Local Setup

1) Copy `.env.example` to `.env` and update values:

```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/opd
JWT_SECRET=dev_access_secret_change_me
REFRESH_SECRET=dev_refresh_secret_change_me
CORS_ORIGIN=http://localhost:19006,http://localhost:3000
```

2) Install deps and run:

```
npm install
npm run dev
```

3) Healthcheck: open http://localhost:5000/health

Auth endpoints:
- POST /api/auth/login { email, password }
- POST /api/auth/refresh { refreshToken }
- POST /api/auth/logout { refreshToken }

