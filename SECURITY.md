# Security Policy

## Supported Versions

Currently supported versions for security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Replik seriously. If you discover a security vulnerability, please follow these steps:

### 1. **Do NOT** disclose the vulnerability publicly

Please do not open a public GitHub issue for security vulnerabilities.

### 2. Report via Email

Send a detailed report to: **shoadachi1101@gmail.com**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### 3. Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depends on severity (Critical: < 7 days, High: < 14 days, Medium: < 30 days)

### 4. Coordinated Disclosure

We follow responsible disclosure practices:
1. We'll work with you to understand and validate the issue
2. We'll develop and test a fix
3. We'll release a security update
4. After the fix is deployed, we'll publicly acknowledge your contribution (unless you prefer to remain anonymous)

---

## Security Best Practices for Deployment

### 🔐 Environment Variables

**CRITICAL: Never commit `.env` files to git!**

```bash
# Already in .gitignore:
.env
.env*.local
.env.production
```

### 🚨 Service Role Key Protection

The `SUPABASE_SERVICE_ROLE_KEY` is **extremely sensitive** and must be protected:

✅ **DO:**
- Only use in API routes (server-side)
- Store in environment variables
- Rotate regularly (every 90 days)
- Use different keys for dev/staging/production

❌ **DON'T:**
- Never expose to frontend code
- Never log in console
- Never commit to git
- Never share publicly

### 🔑 API Keys Security

All API keys should be treated as secrets:

| Variable | Sensitivity | Location | Notes |
|----------|-------------|----------|-------|
| `SUPABASE_SERVICE_ROLE_KEY` | **CRITICAL** | Server-only | Bypasses RLS |
| `ANTHROPIC_API_KEY` | High | Server-only | Claude API access |
| `FISH_AUDIO_API_KEY` | High | Server-only | Voice synthesis |
| `MINECRAFT_API_KEY` | Medium | Server-only | External integrations |
| `NEXT_PUBLIC_SUPABASE_URL` | Low | Public | URL only, no secret |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Low | Public | Respects RLS |

### 🛡️ Authentication & Authorization

**Web Users:**
- All authenticated via Supabase Auth
- Row Level Security (RLS) enforced on database
- Session tokens stored in HTTP-only cookies

**Minecraft Mod:**
- Requires `MINECRAFT_API_KEY` in X-API-Key header
- Or user must be authenticated via Supabase session

**Public Endpoints:**
- `/api/clones` - Public by design (only returns public profiles)
- `/api/minecraft/export/*` - Public by design (only returns public clones)

### 🚦 Rate Limiting Recommendations

**⚠️ WARNING:** Currently, rate limiting is NOT implemented. For production deployments, we strongly recommend adding rate limiting to prevent abuse.

**Recommended Implementation:**

```typescript
// Using Upstash Redis Rate Limiting
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"), // 10 requests per 10 seconds
});
```

**Endpoints that need rate limiting:**
1. `/api/speak` - Most expensive (AI + TTS costs)
2. `/api/clones` - Can be scraped
3. `/api/minecraft/export/*` - Public access
4. `/api/upload` - File uploads
5. `/api/upload-photo` - Image uploads

### 🔒 CORS Configuration

By default, Next.js API routes are accessible from any origin. For production:

1. Add explicit CORS headers to public endpoints
2. Whitelist your frontend domain
3. Use proper preflight handling

Example:
```typescript
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    },
  });
}
```

### 📊 Monitoring & Logging

**What to monitor:**
- Failed authentication attempts
- Unusual API usage patterns
- API quota consumption (Anthropic, Fish Audio)
- Database query performance
- Error rates

**What NOT to log:**
- Full API keys or tokens
- User passwords
- Service role keys
- Personal identification information (unless necessary and encrypted)

### 🗄️ Database Security

**Supabase Row Level Security (RLS):**

All tables should have RLS policies. Current RLS setup:

```sql
-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);
```

**⚠️ Service Role bypasses RLS** - Use with caution!

### 🌐 Deployment Checklist

Before deploying to production:

- [ ] All API keys in environment variables (not hardcoded)
- [ ] `.env` files in `.gitignore`
- [ ] Service role key is NOT in frontend code
- [ ] HTTPS enabled (force SSL)
- [ ] Rate limiting implemented
- [ ] Error messages don't leak sensitive info
- [ ] Database backups configured
- [ ] Monitoring and alerting set up
- [ ] CORS properly configured
- [ ] Security headers set (CSP, HSTS, etc.)

### 🔄 Key Rotation

Rotate keys regularly:

| Key Type | Rotation Frequency |
|----------|-------------------|
| Service Role Key | Every 90 days |
| API Keys | Every 180 days |
| Database Passwords | Every 180 days |
| Minecraft API Key | Every 365 days |

### 🛡️ Dependency Security

Keep dependencies updated:

```bash
# Check for vulnerabilities
npm audit

# Fix automatically (if possible)
npm audit fix

# Review and update dependencies
npm outdated
```

Enable GitHub Dependabot alerts:
1. Go to repo Settings
2. Security & analysis
3. Enable "Dependabot alerts"

---

## Known Limitations

### Current Security Gaps

1. **No Rate Limiting** - Endpoints can be abused
   - **Mitigation**: Add Upstash or similar rate limiting

2. **Public Minecraft Export** - Anyone can export public clones
   - **Mitigation**: By design for Minecraft integration. Users must opt-in via `isPublic` flag

3. **Voice Model IDs Exposed** - Fish Audio model IDs are visible
   - **Mitigation**: IDs alone cannot be used without Fish Audio API key

4. **No Request Signing** - API requests aren't cryptographically signed
   - **Mitigation**: Use HTTPS + authentication tokens

### Accepting These Risks

These limitations are acceptable because:
- The app is designed for public AI clones (opt-in)
- Users control what data they make public
- Authentication prevents unauthorized modifications
- Costs are limited by API provider rate limits

---

## Security Features Implemented

✅ **Authentication**
- Supabase Auth with JWT tokens
- Password + Google OAuth
- HTTP-only session cookies

✅ **Authorization**
- Row Level Security (RLS) on database
- User-specific data access
- Service role used only server-side

✅ **Data Protection**
- HTTPS enforced in production
- Secrets in environment variables
- No secrets in git history

✅ **Input Validation**
- Prisma ORM (prevents SQL injection)
- UUID validation on user IDs
- File type validation on uploads

✅ **API Security**
- Authentication required on sensitive endpoints
- API key support for external integrations
- Proper error handling (no info leakage)

---

## Compliance & Privacy

### Data Collection

Replik collects:
- User account info (email, name, username)
- Voice recordings (for cloning)
- Conversation history
- Personality context (stories, habits, reactions)
- Photos (optional, for visual representation)

### Data Storage

- Voice recordings: Fish Audio (external service)
- Database: Supabase (PostgreSQL)
- Files: Supabase Storage
- Vector memories: ChromaDB (optional)

### User Rights

Users can:
- View all their data
- Delete their account (`/api/delete-account`)
- Export their clone data (JSON format)
- Control data visibility (`isPublic` flag)

### GDPR Considerations

If deploying in EU:
- Add cookie consent banner
- Provide data export functionality ✅ (already implemented)
- Implement data deletion ✅ (already implemented)
- Add privacy policy
- Document data processing

---

## Contact

For security concerns: **shoadachi1101@gmail.com**

For general issues: [GitHub Issues](https://github.com/ShoAdachi01/replik/issues)

---

**Last Updated:** 2025-10-29

