# PR Title

## Summary
- What is changing and why?
- Link to issue/trello/linear (if any)

## Prize Track (select all that apply)
- [ ] Supabase — auth/storage/database used; link to Supabase dashboard evidence
- [ ] Railway — app deployed; link to service URL and Variables screenshot
- [ ] Anthropic — Claude messages used via `@anthropic-ai/sdk`; link to a sample request id
- [ ] Fish Audio — TTS/voice clone; attach the trained model id or demo URL
- [ ] Other sponsor track: ________________________

## Demo
- Steps for judges to run locally
- Live demo links (Railway URL, ngrok, etc.)
- Screenshots or short video (gif/mp4)

## Environment
- [ ] `.env` complete for local dev (no secrets in repo)
- [ ] Railway Variables set (URL, keys, DB URLs)
- [ ] NEXT_PUBLIC_BASE_URL matches deploy domain

## Test Plan
- [ ] `npm run dev` boots without errors
- [ ] Create user → upload/record → receive Claude response → hear audio (or browser TTS fallback)
- [ ] 3D face renders and animates during playback

## Risk/Impact
- Any breaking changes? migrations? new envs?

## Notes for CodeRabbit
- Critical files to scrutinize:
  - API routes in `app/api/*` (security, timeouts)
  - Prisma schema and access patterns
  - Any client-side key exposure (should be none)
- Prefer actionable suggestions; request changes if security or PII risks are found.
