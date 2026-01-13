## Version
Initial test version 0.0

## Download and Configuration

1. Clone the repository:
```bash
git clone https://github.com/DiegoZaluski/huglab
```

2. Install dependencies:
```bash
npm install
```
**Note:** Ensure that the packages are compatible. If necessary, update the project dependencies. This process can be a bit tedious.

3. First run:
   - **Linux:** `node ./huglab.mjs`
   - **Windows:** `node .\huglab.mjs`

**Details:** After running `node ./huglab.mjs`, you need to configure the llama.cpp repository and compile the project binary. You will probably see an error at the end - this is normal. This file has two purposes: downloading some dependencies and running the app.

4. In the `backend/fullpy` folder, run:
```bash
pip install -r requirements.txt
```
**Note:** Create a virtual environment (venv) before running this command.

5. Final step, run:
   - `node ./huglab.mjs` again, OR
   - In one terminal: `npm run dev`
   - In another terminal: `npm start`

## About the Project

This project is an app for testing Hugging Face models to quickly see the quality of models, test new parameters, etc. It will also focus on research and studying with models using rigorous data to reduce model errors in responses. In the future, it will have voice response functionality and video lesson creation, a personalized knowledge environment with adjustments made by the models based on your behavior and interests, and more. It is a creative project that still has space for many features. It is in an unstable and initial version - the project will improve a lot over time! Open project for contributions, improvements, and feature ideas.

## Project Map
```
huglab/
├── backend/
│   ├── config/            # Backend configurations
│   ├── fullpy/            # Main Python code
│   ├── rulers/            # Rules and validations
│   └── second-window/     # Secondary window code
│
├── frontend/
│   ├── components/        # React components
│   ├── global/            # Global styles and configurations
│   ├── hooks/             # Custom hooks
│   ├── i18n/              # Internationalization
│   ├── style/             # Styles
│   ├── App.jsx            # Main component
│   └── main.jsx           # Entry point
│
├── ipc/                   # Inter-process communication
├── public/                # Static files
├── utils/                 # Shared utilities
└── (other configuration files)
```

## ROADMAP

Place where you can mark tasks or pick tasks to solve.
