# Creating a GitHub Repository

## Quick Steps

### 1. Create Repo on GitHub
- Go to https://github.com
- Click **+** → **New repository**
- Name: `budget-ai` (or your choice)
- Choose Public or Private
- **Don't** check "Initialize with README"
- Click **Create repository**

### 2. Push Your Code

Run these commands in your project folder:

```bash
# Initialize git (if not done)
git init

# Add all files
git add .

# First commit
git commit -m "Initial commit - Budget AI app"

# Connect to GitHub (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/budget-ai.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 3. Done!

Your code is now on GitHub at:
`https://github.com/YOUR_USERNAME/budget-ai`

## What Gets Uploaded

The `.gitignore` file ensures these DON'T get uploaded:
- `node_modules/` (too large)
- `backend/budget.db` (your data)
- `.env` files (API keys)
- Python cache files

Everything else (code, README, configs) will be uploaded.

## Future Updates

To update your repo after making changes:

```bash
git add .
git commit -m "Description of changes"
git push
```
