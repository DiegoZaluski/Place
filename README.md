# 🧬 huglab (v0.0 - Alpha)

**huglab** is a local sandbox designed for testing and managing **GGUF models**. It offers a clean, straightforward interface to download, switch, and experiment with local AI models, giving you full control over parameters and model management.

---

## 🚀 About the Project
Currently in its early alpha stage, the project is focused on making local AI experimentation easier for everyone.

### ✨ The Vision (Future Goals)
While we are starting small, here is what’s on the horizon:
- [ ] **Smarter RAG:** Improved response handling using external source files.
- [ ] **Study-Focused UI:** An interface designed to support academic research with visual aids.
- [ ] **Audio Support:** Integrated text-to-audio descriptions.
- [ ] **HF Search:** Direct Hugging Face integration to find and download GGUF models faster.
- [ ] **Wider Support:** Compatibility with more local model formats.
- [ ] **Refinement:** Once the core is stable, I'll be stripping away the overhead to make the app even lighter.

> [!TIP]
> **Have a great idea?** Suggestions are always welcome! Feel free to contribute and help shape the project.

---

## 🛠️ Setup & Configuration

### 1. Requirements & Recommendations
* **Node.js Versions:**
    * **Windows:** v22.12.0
    * **POSIX (Linux/macOS):** v22.21.0
* **Housekeeping:** Delete `package-lock.json` and `npm-shrinkwrap.json` if they are already in your folder before starting.
* **Storage (Windows):** It is highly recommended to keep the project **outside of OneDrive** to avoid sync issues.

### 2. Main Installation
```bash
# Clone the repository
git clone <repository-url>
cd huglab

# Install dependencies
npm install
```
> **Note:** Dependency management can be a bit finicky. If you run into version conflicts, you might need to update specific packages manually.

### 3. Backend Setup
Head into the `backend/fullpy` folder and set up your Python environment:
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

## 📁 Project Structure

```text
huglab/
├── backend/
│   ├── config/            # Backend configurations  
│   ├── fullpy/            # Main Python logic  
│   ├── rulers/            # Validation rules and logic  
│   └── second-window/     # Secondary window management  
├── frontend/
│   ├── components/        # Reusable React components  
│   ├── global/            # Global styles and configurations  
│   ├── hooks/             # Custom React hooks  
│   ├── i18n/              # Internationalization and languages  
│   ├── style/             # CSS and styling  
│   ├── App.jsx            # Main application component  
│   └── main.jsx           # Entry point  
├── ipc/                   # Inter-process communication  
├── public/                # Static assets  
├── utils/                 # Shared helper functions  
└── (other configuration files)
```

---

## 🗺️ ROADMAP
A dedicated space to track progress, pick up open tasks, or plan new features.