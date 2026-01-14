# huglab

## Version
Initial test version 0.0

## About the Project
Currently, the app is a local testing space for GGUF models. It facilitates downloading GGUF models and provides an interface to use and test them, with parameter control, quick model switching, and parameter saving. The project is still in its initial version.

### Ideation
Currently at version 0.0 with minimal features. Below is a small list of planned future functionalities:

- Improved response handling for .gguf models through provided sources  
- Interface focused on enhancing and facilitating studies with visual support  
- Text-to-audio description  
- Quick search for GGUF models on Hugging Face to increase download possibilities  
- Support for more local models  
- ***Feature ideas are welcome in this project!***

The goal is to simplify the use of local AI models by providing something straightforward and improved.

### Current Focus
Currently, I'm not focusing on feature functionality but once the project stabilizes, I plan to optimize and make it lighter. Although the project is already quite lightweight, it has various overheads—some unnecessary, others intentional to allow future features.

## Download and Configuration

1. Clone the repository

2. Install dependencies

### Recommendations:
- Delete the JSON files: `package-lock.json` and `npm-shrinkwrap.json` (if present)
- Windows: Node v22.12.0 | POSIX systems: Node v22.21.0
- On Windows, it is recommended to keep the project outside of OneDrive

### Install
    npm install

Note: Ensure package compatibility. If needed, update project dependencies. This process can be a bit tedious.

### First run:
- Linux:
    node ./huglab.mjs

Details: After running `node ./huglab.mjs`, you need to configure the llama.cpp repository and compile the project binary. You will likely see an error at the end—this is normal. This file serves two purposes: downloading some dependencies and running the app.

### Backend setup
In the `backend/fullpy` folder, run:

    pip install -r requirements.txt
    pip install -e .

Note: Create a virtual environment (venv) before running these commands.

### Final step, run:
    node ./huglab.mjs

OR

In one terminal:
    npm run dev

In another terminal:
    npm start

## Project Structure

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

## ROADMAP
A place to mark tasks or pick tasks to solve.
