# 📊 Database Schema — ZYRON

## Overview

ZYRON usa **Supabase** (PostgreSQL) como banco de dados.

### Estrutura Geral

```
Database: zyron
├── auth (Supabase built-in)
├── public (tabelas aplicação)
│   ├── users
│   ├── workouts
│   ├── exercises
│   ├── muscles
│   ├── exercises_muscles
│   └── ... (other tables)
└── Storage (arquivos)
    ├── avatars/
    └── photos/
```

---

## 🗄️ Core Tables

### `muscles`
```sql
CREATE TABLE muscles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  anatomical_region TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Exemplo:**
```sql
INSERT INTO muscles VALUES
  ('pec_major', 'Peitoral Maior', 'chest', 'chest', null, now()),
  ('biceps', 'Bíceps', 'arms', 'arm', null, now());
```

---

### `exercises_muscles`
```sql
CREATE TABLE exercises_muscles (
  id UUID PRIMARY KEY,
  exercise_id TEXT NOT NULL,
  muscle_id TEXT NOT NULL,
  activation_percentage INTEGER DEFAULT 50,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(exercise_id, muscle_id),
  FOREIGN KEY (muscle_id) REFERENCES muscles(id)
);
```

**Exemplo:**
```sql
INSERT INTO exercises_muscles VALUES
  (uuid_v4(), 'p1', 'pec_major', 90, true, now(), now()),
  (uuid_v4(), 'p1', 'triceps', 70, false, now(), now());
```

---

## 🔑 Authentication

ZYRON usa **Supabase Auth** com JWT tokens:

```javascript
// Client
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure_password'
});
```

---

## 📂 SQL Files Location

```
docs/database/
├── anatomy.sql              # Anatomy system tables
├── schema.sql               # Main schema
├── rbac.sql                 # Role-based access control
├── missing.sql              # Legacy schema (reference)
└── missing_photos.sql       # Photo storage schema (reference)
```

---

## 🚀 Setup

1. Create Supabase project: https://supabase.com
2. Go to SQL Editor
3. Execute files in order:
   ```bash
   1. docs/database/schema.sql
   2. docs/database/rbac.sql
   3. docs/database/anatomy.sql
   ```

---

## 🔒 Row Level Security (RLS)

Recommended RLS policies:

```sql
-- Users can only read/update their own data
CREATE POLICY "Users read own data"
  ON users FOR SELECT
  USING (auth.uid() = id);
```

---

## 📈 Performance

### Indexes
All critical columns already have indexes:
- `exercises_muscles(exercise_id)`
- `exercises_muscles(muscle_id)`
- `muscles(category)`

### Query Optimization
```sql
-- Good: Use indexes
SELECT * FROM exercises_muscles
WHERE exercise_id = 'p1';

-- Avoid: Full table scan
SELECT * FROM muscles
WHERE name LIKE '%bic%';
```

---

## 🔄 Backup & Recovery

```bash
# Export database
pg_dump postgres://user:password@db.supabase.co/postgres > backup.sql

# Restore
psql postgres://user:password@db.supabase.co/postgres < backup.sql
```

---

## 📞 Support

- Supabase Docs: https://supabase.com/docs
- PostgreSQL Docs: https://www.postgresql.org/docs/
