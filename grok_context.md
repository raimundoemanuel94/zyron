# ZYRON - Full Project Context for Grok Analysis

Generated on: 2026-03-11

This document provides a complete overview of the ZYRON project architecture.

---

## 📂 Project Structure (Filtered)

```text
.agents/
  skills/zyron-senior-engineer/SKILL.md
  workflows/notebook-sync.md
api/
  logs.js
  search.js
  sync-workout.js
src/
  components/
    tabs/
      TabCoach.jsx
      TabEvolucao.jsx
      TabPainel.jsx
      TabPerfil.jsx
      TabTreino.jsx
  contexts/
    AuthContext.jsx
    MusicContext.jsx
  hooks/
    useSyncWorkout.js
  utils/
    audioUnlock.js
    db.js
    logger.js
    sanitizer.js
package.json
vite.config.js
vercel.json
supabase_schema.sql
rbac_setup.sql
```

---

## ⚙️ Configuration Files

### package.json

```json
{
  "name": "zyron",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@google/genai": "^1.43.0",
    "@supabase/supabase-js": "^2.98.0",
    "framer-motion": "^12.34.4",
    "lucide-react": "^0.576.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "vite": "^6.0.0"
  }
}
```

### vite.config.js

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "ZYRON — A Força da Sua Evolução",
        short_name: "ZYRON",
        theme_color: "#000000",
        background_color: "#000000",
        display: "standalone",
      },
    }),
  ],
});
```

---

## 🗄️ Database Schema (Full)

### supabase_schema.sql

```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  email TEXT,
  age INTEGER,
  height DECIMAL,
  weight DECIMAL,
  goal TEXT,
  level TEXT,
  water_goal DECIMAL,
  protein_goal DECIMAL,
  role TEXT DEFAULT 'PRO',
  plan_status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.workout_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workout_key INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.daily_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  water_amount DECIMAL DEFAULT 0,
  protein_amount DECIMAL DEFAULT 0,
  UNIQUE(user_id, date)
);

ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.exercise_prs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercise_id TEXT NOT NULL,
  max_load DECIMAL NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, exercise_id)
);

ALTER TABLE public.exercise_prs ENABLE ROW LEVEL SECURITY;
```

### rbac_setup.sql

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TABLE IF NOT EXISTS public.trainer_students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(trainer_id, student_id)
);

ALTER TABLE public.trainer_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Personals can manage their students link" ON public.trainer_students
  FOR ALL USING (auth.uid() = trainer_id);

CREATE POLICY "Personals can view their students' profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.trainer_students WHERE trainer_id = auth.uid() AND student_id = public.profiles.id)
  );
```

---

## 🛡️ Core Logic Implementation

### sanitizer.js

```javascript
export const sanitizeWorkoutState = (state) => {
  if (state === null || state === undefined) return state;
  if (typeof state !== "object") return state;
  if (Array.isArray(state))
    return state.map((item) => sanitizeWorkoutState(item));
  const sanitized = {};
  for (const [key, value] of Object.entries(state)) {
    if (key.startsWith("_") || key.startsWith("$$")) continue;
    if (value && typeof value === "object") {
      if (
        value instanceof Node ||
        (typeof value.nodeType === "number" &&
          typeof value.nodeName === "string")
      )
        continue;
      if (value.nativeEvent || value.target) continue;
      sanitized[key] = sanitizeWorkoutState(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};
```

### db.js

```javascript
class ZyronDB {
  async open() {
    const request = indexedDB.open("ZYRON_OFFLINE_DB", 1);
    request.onupgradeneeded = (e) =>
      e.target.result.createObjectStore("PENDING_PHOTOS", { keyPath: "id" });
    return new Promise(
      (resolve) => (request.onsuccess = (e) => resolve(e.target.result)),
    );
  }
  async savePhoto(id, data) {
    const db = await this.open();
    return new Promise(
      (resolve) =>
        (db
          .transaction("PENDING_PHOTOS", "readwrite")
          .objectStore("PENDING_PHOTOS")
          .put({ id, data }).onsuccess = () => resolve(true)),
    );
  }
}
```

### useSyncWorkout.js (Simplified Workflow)

```javascript
export function useSyncWorkout(user) {
  // Logic to queue and sync workouts with photo support using fetch(/api/sync-workout)
  // Integrates with IndexedDB for photo persistence when offline.
}
```

---

## 📜 Senior Guidelines

- Use **useSyncWorkout** for all data sync.
- **Sanitize** state before LocalStorage storage.
- Keep **audioUnlocker** active for iOS background play.
