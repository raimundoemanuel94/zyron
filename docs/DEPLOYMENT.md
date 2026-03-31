# 🚀 Deployment Guide — ZYRON

## Vercel Deployment

ZYRON é deployado automaticamente na Vercel via GitHub webhook.

### 1. Connect Repository

```bash
# Push para GitHub
git push origin master

# Vercel detecta automaticamente
# Deploy em ~3 minutos
```

### 2. Environment Variables

No Vercel dashboard, configure:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_YOUR_KEY
VITE_GEMINI_API_KEY=YOUR_GEMINI_KEY
VITE_GROQ_API_KEY=YOUR_GROQ_KEY
```

### 3. Build Configuration

Vercel detecta automaticamente:
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist/`

---

## Build Process

```bash
# Local build test
npm run build

# Preview production build
npm run preview

# Check file sizes
npm run analyze  # (if configured)
```

---

## Production Checklist

- ✅ `.env` variables configured in Vercel
- ✅ Supabase project configured
- ✅ Database schema executed
- ✅ Google Gemini API key valid
- ✅ Groq API key valid
- ✅ Build succeeds locally
- ✅ Tests pass (if applicable)
- ✅ No console errors

---

## Monitoring

### Logs
Vercel Dashboard → Deployments → [Build] → Logs

### Errors
- Check browser console: F12 → Console
- Check network requests: F12 → Network
- Check Vercel logs for build errors

### Performance
- Vercel Analytics: https://vercel.com/dashboard
- Lighthouse: DevTools → Lighthouse tab
- Bundle Size: `npm run build` → check `dist/`

---

## Troubleshooting

### Build Fails
```bash
# Local test
npm install
npm run build  # Should succeed locally before deploy
```

### Environment Variables Not Working
```bash
# Check in Vercel Dashboard
Settings → Environment Variables
# Make sure names match exactly
```

### API Keys Invalid
```bash
# Test locally
VITE_GEMINI_API_KEY=test npm run dev
# Check if API calls work
```

---

## Rollback

If deployment has issues:

1. Go to Vercel Dashboard
2. Deployments tab
3. Click on previous successful deployment
4. Promote to Production

---

## CI/CD Pipeline

Current: Git push → Vercel auto-deploy

Future improvements:
- Add GitHub Actions for tests
- Add ESLint check before deploy
- Add bundle size limit

---

## Performance Optimization

### Bundle Size
- Tree-shake unused imports
- Lazy load heavy components
- Use dynamic imports for routes

### Runtime Performance
- Use React.memo for expensive components
- Implement virtualization for long lists
- Optimize images

### Caching
- Vercel Edge Network: automatic CDN
- Service Worker: offline support (PWA)

---

## Scaling Considerations

As user base grows:
- Monitor Supabase connection limits
- Implement database connection pooling
- Add Redis caching (if needed)
- Split workouts table (if >1M records)

---

## Support

- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
