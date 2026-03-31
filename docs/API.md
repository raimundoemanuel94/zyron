# 🔌 API Documentation — ZYRON

## Overview

ZYRON APIs são **Vercel Serverless Functions** + **Supabase SDK**.

---

## API Endpoints

### 🎵 Audio Stream

**GET** `/api/audio-stream/[id]`

Stream audio file for workouts.

```bash
curl -X GET https://axiron.vercel.app/api/audio-stream/track-001
```

**Response:**
```
200 OK
Content-Type: audio/mpeg
[Binary audio data]
```

---

### 📝 Logs

**POST** `/api/logs`

Save client-side logs to server.

```bash
curl -X POST https://axiron.vercel.app/api/logs \
  -H "Content-Type: application/json" \
  -d '{
    "level": "error",
    "message": "Failed to load workouts",
    "timestamp": "2026-03-31T10:00:00Z"
  }'
```

**Response:**
```json
{
  "success": true,
  "id": "log-123"
}
```

---

**GET** `/api/logs`

Retrieve logs (admin only).

```bash
curl -X GET https://axiron.vercel.app/api/logs \
  -H "Authorization: Bearer {JWT_TOKEN}"
```

**Response:**
```json
{
  "logs": [
    {
      "id": "log-123",
      "level": "error",
      "message": "Failed to load workouts",
      "timestamp": "2026-03-31T10:00:00Z"
    }
  ],
  "count": 1
}
```

---

### 🔍 Search

**POST** `/api/search`

Search exercises and workouts.

```bash
curl -X POST https://axiron.vercel.app/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "supino",
    "type": "exercise"
  }'
```

**Response:**
```json
{
  "results": [
    {
      "id": "p1",
      "name": "Supino Reto",
      "group": "chest",
      "sets": 4,
      "reps": "8-10"
    }
  ],
  "count": 1
}
```

---

### 💾 Sync Workout

**POST** `/api/sync-workout`

Save completed workout session.

```bash
curl -X POST https://axiron.vercel.app/api/sync-workout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -d '{
    "workout_id": "chest-day",
    "exercises": [
      {
        "id": "p1",
        "sets_completed": 4,
        "weight_kg": 100,
        "reps": [10, 8, 6, 6],
        "completed_at": "2026-03-31T10:30:00Z"
      }
    ],
    "duration_minutes": 45,
    "notes": "Great session!"
  }'
```

**Response:**
```json
{
  "success": true,
  "session_id": "sess-456",
  "saved_at": "2026-03-31T10:30:05Z"
}
```

---

**GET** `/api/sync-workout/:id`

Retrieve workout history.

```bash
curl -X GET https://axiron.vercel.app/api/sync-workout/sess-456 \
  -H "Authorization: Bearer {JWT_TOKEN}"
```

**Response:**
```json
{
  "id": "sess-456",
  "user_id": "user-123",
  "workout_id": "chest-day",
  "exercises": [
    {
      "id": "p1",
      "name": "Supino Reto",
      "sets_completed": 4,
      "weight_kg": 100,
      "reps": [10, 8, 6, 6]
    }
  ],
  "duration_minutes": 45,
  "completed_at": "2026-03-31T10:30:00Z"
}
```

---

## Supabase Client API

### Authentication

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})

// Sign out
await supabase.auth.signOut()

// Get current user
const { data: { user } } = await supabase.auth.getUser()
```

---

### Read Data

```javascript
// Get all exercises
const { data, error } = await supabase
  .from('exercises')
  .select('*')

// Get with filter
const { data } = await supabase
  .from('exercises')
  .select('*')
  .eq('group', 'chest')

// Get with join
const { data } = await supabase
  .from('exercises')
  .select(`
    id,
    name,
    exercises_muscles(
      muscle_id,
      activation_percentage
    )
  `)
  .eq('id', 'p1')

// Paginate
const { data } = await supabase
  .from('exercises')
  .select('*')
  .range(0, 9)  // First 10 items
```

---

### Write Data

```javascript
// Insert
const { data, error } = await supabase
  .from('workout_logs')
  .insert({
    user_id: user.id,
    exercise_id: 'p1',
    weight_kg: 100,
    completed_at: new Date()
  })

// Update
const { error } = await supabase
  .from('exercises')
  .update({ name: 'New Name' })
  .eq('id', 'p1')

// Delete
const { error } = await supabase
  .from('workout_logs')
  .delete()
  .eq('id', 'log-123')
```

---

### Real-Time Subscriptions

```javascript
// Listen to changes
const subscription = supabase
  .from('workout_logs')
  .on('*', payload => {
    console.log('Change received!', payload)
  })
  .subscribe()

// Unsubscribe
subscription.unsubscribe()
```

---

## AI API Integration

### Google Gemini

```javascript
import { GoogleGenerativeAI } from '@google/generai'

const genai = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY)
const model = genai.getGenerativeModel({ model: 'gemini-pro' })

const response = await model.generateContent(
  'Dê dicas de treino para peito'
)
console.log(response.text)
```

---

### Groq (Llama 3.3)

```javascript
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.VITE_GROQ_API_KEY
})

const response = await groq.chat.completions.create({
  model: 'llama-3.3-70b-versatile',
  messages: [
    {
      role: 'user',
      content: 'Analise meu desempenho de treino'
    }
  ]
})

console.log(response.choices[0].message.content)
```

---

## Error Handling

### Standard Error Response

```json
{
  "error": "Unauthorized",
  "message": "JWT token invalid",
  "code": "UNAUTHORIZED"
}
```

### Common Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| UNAUTHORIZED | 401 | Missing/invalid JWT token |
| FORBIDDEN | 403 | User lacks permissions |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid request body |
| SERVER_ERROR | 500 | Internal server error |

---

## Rate Limiting

- Per user: 100 requests/minute
- Per IP: 1000 requests/minute
- Vercel default limits apply

---

## Best Practices

### Authentication
- Always include JWT token in Authorization header
- Store JWT in memory (not localStorage)
- Refresh token before expiration

### Error Handling
```javascript
try {
  const { data, error } = await supabase.from('...').select()
  if (error) throw error
  return data
} catch (error) {
  console.error('API Error:', error.message)
  throw error
}
```

### Rate Limiting
- Debounce API calls
- Implement retry logic with exponential backoff
- Cache responses when possible

---

## Testing

### Local Testing

```bash
# Start dev server
npm run dev

# Test API endpoints
curl http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "supino"}'
```

### Production Testing

```bash
# Test on Vercel deployment
curl https://axiron.vercel.app/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "supino"}'
```

---

## Changelog

### v1.0 (Current)
- Basic REST API
- Supabase integration
- Gemini + Groq AI
- Audio streaming

### v1.1 (Planned)
- GraphQL API
- WebSocket real-time
- Advanced search
- Analytics endpoints

---

## Support

- Vercel API Docs: https://vercel.com/docs/functions/serverless-functions
- Supabase SDK: https://supabase.com/docs/reference/javascript
- Gemini API: https://ai.google.dev/docs
- Groq API: https://console.groq.com/docs
