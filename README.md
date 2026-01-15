# huglab

## Version
Initial test version 0.0

## About the Project
Currently, the app is a local testing space for **GGUF models**. It facilitates downloading GGUF models and provides an interface to use and test them, with parameter control, quick model switching, and parameter saving. The project is still in its initial version.

### Ideation
Currently at version 0.0 with minimal features. Below is a small list of planned future functionalities:

- **Improved response handling:** For .gguf models through provided sources (RAG).
- **Study Interface:** Focused on enhancing and facilitating studies with visual support.
- **Text-to-Audio:** Integrated audio descriptions for text.
- **Hugging Face Search:** Quick search for GGUF models to increase download possibilities.
- **Local Support:** Expanded support for more local model types.
- ***Feature ideas are welcome in this project!***

The goal is to simplify the use of local AI models by providing something straightforward and improved.

### Current Focus
Currently, I'm not focusing on feature functionality, but once the project stabilizes, I plan to optimize and make it lighter. Although the project is already quite lightweight, it has various overheads—some unnecessary, others intentional to allow future features.

---

## Download and Configuration

### 1. Requirements & Recommendations
* **Node.js Versions:**
    * Windows: Node **v22.12.0**
    * POSIX (Linux/macOS): Node **v22.21.0**
* **Cleanup:** Delete `package-lock.json` and `npm-shrinkwrap.json` if they exist.
* **Storage:** On Windows, it is recommended to keep the project **outside of OneDrive**.

### 2. Installation
```bash
# Clone the repository
git clone <repository-url>
cd huglab

# Install dependencies
npm install
```
> **Note:** Ensure package compatibility. If needed, update project dependencies manually. This process can be a bit tedious.

### 3. Backend Setup
Navigate to the `backend/fullpy` folder and set up your Python environment:
```bash
cd backend/fullpy

# Create a virtual environment (venv)
python -m venv venv

# Activate and install
# Linux/macOS: source venv/bin/activate | Windows: .\venv\Scripts\activate
pip install -r requirements.txt
pip install -e .
```

---

## 🏃 Running the App

### First Run (Environment Setup)
To configure the `llama.cpp` repository and compile the project binary, run:
```bash
node ./huglab.mjs
```
**Details:** This script downloads dependencies and initializes the app. You will likely see an error at the end of the first execution—**this is normal**. It serves to set up the binary environment.

### Final Execution
After the first run, you can start the project using:
```bash
node ./huglab.mjs
```
**OR** use two separate terminals for development:
* **Terminal 1:** `npm run dev`
* **Terminal 2:** `npm start`

---

## 📁 Project Structure

```text
huglab/
├── backend/
│   ├── config/            # Backend configurations  
│   ├── fullpy/            # Main Python code  
│   ├── rulers/            # Rules and validations  
│   └── second-window/     # Secondary window code  
├── frontend/
│   ├── components/        # React components  
│   ├── global/            # Global styles and configurations  
│   ├── hooks/             # Custom hooks  
│   ├── i18n/              # Internationalization  
│   ├── style/             # Styles  
│   ├── App.jsx            # Main component  
│   └── main.jsx           # Entry point  
├── ipc/                   # Inter-process communication  
├── public/                # Static files  
├── utils/                 # Shared utilities  
└── (other configuration files)
```

## 🗺️ ROADMAP
A place to mark tasks or pick tasks to solve.