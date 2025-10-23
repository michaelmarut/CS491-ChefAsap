# CS491-ChefAsap Installation Instructions:

On VSCode terminal, Copy/Paste this command: "git clone https://github.com/michaelmarut/CS491-ChefAsap.git"

## Downloads Required:

Download an app called "Expo Go" in order to view on mobile. 

Install [Python](https://www.python.org/downloads/) (You should have Python already but just in case...)

To verify installation, type "python --version" in VSCode terminal

Install [Node.js](https://nodejs.org/)

To verify installation, type "node -v" and then "npm -v" in VSCode terminal

Install [MySQL Workbench](https://www.mysql.com/products/workbench/)

If stuck, watch this [video](https://www.youtube.com/watch?v=u96rVINbAUI) for step by step installation for MySQL Workbench

IMPORTANT: Once installed, make sure your Local instance password is "your_password". Otherwise MySQL will NOT work with Flask backend


## FrontEnd:

**Step 1:** Make SURE you are in the frontend file directory. The following steps must be done in the frontend file terminal to work

**Step 2:** Run: "npm install"

**Step 3:** Run: "npx expo start -w" to view frontend on PC. 

(To view in mobile, look at "Launching the App" section)

## BackEnd:

**Database Options:** The backend supports both **Render Cloud PostgreSQL** (recommended for team collaboration) and **Local MySQL**.

### Option A: Render Cloud PostgreSQL (Recommended)

**Step 1:** Make SURE you are in the backend file directory

**Step 2:** Run: `python -m venv venv` (if not already created)

**Step 3:** Run: `pip install -r requirements.txt`

**Step 4:** Set environment variable:
- **Windows PowerShell**: `$env:DB_TYPE="postgresql"`
- **Windows CMD**: `set DB_TYPE=postgresql`
- **Mac/Linux**: `export DB_TYPE=postgresql`

**Step 5:** Run: `python app.py`

**OR simply double-click**: `start_cloud.bat` (Windows)

### Option B: Local MySQL

**Step 1:** Make SURE you are in the backend file directory

**Step 2:** Open up your Local Instance in MySQL Workbench

**Step 3:** Run: `python -m venv venv` (if not already created)

**Step 4:** Run: `pip install -r requirements.txt`

**Step 5:** Set environment variable (or leave default):
- **Windows PowerShell**: `$env:DB_TYPE="mysql"`
- **Or don't set it** (MySQL is default)

**Step 6:** Run: `python app.py`

**OR simply double-click**: `start_local.bat` (Windows)

**See `backend/README_SETUP.md` for detailed setup instructions.**

## Launching the App on Mobile

If you want to view the app on mobile, download Expo Go in the app store. When you type in "npx expo start", a QR code will show up in the terminal. Scan that, and it will be displayed on your phone

## Quick Setup Reference

Once you finished all the installation steps, here is a very basic rundown to launch the app:

### Using Render Cloud (Recommended):
1. In backend terminal: `set DB_TYPE=postgresql` (or double-click `start_cloud.bat`)
2. In backend terminal: `python app.py`
3. In frontend terminal: `npx expo start`

### Using Local MySQL:
1. Launch MySQL Workbench Local instance
2. In backend terminal: `python app.py` (or double-click `start_local.bat`)
3. In frontend terminal: `npx expo start`

That's it!

