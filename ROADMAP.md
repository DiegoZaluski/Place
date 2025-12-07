# Project Roadmap & Task Guide

## How to Use This Roadmap
1.  **Available Tasks**: Tasks without an emoji (like `- Task description`) are **available to be picked up**.
2.  **Claim a Task**: To claim a task, add the construction emoji (`🚧`) to the **end** of its line. Example: `- Task description 🚧`
3.  **Complete a Task**: When a task is finished, replace `🚧` with the checkmark emoji (`✅`).
4.  **Priority Legend**:
    - **P1**: High priority (Critical for launch/core functionality)
    - **P2**: Medium priority (Important for user experience)
    - **P3**: Low priority (Future improvements/features)

---

## Phase 0: Pre-Launch Beta
*All tasks in this phase must be completed for the beta version launch.*

### Critical Tasks (P1)
- Implement reasoning loop for the model - (langGraph)
- Add reasoning system to agent's switch/ifs logic
- Create model toggle button (local/cloud) - only appears if cloud model is registered - 🚧
- Implement vector memory (vector store) for fast access
- Create memory collection and compression tool for vector store
- Review quality and token compression (save tokens on pro models)
- Add maximum downloadable models and reinforce download fallback
- Create initial application loading screen
- Implement model loading wait to prevent chat errors
- Dockerize application and prepare for distribution
- Create simple download page

### Documentation Tasks (P2)
- Create project documentation
- Create JSON translation files (2 languages initially)

---

## Phase 1: Standardization and Organization

### Code Standardization (P2)
- Organize React component colors as root CSS
- Organize component classNames in columns for better readability

### File Organization (P2)
- Organize files into "shared" folder
- Debug and test server fallbacks

---

## Phase 2: Search System

### Search Improvements (P2)
- Don't send search context when returning to normal mode (avoid overload)
- Organize search reception on front-end
- Summarize site searches efficiently without overloading the model
- Change internet search system to something simple using fetch without dependencies

### Search Interface (P2)
- Create search box on left sidebar
- Show website name in searches (one at a time)
- Integrate with search summarizer (run in separate thread)

---

## Phase 3: Future Features

### Complex Features (P3)
- Create API for companies to deploy app to cloud (paid feature)
- Use libraries/frameworks to read comments and transform into documentation
- Add JSON integration for n8n

### Advanced Features (Future)
- Screenshot capture with model response based on print (P1)
- Model customization system with up to 5 LoRa (P2)
- Voice communication with model (P3)
- Person identification based on facial recognition and preference mapping (P2 - paid model)
- Social_bots package with social media integration (P3)

---

## Phase 4: Simple Tasks

### Interface Improvements (P2)
- Add anchor to redirect from GitHub counter to repository
- Add logging of changes to model search class

---

## Phase 5: Bug Fixes

### Critical Bugs (P1)
- Magnifying glass appearing when model is responding
- Reset state when leaving chat to prevent bugs
- Add global state for search button
- Poorly filtered search (cutting words, regex issues)
- Remove useless fallbacks on servers
- Implement stop search command in backend

---

## Model Reasoning - Proposed Flow

1. Break search text into smaller parts that fit in context window
2. Call model to summarize each part and store in buffer
3. Send summarized search from buffer to model for refinement
4. Display sources in UI

*Slow process, but with good quality*

---

## Project Status
- **Current Version**: Pre-beta
- **Next Phase**: Beta Launch
- **Beta Criteria**: Complete all Phase 0 (P1) tasks