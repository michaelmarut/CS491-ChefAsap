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

**Step 1:** Make SURE you are in the backend file directory. The following steps must be done in the backend file terminal to work

**Step 2:** Open up your Local Instance in MySQL Workbench

**Step 3:** On Backend folder, run: "python -m venv venv"

**Step 4:** On Backend folder, run: "pip install -r requirements.txt"

**Step 5:** On Backend folder, run python app.py"

## Launching the App on Mobile

If you want to view the app on mobile, download Expo Go in the app store. When you type in "npx expo start", a QR code will show up in the terminal. Scan that, and it will be displayed on your phone

## Quick Setup Refrence

Once you finished all the installation steps, here is a very basic rundown to launch the app

Launch MySQL Workbench Local instance

In frontend terminal, run "npx expo start"

In backend terminal, run "python app.py"

Thats it!


## need to fix before run.
in backend: config.js
the link need to change to the backend link
