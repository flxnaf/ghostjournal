# 🚨 SECURITY ALERT - API KEY EXPOSURE

## What Happened?

Your **Fish Audio API key** was **hardcoded** in test script files (`test_fish*.sh`) that were **committed and pushed to GitHub**.

## ⚠️ IMMEDIATE ACTION REQUIRED

### 1. **Regenerate Your Fish Audio API Key NOW**

Your current key is **publicly visible** on GitHub. Anyone can see it in your repo's commit history.

**Steps:**
1. Go to https://fish.audio/
2. Navigate to **API Keys** or **Settings**
3. **Revoke/Delete** your current API key
4. **Generate a new API key**
5. Update your `.env` file with the new key:
   ```bash
   FISH_AUDIO_API_KEY="your_new_key_here"
   ```

### 2. **Never Commit API Keys Again**

✅ **Correct:** Store in `.env` file
```bash
# .env (this file is in .gitignore - safe!)
FISH_AUDIO_API_KEY="sk-abc123..."
ANTHROPIC_API_KEY="sk-ant-abc123..."
```

❌ **WRONG:** Hardcode in scripts
```bash
# test.sh - NEVER DO THIS!
API_KEY="sk-abc123..."  # ❌ Will be pushed to GitHub!
```

## What I Fixed

✅ **Deleted all test scripts** with hardcoded keys:
- `test_fish.sh`
- `test_fish_create.sh`
- `test_fish_detailed.sh`
- `test_fish_models.sh`
- `test_fish_reference.sh`
- `test_fish_with_reference.sh`
- `test_fish_create_proper.sh`

✅ **Added to `.gitignore`**:
```
test_fish*.sh
scripts/test_*.sh
```

✅ **Pushed changes** to remove files from repo

## ⚠️ Git History Still Contains Old Keys

Even though the files are deleted now, they're still visible in **git commit history**.

### Option 1: Quick Fix (Recommended for Hackathon)
Just regenerate your API key (step 1 above). Old key becomes useless.

### Option 2: Clean Git History (Optional, Advanced)
If you want to remove the keys from git history entirely:

```bash
# Use BFG Repo Cleaner
git clone --mirror git@github.com:your-repo.git
bfg --delete-files test_fish*.sh your-repo.git
cd your-repo.git
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force
```

**Warning:** This rewrites history and requires force push.

## Best Practices Going Forward

### For Testing APIs:

Create a safe test script that reads from `.env`:

```bash
#!/bin/bash
# test_api_safe.sh

# Load environment variables
source .env

# Now use $FISH_AUDIO_API_KEY safely
curl -X POST "https://api.fish.audio/v1/..." \
  -H "Authorization: Bearer $FISH_AUDIO_API_KEY" \
  -H "Content-Type: application/json"
```

### For Railway Deployment:

Use environment variables in Railway dashboard (already documented in `RAILWAY_DEPLOY.md`).

### For Local Development:

Always use `.env` file (already in `.gitignore`).

## Summary

- [x] Test files with keys **deleted**
- [x] Files **removed from repo**
- [x] `.gitignore` **updated**
- [ ] **YOU NEED TO:** Regenerate Fish Audio API key
- [ ] **YOU NEED TO:** Update `.env` with new key

## Questions?

- How to check if `.env` is safe? Run: `git status` - if `.env` appears, it's NOT in `.gitignore`
- How to remove from staging? Run: `git reset .env`
- Need help with BFG? See: https://rtyley.github.io/bfg-repo-cleaner/

---

**Again: REGENERATE YOUR FISH AUDIO API KEY NOW!** 🚨

