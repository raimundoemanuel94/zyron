# 🏗️ Architecture — ZYRON

## System Overview

```
┌─────────────────────────────────────────────────────┐
│                   ZYRON Platform                     │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌──────────────┐         ┌──────────────┐          │
│  │   Browser    │         │  Mobile App  │          │
│  │   (PWA)      │         │   (PWA)      │          │
│  └──────┬───────┘         └──────┬───────┘          │
│         │                        │                   │
│         └────────────┬───────────┘                   │
│                      │                               │
│              ┌───────▼──────────┐                    │
│              │   Vercel Edge    │                    │
│              │   (Static/CDN)   │                    │
│              └───────┬──────────┘                    │
│                      │                               │
│  ┌───────────────────┼───────────────────┐          │
│  │    API Routes     │     Functions      │          │
│  │ (Vercel Serverless)                    │          │
│  └───────────────────┼───────────────────┘          │
│                      │                               │
│         ┌────────────┼────────────┐                  │
│         │            │            │                  │
│    ┌────▼────┐ ┌────▼────┐ ┌────▼────┐             │
│    │ Supabase │ │ Gemini  │ │  Groq   │             │
│    │ (Auth +  │ │   (AI)  │ │   (AI)  │             │
│    │   DB)    │ │         │ │         │             │
│    └──────────┘ └─────────┘ └─────────┘             │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### Technology Stack
- **Framework:** React 18.3
- **Build:** Vite 6.0
- **Styling:** Tailwind CSS 4.0
- **State:** Context API + useReducer
- **Animations:** Framer Motion
- **HTTP:** Supabase SDK

### Component Hierarchy

```
App.jsx
├── AuthContext
├── ThemeContext
├── MusicContext
│
├── FichaDeTreinoScreen
│   ├── TabTreino (Active Tab)
│   │   ├── WorkoutCard
│   │   │   ├── ExerciseAnatomy
│   │   │   └── Timer
│   │   └── AnatomyMap2D
│   │
│   ├── TabPainel
│   ├── TabEvolucao
│   │   └── EvolutionTimeline
│   ├── TabPerfil
│   └── TabCoach
│       └── AI Coach (Gemini)
│
└── PWASplashScreen (Loading)
```

---

## State Management

### Context Providers

```javascript
AuthContext
├── user (current user)
├── isAuthenticated
├── login(email, password)
└── logout()

ThemeContext
├── theme ('light' | 'dark')
└── toggleTheme()

MusicContext
├── currentTrack
├── isPlaying
├── playlist
└── play(track)
```

### Component State (Hooks)

```javascript
FichaDeTreinoScreen
├── useState: selectedTab
├── useState: completedExercises
├── useState: loads (weight tracking)
└── useSyncWorkout (custom hook)

WorkoutCard
├── useState: isExpanded
├── useState: activeSet
├── useState: isRunning (timer)
└── useMusclePump (custom hook)
```

---

## Data Flow

### Workout Session Flow

```
User Opens App
    ↓
[AuthContext] Verifies Login
    ↓
[FichaDeTreinoScreen] Loads Today's Workout
    ↓
[TabTreino] Shows Exercise List
    ↓
User Clicks Exercise
    ↓
[WorkoutCard] Expands → Shows ExerciseAnatomy
    ↓
User Starts Set (Timer)
    ↓
[useMusclePump] Activates Muscle Animation
    ↓
User Completes Set
    ↓
[useSyncWorkout] Saves to Supabase
    ↓
[WorkoutCard] Shows Next Set
```

---

## Backend Architecture

### Vercel Functions

```
api/
├── audio-stream/[id].js
│   └── GET /audio-stream/:id → Stream audio file
│
├── logs.js
│   ├── POST /api/logs → Save client logs
│   └── GET /api/logs → Retrieve logs
│
├── search.js
│   └── POST /api/search → Search exercises/workouts
│
└── sync-workout.js
    ├── POST /api/sync-workout → Save workout session
    └── GET /api/sync-workout/:id → Get workout history
```

### Middleware Pattern

```javascript
// Protected API route example
export default async (req, res) => {
  // 1. Verify JWT token
  const { user, error } = await supabase.auth.getUser(req.headers.authorization)

  if (error) return res.status(401).json({ error })

  // 2. Check RBAC
  if (!user.email?.includes('@admin')) return res.status(403).json({ error: 'Forbidden' })

  // 3. Execute logic
  // ...
}
```

---

## Database Architecture

### Relationships

```
users
  │
  ├─→ workouts (1:N)
  │     ├─→ exercises (1:N)
  │     │     └─→ muscles (N:N via exercises_muscles)
  │     │
  │     └─→ workout_logs (1:N)
  │
  └─→ user_settings (1:1)
