# Backend Setup Guide

## Database Configuration

This project supports both **MySQL (local)** and **PostgreSQL (Render Cloud)**.

### Option 1: Use Render Cloud PostgreSQL (Recommended for Team)

#### Step 1: Set Environment Variable

**Windows (PowerShell):**
```powershell
$env:DB_TYPE="postgresql"
```

**Windows (Permanent):**
```cmd
setx DB_TYPE "postgresql"
```
Then restart your terminal/VS Code.

**Mac/Linux:**
```bash
export DB_TYPE=postgresql
```

**Mac/Linux (Permanent):**
Add to `~/.bashrc` or `~/.zshrc`:
```bash
export DB_TYPE=postgresql
```

#### Step 2: Install Dependencies

```bash
pip install -r requirements.txt
```

Make sure `psycopg2-binary` is installed:
```bash
pip install psycopg2-binary
```

#### Step 3: Database Credentials

The Render Cloud PostgreSQL credentials are already configured in `database/config_postgres.py`:
- Host: `dpg-d3s29ihr0fns73e69pp0-a.oregon-postgres.render.com`
- Database: `chefasap`
- User: `chefasap_user`
- Password: '5YVNDyhzIl93LOvG7RyPfaAVx46LdFW2'

**⚠️ Security Note:** For production, these should be in environment variables, not hardcoded.

#### Step 4: Start Backend

```bash
cd backend
python app.py
```

The backend will connect to Render Cloud automatically.

---

### Option 2: Use Local MySQL (For Local Development Only)

#### Step 1: Set Environment Variable

**Windows:**
```powershell
$env:DB_TYPE="mysql"
```

Or don't set it (default is MySQL).

#### Step 2: Install MySQL

Make sure you have MySQL installed locally.

#### Step 3: Update Config

Edit `backend/database/config.py` with your local MySQL credentials:
```python
mysql_config = {
    'host': 'localhost',
    'user': 'root',
    'password': 'your_password',  # Change this
    'database': 'chefasap'
}
```

#### Step 4: Create Database

```bash
python database/setup.py
```

#### Step 5: Start Backend

```bash
cd backend
python app.py
```

---

## Verifying Your Connection

Run this to check which database you're connected to:

```bash
cd backend
python test_config.py
```

Output example (Render Cloud):
```
DB_TYPE: postgresql
Host: dpg-d3s29ihr0fns73e69pp0-a.oregon-postgres.render.com
Database: chefasap
User: chefasap_user
```

Output example (Local MySQL):
```
DB_TYPE: mysql
Host: localhost
Database: chefasap
User: root
```

---

## Troubleshooting

### "ModuleNotFoundError: No module named 'psycopg2'"

Install PostgreSQL driver:
```bash
pip install psycopg2-binary
```

### "Can't connect to Render"

1. Check your internet connection
2. Verify the Render database is active in the dashboard
3. Make sure `DB_TYPE=postgresql` is set

### "Table doesn't exist"

The Render Cloud database already has 39 tables created. If you need to recreate:
```bash
cd backend/database
set DB_MODE=render  # or export DB_MODE=render on Mac/Linux
python setup_postgres.py
```

---

## Team Collaboration

### Recommended Setup:
- **Use Render Cloud PostgreSQL** for shared development
- Everyone uses the same cloud database
- No need to sync local databases
- All team members see the same data

### Setting up on a new machine:
1. Clone the repo
2. `pip install -r requirements.txt`
3. Set `DB_TYPE=postgresql` (see above)
4. Run `python app.py`
5. Done! ✅

---

## Environment Variables Summary

| Variable | Values | Purpose |
|----------|--------|---------|
| `DB_TYPE` | `mysql` or `postgresql` | Choose database type |
| `DB_MODE` | `local` or `render` | (Only for PostgreSQL setup scripts) |

**For normal backend operation, you only need `DB_TYPE`.**
