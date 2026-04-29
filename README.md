# Express Student Management API

REST API untuk manajemen siswa, mata pelajaran, dan nilai berbasis Node.js + Express + MongoDB Atlas, siap deploy ke Vercel.

---

## Fitur

- **Autentikasi JWT** — Register & login dengan bcrypt password hashing
- **Manajemen Siswa** — CRUD lengkap dengan pagination dan soft delete
- **Manajemen Mata Pelajaran** — CRUD lengkap dengan soft delete
- **Manajemen Nilai** — Assign nilai, generate laporan lengkap per siswa
- **Character Checker** — Perbandingan karakter unik antar string (case-sensitive/insensitive)
- **Soft Delete** — Data tidak dihapus permanen, hanya ditandai `isDeleted: true`
- **Siap Deploy** — Konfigurasi Vercel sudah tersedia

---

## Prasyarat

- Node.js v18+
- npm v8+
- Akun MongoDB Atlas (atau MongoDB lokal)

---

## Instalasi

```bash
# Clone repo dan masuk ke folder backend
cd backend

# Install dependencies
npm install

# Salin file environment
cp .env.example .env
```

Edit file `.env` sesuai konfigurasi kamu:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/student-management
JWT_SECRET=ganti-dengan-secret-yang-kuat
PORT=5000
```

---

## Menjalankan Aplikasi

```bash
# Mode development (auto-restart dengan nodemon)
npm run dev

# Mode production
npm start
```

Server akan berjalan di `http://localhost:5000` (atau PORT yang dikonfigurasi).

---

## Seed Data

Untuk mengisi database dengan data dummy:

```bash
npm run seed
```

Data yang akan dibuat:
- 2 user (termasuk `ardi@gmail.com` / `password123`)
- 5 siswa
- 4 mata pelajaran
- 20 data nilai

---

## npm Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm start` | `node src/app.js` | Run in production mode |
| `npm run dev` | `nodemon src/app.js` | Run in development mode (auto-restart) |
| `npm test` | `jest --coverage` | Run all tests with coverage report |
| `npm run test:watch` | `jest --watchAll` | Run tests in watch mode |
| `npm run seed` | `node seed.js` | Seed database with sample data |

---

## Testing

```bash
# Jalankan semua test sekali
npm test

# Mode watch (auto-rerun saat file berubah)
npm run test:watch
```

### Testing Approach

The project uses a three-layer testing strategy:

#### Unit Tests (Jest)
Unit tests validate individual functions and controllers in isolation. They cover:
- **Authentication controller** — registration, login, duplicate email handling
- **Student controller** — CRUD operations, pagination, soft delete
- **Subject controller** — CRUD operations, duplicate code handling
- **Grade controller** — score/attendance range validation, referential integrity
- **Checker controller** — case-sensitive and case-insensitive character matching
- **Auth middleware** — JWT verification, missing/invalid token handling

#### Integration Tests (Supertest + mongodb-memory-server)
Integration tests validate end-to-end flows using an in-memory MongoDB instance:
- Full authentication flow: register → login → access protected endpoint
- Grade report generation with complex business logic calculations
- Database operations with referential integrity enforcement
- Middleware configuration (CORS, JSON parsing, error handling)

#### Property-Based Tests (fast-check)
Property-based tests verify universal correctness properties across many randomly generated inputs. 15 properties are tested:

| # | Property | Validates |
|---|----------|-----------|
| 1 | Password hashing with bcrypt | Hash differs from original; bcrypt.compare returns true |
| 2 | Email format validation | Validation passes only for valid email formats |
| 3 | Soft delete operation preservation | isDeleted=true; all other fields unchanged |
| 4 | Soft delete query filtering | Queries automatically exclude isDeleted=true records |
| 5 | Age validation | Passes only for positive numbers (> 0) |
| 6 | Score and attendance range validation | Passes only for values 0–100 inclusive |
| 7 | Grade letter calculation | A(≥90), B(≥75), C(≥60), D(≥50), E(<50) |
| 8 | Attendance bonus application | +5 bonus when attendance ≥ 80, capped at 100 |
| 9 | Average score calculation | Average = sum / count |
| 10 | Pass rate calculation | Pass rate = (count ≥ 60) / total × 100 |
| 11 | Pass/fail status determination | "pass" when average ≥ 60, "fail" otherwise |
| 12 | Unique character extraction | Unique count = size of distinct character set |
| 13 | Case-sensitive character matching | Exact case matching for type="sensitive" |
| 14 | Case-insensitive character matching | Lowercase matching for type="insensitive" |
| 15 | Percentage calculation with rounding | (matched/total)×100 rounded to 2 decimal places |

---

## Endpoint API

### Base URL
```
http://localhost:5000/api
```

### Autentikasi (Public)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/auth/register` | Daftar user baru, return JWT |
| POST | `/auth/login` | Login, return JWT |

**Contoh Register:**
```json
POST /api/auth/register
{
  "name": "Lazuardi",
  "email": "ardi@gmail.com",
  "password": "password123"
}
```

