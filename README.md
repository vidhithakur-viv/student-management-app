# Student Management – React Native (Expo) + FastAPI + MongoDB

A mobile CRUD app for managing students, with JWT login and role-based access.

## 1. Project overview
Authorized users (admin / faculty) log in, view, search, add, edit and (admin only) delete students from an Android phone.

## 2. Architecture
```
React Native + Expo + TypeScript   (mobile/)
              |  REST / JSON  (Authorization: Bearer <JWT>)
              v
FastAPI + Pydantic (Python)        (backend/)
              |  PyMongo
              v
MongoDB  (collections: users, students)
```

## 3. Technology stack
Mobile: React Native, Expo SDK 57, TypeScript, Expo Router, Axios, expo-secure-store.
Backend: Python 3.11+, FastAPI, Pydantic v2, PyMongo (sync), PyJWT, bcrypt.
Database: MongoDB. Tests: pytest + HTTPX (FastAPI TestClient) + mongomock.

## 4. Features
Login / logout · student list (FlatList, pull-to-refresh) · search by name/email/course · details · add · edit · delete with confirmation · loading / empty / error states · secure token storage · expired-JWT auto-logout.

Roles: **admin** = create, read, update, delete. **faculty** = create, read, update (the Delete button is hidden and the API returns 403).

## 5. Folder structure
```
student-management/
├── backend/
│   ├── app/{main.py, config/, models/, schemas/, routes/, services/, database/, auth/, middleware/}
│   ├── scripts/seed_users.py      # creates demo admin + faculty
│   ├── tests/                     # pytest suite (38 tests)
│   ├── postman/                   # importable Postman collection
│   ├── run.py  requirements.txt  requirements-dev.txt  .env.example
└── mobile/
    ├── app/        # Expo Router screens: login, index (list), students/new, students/[id]/index, students/[id]/edit
    ├── services/   # api.ts (Axios client), authApi.ts, studentApi.ts
    ├── context/    # AuthContext.tsx
    ├── components/ types/ utils/ constants/
    └── package.json  app.json  .env.example
```

## 6. Prerequisites
- Python 3.11+ · Node.js LTS + npm · MongoDB Community Server (or a MongoDB Atlas URI)
- VS Code, Git, Postman (optional)
- Android: **Expo Go** app on a phone, or Android Studio with an emulator

## 7–8. Python setup + virtual environment
```bash
cd backend
python -m venv venv
# Windows (PowerShell):  venv\Scripts\Activate.ps1
# Windows (cmd):         venv\Scripts\activate.bat
# macOS / Linux:         source venv/bin/activate
python -m pip install --upgrade pip
```

## 9. MongoDB setup
1. Install MongoDB Community Server and make sure it is running on `localhost:27017`
   (Windows: the "MongoDB" service; macOS: `brew services start mongodb-community`; Linux: `sudo systemctl start mongod`).
2. The database `student_management` and its collections/indexes are created automatically on first run.
   Atlas alternative: use your `mongodb+srv://...` connection string as `MONGODB_URI`.

## 10. Environment variables
Backend `backend/.env` (copy from `.env.example`):
```
MONGODB_URI=mongodb://localhost:27017/student_management
JWT_SECRET=<long random string>
JWT_EXPIRE_MINUTES=60
PORT=8000
```
Generate a secret: `python -c "import secrets; print(secrets.token_urlsafe(48))"`

Mobile `mobile/.env` (copy from `.env.example`):
```
EXPO_PUBLIC_API_URL=http://192.168.1.100:8000/api
```
Real `.env` files are git-ignored. Never commit secrets.

## 11. Backend installation
```bash
cd backend
pip install -r requirements-dev.txt     # includes test tools; use requirements.txt for runtime only
cp .env.example .env                    # Windows: copy .env.example .env   (then edit JWT_SECRET)
python -m scripts.seed_users            # creates demo users
```
Demo users: `admin@example.com / Admin@123` (admin) · `faculty@example.com / Faculty@123` (faculty). **Change these outside local development.**

## 12. Backend execution
```bash
cd backend
python run.py
```
Starts uvicorn on `0.0.0.0:8000` (reachable from your phone). Check: http://localhost:8000/health

Run tests (no MongoDB needed – they use an in-memory mongomock database):
```bash
cd backend
pytest
```

## 13–14. Mobile installation and Expo setup
```bash
cd mobile
npm install
cp .env.example .env      # Windows: copy .env.example .env  – then edit EXPO_PUBLIC_API_URL
```
The `.npmrc` (legacy-peer-deps) is intentional; it avoids optional-peer conflicts between Expo packages.
If Expo reports version mismatches, run `npx expo install --fix`.