```

### Key Tables

```
users
├── id (PK)
├── email (unique)
├── created_at
└── last_login

exercises
├── id (PK)
├── name
├── group (chest, back, etc)
└── sets, reps

exercises_muscles
├── id (PK)
├── exercise_id (FK)
├── muscle_id (FK)
└── activation_percentage

workout_logs
├── id (PK)
├── user_id (FK)
├── exercise_id (FK)
├── weight_kg
├── date
└── completed
```

---

## Integration Points

### Supabase Auth
- Sign up / Sign in
- JWT token management
- User sessions
- RLS (Row Level Security)

### Google Gemini
- Natural language coaching
- Workout suggestions
- Exercise form analysis

### Groq Llama 3.3
- Fast inference
- Budget-friendly AI
- Offline cache support

---

## Caching Strategy

### Client-Side
- React Context (session data)
- IndexedDB (offline workouts)
- Service Worker (static assets)

### Server-Side
- Vercel Edge caching (API responses)
- Supabase caching (frequently accessed data)
- CDN caching (images, fonts)

---

## Security Architecture

### Authentication
```
Client                          Server
   │                               │
   ├─ Email + Password            │
   │─────────────────────────────→│
   │                     [Hash + Compare]
   │                    [Generate JWT Token]
   │←─ JWT Token + Refresh Token ─|
   │
   ├─ Store JWT in Memory         │
   │  (not localStorage for security)
   │
   ├─ Include JWT in API calls    │
   │─────────────────────────────→│
   │                      [Verify JWT]
   │←─ Protected Resource ─────────|
```

### Authorization (RBAC)
```
JWT Token Decoded
├── user_id
├── email
├── role (user | admin | coach)
└── permissions (derived from role)

Middleware checks:
├── if (role === 'admin') → allow admin routes
├── if (role === 'coach') → allow coaching features
└── if (role === 'user') → allow basic features
```

---

## Error Handling

```javascript
// Global Error Boundary
<ErrorBoundary>
  <App />
</ErrorBoundary>

// Per-component error handling
try {
  const data = await supabase.from('workouts').select()
} catch (error) {
  logger.error('Failed to load workouts', error)
  showNotification('Erro ao carregar treinos', 'error')
}
```

---

## Performance Considerations

### Code Splitting
- Route-based lazy loading
- Component-based code splitting
- Dynamic imports for heavy features

### Bundle Optimization
- Tree-shaking unused code
- Minification + Compression (Gzip)
- Image optimization (Webp)

### Runtime Performance
- Memoization (React.memo)
- useMemo/useCallback for expensive operations
- Virtualization for long lists
- Debouncing/Throttling for expensive events

---

## Scalability Plan

### Phase 1 (Current)
- Single Vercel region
- Supabase free tier
- Basic caching

### Phase 2 (10K+ users)
- Multiple Vercel regions
- Supabase pro tier
- Redis caching layer
- Database read replicas

### Phase 3 (100K+ users)
- Custom API server (Node.js)
- Database sharding
- Advanced CDN caching
- Message queue (for async tasks)

---

## Development Workflow

```
Local Development
    ↓ (npm run dev)
Vite Dev Server (http://localhost:5173)
    │
    ├─ Hot Module Replacement (HMR)
    ├─ Instant reload on save
    └─ Source maps for debugging
    ↓
Testing (npm run test)
    ↓
Build (npm run build)
    ↓
Production Build Preview (npm run preview)
    ↓
Git Push to GitHub
    ↓
Vercel Auto-Deploy
    ↓
Production (https://axiron.vercel.app)
```

---

## Monitoring & Logging

### Client-Side Logging
```javascript
import logger from '@/utils/logger'

logger.info('Workout started')
logger.error('Failed to sync', error)
```

### Server-Side Logging
```javascript
// API routes log to Vercel Logs
console.log('API call:', req.method, req.url)
```

### Error Tracking
- Sentry (if configured)
- Vercel Analytics
- Browser console errors

---

## Future Improvements

- [ ] GraphQL API (instead of REST)
- [ ] Real-time sync (WebSockets)
- [ ] Machine learning for workouts
- [ ] Social features (leaderboards)
- [ ] Mobile native apps (React Native)
- [ ] Admin dashboard (Next.js)

---

## References

- React: https://react.dev/learn/thinking-in-react
- Vite: https://vitejs.dev/guide
- Supabase: https://supabase.com/docs/guides
