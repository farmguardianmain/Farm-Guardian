# Firebase Standalone Data Writer

A simple, standalone command-line tool to write data directly into the Farm Guardians Firebase Firestore database. This tool does not require running the API backend or frontend servers.

## Package contents

Your zip/folder should contain these three files:
- `firebase_writer.py` (The script file)
- `service-account-key.json` (Your secret database access credentials)
- `requirements.txt` (List of Python dependencies)

---

## Quick Setup & Execution

### 1. Install Dependencies
Open a terminal in the folder where you unzipped these files and run:
```bash
pip install -r requirements.txt
```

### 2. Run the Script
Execute the script using Python:
```bash
python firebase_writer.py
```

---

## Usage Menu

Upon execution, choose from the interactive menu:
1. **Add a new Cattle profile** – Prompts you for the Tag ID, Name, Breed, and Weight, and logs it to Firestore.
2. **Log a Milk Yield Record** – Logs a milking session (yield in liters, session time) linked to a specific cattle.
3. **Run a Custom Insert** – Allows you to write raw custom JSON payloads directly to any Firestore collection.

---

## Troubleshooting

- **Error: `Service account credentials file not found`**
  Make sure your `service-account-key.json` file is in the exact same directory as `firebase_writer.py`.
- **Error: `ModuleNotFoundError`**
  Ensure you ran the setup command (`pip install -r requirements.txt`) to install the required `firebase-admin` library.