## 15. Running the mobile application
```bash
cd mobile
npx expo start -c
```
`-c` clears the cache; use it whenever you change `.env` (EXPO_PUBLIC_* values are read at bundle time).
Keep the backend running in another terminal.

## 16. Physical Android phone
`localhost` on a phone means *the phone itself*, so it can never reach your computer's FastAPI server. Use the computer's **LAN IP**.

1. Put the computer and phone on the **same Wi-Fi network**.
2. Find the computer's IP:
   - Windows: `ipconfig` → "IPv4 Address" of your Wi-Fi adapter (e.g. 192.168.1.10)
   - macOS: `ipconfig getifaddr en0`
   - Linux: `hostname -I`
3. Set `EXPO_PUBLIC_API_URL=http://192.168.1.10:8000/api` in `mobile/.env`.
4. Allow port 8000 through your firewall (Windows: allow "python" on Private networks, or `netsh advfirewall firewall add rule name="FastAPI 8000" dir=in action=allow protocol=TCP localport=8000`).
5. Verify from the **phone's browser**: `http://192.168.1.10:8000/health` must show `{"status":"ok"}`. If not, the app can't connect either.
6. Install **Expo Go** from Google Play, run `npx expo start -c`, scan the QR code.
   Expo Go supports only specific SDK versions; if it complains, update Expo Go, or build a development build (`npx expo run:android`).

## 17. Android emulator
- Start an emulator in Android Studio (Device Manager).
- The emulator reaches your computer at **`10.0.2.2`**: `EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api`
- Run `npx expo start -c`, press `a`.

Note: plain `http://` is fine in Expo Go / development. For a production build use HTTPS (Android blocks cleartext HTTP in release builds by default).

## 18. API documentation (Swagger)
- Swagger UI: http://localhost:8000/docs · OpenAPI JSON: http://localhost:8000/openapi.json
- Try it: `POST /api/auth/login` → *Try it out* → send demo credentials → copy `access_token` →
  click **Authorize** (top right) → paste the token (just the token) → call any student endpoint.

| Method | Path | Roles |
|---|---|---|
| POST | /api/auth/login | public |
| GET | /api/auth/me | any |
| GET | /api/students | admin, faculty |
| GET | /api/students/search?query=... | admin, faculty |
| GET | /api/students/{id} | admin, faculty |
| POST | /api/students | admin, faculty |
| PUT | /api/students/{id} | admin, faculty |
| DELETE | /api/students/{id} | admin only |

Validation: name/course required; valid email; phone 8–20 digits (optional leading +); age 5–120; year 1–10. Duplicate email → 409. Bad input → 422 with `detail` and `errors[]`.

## 19. Postman testing
1. Import `backend/postman/student-management.postman_collection.json`.
2. Collection variable `baseUrl` = `http://localhost:8000` (use the LAN IP if calling from another device).
3. Run **Login (admin)** first – its test script stores the JWT in the `token` variable.
4. All other requests use *Authorization → Bearer Token → `{{token}}`*; the collection includes Create, Get all, Get one (uses `{{studentId}}`, saved by Create), Update, Search, Delete.
5. Manually: add header `Authorization: Bearer <access_token>`.

## 20. Troubleshooting
| Symptom | Fix |
|---|---|
| "Cannot reach the server" in app | Wrong/`localhost` API URL, different Wi-Fi, firewall, or backend not running. Open `http://<IP>:8000/health` in the phone browser. |
| Changed `.env` but app uses old URL | Restart with `npx expo start -c`. |
| Emulator can't connect | Use `http://10.0.2.2:8000/api`. |
| Backend: `ValidationError ... jwt_secret` | Create `backend/.env` with `JWT_SECRET`. |
| 503 "Database unavailable" | MongoDB not running / wrong `MONGODB_URI`. |
| Login says invalid credentials | Run `python -m scripts.seed_users`. |
| 401 right after login | Device clock far off, or `JWT_SECRET` changed (log in again). |
| Delete button missing | You are logged in as faculty (admin only). |
| `npm install` peer errors | Keep the provided `.npmrc`; or `npm install --legacy-peer-deps`. |
| Expo Go "incompatible SDK" | Update Expo Go from Play Store or use `npx expo run:android`. |

## 21. Git / GitHub
```bash
cd student-management
git init
git add .
git status                       # confirm no .env files are listed
git commit -m "Initial commit: student management app"
git branch -M main
git remote add origin https://github.com/<your-username>/student-management.git
git push -u origin main
```