**Contoh Login:**
```json
POST /api/auth/login
{
  "email": "ardi@gmail.com",
  "password": "password123"
}
```

> Semua endpoint di bawah ini memerlukan header: `Authorization: Bearer <token>`

---

### Siswa (Protected)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/students?page=1&limit=10` | Daftar semua siswa (dengan pagination) |
| POST | `/students` | Tambah siswa baru |
| PUT | `/students/:id` | Update data siswa |
| DELETE | `/students/:id` | Soft delete siswa |

**Contoh Create Student:**
```json
POST /api/students
{
  "name": "Budi Santoso",
  "studentId": "STU001",
  "class": "10A",
  "age": 16
}
```

---

### Mata Pelajaran (Protected)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/subjects` | Daftar semua mata pelajaran |
| POST | `/subjects` | Tambah mata pelajaran baru |
| PUT | `/subjects/:id` | Update mata pelajaran |
| DELETE | `/subjects/:id` | Soft delete mata pelajaran |

**Contoh Create Subject:**
```json
POST /api/subjects
{
  "name": "Mathematics",
  "code": "MTH101",
  "description": "Matematika dasar"
}
```

---

### Nilai (Protected)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/grades` | Assign nilai ke siswa untuk mata pelajaran tertentu |
| GET | `/grades/report` | Generate laporan nilai lengkap semua siswa |

**Contoh Assign Grade:**
```json
POST /api/grades
{
  "studentId": "<MongoDB ObjectId siswa>",
  "subjectId": "<MongoDB ObjectId mata pelajaran>",
  "score": 85,
  "attendance": 90
}
```

**Contoh Response Report:**
```json
GET /api/grades/report
{
  "success": true,
  "message": "Grade report generated successfully",
  "data": {
    "report": [
      {
        "studentId": "STU001",
        "studentName": "Budi Santoso",
        "class": "10A",
        "subjects": [
          {
            "subjectName": "Mathematics",
            "subjectCode": "MTH101",
            "score": 85,
            "attendance": 90,
            "finalScore": 90,
            "gradeLetter": "A"
          }
        ],
        "averageScore": 90,
        "passRate": 100,
        "status": "pass"
      }
    ]
  }
}
```

**Logika Kalkulasi Nilai:**
- Jika `attendance >= 80`, tambahkan 5 poin bonus ke score (maksimal 100)
- Grade letter: A (≥90), B (≥75), C (≥60), D (≥50), E (<50)
- Pass rate: persentase mata pelajaran dengan score ≥ 60
- Status: `pass` jika rata-rata ≥ 60, `fail` jika tidak

---

### Character Checker (Protected)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/checker` | Cek overlap karakter unik antara dua string |

**Contoh Request:**
```json
POST /api/checker
{
  "input1": "ABBCD",
  "input2": "Gallant Duck",
  "type": "insensitive"
}
```

**Contoh Response:**
```json
{
  "success": true,
  "message": "Character check completed successfully",
  "data": {
    "input1": "ABBCD",
    "input2": "Gallant Duck",
    "type": "insensitive",
    "matched": 3,
    "total": 5,
    "percentage": 60
  }
}
```

---

## Format Response

Semua endpoint menggunakan format response yang konsisten:

```json
{
  "success": true | false,
  "message": "Pesan deskriptif",
  "data": { ... }
}
```

---

## Deploy ke Vercel

1. Push kode ke GitHub
2. Hubungkan repository ke Vercel
3. Set environment variables di dashboard Vercel:
   - `MONGODB_URI`
   - `JWT_SECRET`
4. Deploy otomatis akan berjalan

File `vercel.json` sudah dikonfigurasi untuk routing serverless.

---

## Struktur Proyek

```
backend/
├── src/
│   ├── app.js                    # Entry point Express
│   ├── config/
│   │   └── database.js           # Koneksi MongoDB dengan connection pooling
│   ├── models/
│   │   ├── BaseModel.js          # Schema dasar dengan soft delete
│   │   ├── UserModel.js          # Model user dengan bcrypt
│   │   ├── StudentModel.js       # Model siswa
│   │   ├── SubjectModel.js       # Model mata pelajaran
│   │   └── GradeModel.js         # Model nilai
│   ├── controllers/
│   │   ├── authController.js     # Register & login
│   │   ├── studentController.js  # CRUD siswa
│   │   ├── subjectController.js  # CRUD mata pelajaran
│   │   ├── gradeController.js    # Assign nilai & laporan
│   │   └── checkerController.js  # Character checker
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── studentRoutes.js
│   │   ├── subjectRoutes.js
│   │   ├── gradeRoutes.js
│   │   └── checkerRoutes.js
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT verification
│   └── utils/
│       ├── gradeCalculator.js    # Logika kalkulasi nilai
│       └── characterChecker.js  # Logika character checker
├── seed.js                       # Script seed data dummy
├── vercel.json                   # Konfigurasi Vercel
├── .env.example                  # Template environment variables
└── package.json
```
