# AI Library Assistance Agent 📖🤖

An intelligent, transparent, and user-friendly academic recommendation web application designed to help college students discover the most suitable textbooks based on their learning needs, academic goals, and current skill level.

---

## 1. Project Overview

The **AI Library Assistance Agent** is an AI-assisted recommendation prototype that automates the role of an expert university librarian. Instead of relying on opaque or external black-box API services, it implements an explainable, rule-based recommendation engine that evaluates books across multi-attribute criteria: **Subject Relevance**, **Difficulty Level**, and **Purpose of Learning**.

### Key Highlights:
- **Zero External Dependencies**: 100% client-side execution using HTML5, Vanilla CSS3, and JavaScript (ES6+).
- **Comprehensive Catalogue**: Contains 24 realistic academic textbooks covering Python, Cloud Computing, Artificial Intelligence, Cybersecurity, Database Management, and Software Engineering.
- **Explainable AI (XAI)**: Generates clear, human-readable explanations detailing *why* each book was recommended for the user's specific requirements.
- **Comparative Matrix**: Displays a side-by-side comparison table ranking all retrieved books with scores and suitability classifications.
- **One-Click Test Presets**: Includes interactive buttons to immediately test the required evaluation scenarios.

---

## 2. The Four Core Functionalities

The application architecture is structured around four primary pillars:

```
[Student Input] ──> [A. Information Retrieval] ──> [B. Filtering] ──> [C. Comparison & Scoring] ──> [D. Top-3 Recommendation]
```

### A. Information Retrieval
- **Subject Normalization & Tokenization**: Cleans and normalizes user input by stripping punctuation, standardizing casing, and tokenizing phrases.
- **Synonym & Keyword Expansion**: Recognizes abbreviations and synonyms (e.g., `"AI"` / `"ML"` $\rightarrow$ `Artificial Intelligence`, `"AWS"` / `"GCP"` $\rightarrow$ `Cloud Computing`, `"DBMS"` / `"SQL"` $\rightarrow$ `Database Management`, `"Py"` $\rightarrow$ `Python`).
- **Catalogue Matching**: Searches book subjects, titles, descriptions, and curated syllabus keywords to retrieve all relevant candidate textbooks.

### B. Filtering
- **Difficulty Calibration**: Filters and compares retrieved books against the student's selected difficulty (`Beginner`, `Intermediate`, or `Advanced`).
- **Learning Purpose Alignment**: Evaluates alignment with the student's primary objective (`Exam Preparation`, `Project Development`, `Interview Preparation`, or `Gaining Basic Knowledge`).
- **Intelligent Fallback Mechanism**: If no exact difficulty or subject match exists:
  - If difficulty differs, the system identifies the closest level (e.g., Intermediate for a Beginner seeking project guidance) and explicitly notes the background bridge required.
  - If a subject is not found in the catalogue (e.g., *Quantum Computing*), the system displays a clear message and suggests available computing subjects with 1-click retry.

### C. Comparison & Scoring
The engine assigns an objective **Relevance Score (0 to 100)** to every candidate book using a weighted multi-criteria formula:

$$\text{Total Score} = \text{Subject Score (max 50)} + \text{Difficulty Score (max 25)} + \text{Purpose Score (max 25)}$$

| Component | Max Points | Scoring Criteria |
| :--- | :---: | :--- |
| **Subject Relevance** | **50** | Exact / Canonical subject match = 50 pts<br>Partial / Tokenized subject match = 38–42 pts<br>Keyword / Description overlap = 20–35 pts |
| **Difficulty Alignment** | **25** | Exact difficulty tier = 25 pts<br>1-tier offset (e.g., Intermediate vs. Beginner) = 14 pts<br>2-tier offset (e.g., Advanced vs. Beginner) = 4 pts |
| **Learning Purpose Alignment**| **25** | Exact primary purpose match = 25 pts<br>Secondary purpose match = 18 pts<br>General domain reference = 6 pts |

#### Suitability Classification:
- **Optimal Fit (88–100%)**: Textbook directly aligns with subject, exact difficulty, and primary study goal.
- **Strong Fit (72–87%)**: Highly compatible textbook with strong secondary purpose or minor level offset.
- **Moderate Fit (50–71%)**: Solid reference with moderate syllabus coverage or wider difficulty bridge.
- **Partial Match (<50%)**: Peripheral reference requiring supplementary materials.

### D. Recommendation
- **Top 3 Curated Recommendations**: Selects the top 3 highest-scoring textbooks (or all available matches if fewer than 3 exist).
- **Dynamic Reasoning Generation**: Generates personalized, natural-language explanations for each book explaining:
  1. How the subject aligns with the query.
  2. Why the difficulty level is appropriate for the student's background.
  3. How specific features of the book (quizzes, architectural patterns, interview questions) serve the student's stated purpose.

---

## 3. Project File Structure

```
c:/PE_Lab/
│
├── index.html           # Main user interface and application structure
├── README.md            # Project documentation and evaluation guide
│
├── css/
│   └── style.css        # Responsive styling, modern academic theme, and layout
│
├── js/
│   ├── books.js         # Curated catalogue of 24 realistic academic textbooks
│   └── app.js           # Core retrieval, filtering, scoring, and UI logic
│
└── data/
    └── books.json       # JSON export of the complete book catalogue
```

---

## 4. Book Catalogue Summary

The catalogue contains 24 academic textbooks across 6 major domains:
1. **Python**: *Python Programming: An Introduction to Computer Science* (Zelle), *Python Crash Course* (Matthes), *Automate the Boring Stuff* (Sweigart), *Effective Python* (Slatkin), *Fluent Python* (Ramalho).
2. **Cloud Computing**: *Cloud Computing: Concepts, Technology & Architecture* (Erl), *Cloud Native Patterns* (Davis), *Architecting Google Cloud Solutions* (Kambhampaty), *AWS Certified Solutions Architect Study Guide* (Piper & Clinton), *Cloud Computing Explained* (Rhoton), *Enterprise Cloud Strategy* (Briggs & Kassner).
3. **Artificial Intelligence**: *Artificial Intelligence: A Modern Approach* (Russell & Norvig), *Deep Learning* (Goodfellow et al.), *Pattern Recognition and Machine Learning* (Bishop), *Hands-On Machine Learning* (Géron), *AI Crash Course* (de Ponteves).
4. **Cybersecurity**: *CompTIA Security+ All-in-One* (Conklin & White), *The Web Application Hacker's Handbook* (Stuttard & Pinto), *Practical Malware Analysis* (Sikorski & Honig).
5. **Database Management**: *Database System Concepts* (Silberschatz, Korth, Sudarshan), *Learning SQL* (Beaulieu), *Designing Data-Intensive Applications* (Kleppmann).
6. **Software Engineering & Web**: *Clean Code* (Martin), *Eloquent JavaScript* (Haverbeke).

---

## 5. Instructions to Run Locally

You can run this application immediately in any modern web browser without installing external software.

### Method 1: Direct File Opening (Simplest)
1. Navigate to the project folder `c:\PE_Lab`.
2. Double-click `index.html` or right-click $\rightarrow$ **Open with** $\rightarrow$ **Google Chrome / Microsoft Edge / Firefox**.
3. The application runs immediately with all catalogue data pre-loaded!

### Method 2: Using Python's Built-in HTTP Server
If you prefer running via a local web server:
1. Open PowerShell or Command Prompt in `c:\PE_Lab`:
   ```powershell
   cd c:\PE_Lab
   python -m http.server 8000
   ```
2. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

### Method 3: Using Node.js
```powershell
npx -y serve c:\PE_Lab
```

---

## 6. Verification and Test Scenarios

The application includes **One-Click Test Scenario Buttons** directly on top of the search form for instant evaluation:

| Test Case | Inputs | Expected Output |
| :--- | :--- | :--- |
| **Test Case 1** | **Subject:** Python<br>**Difficulty:** Beginner<br>**Purpose:** Exam Preparation | **#1 Pick:** *Python Programming: An Introduction to Computer Science* (John Zelle) — **100% Score**.<br>Identified as an exact fit with syllabus-aligned exercises and exam reviews.<br>**Follow-ups:** *Python Crash Course* (89%), *Automate the Boring Stuff* (81%). |
| **Test Case 2** | **Subject:** Cloud Computing<br>**Difficulty:** Intermediate<br>**Purpose:** Project Development | **#1 & #2 Picks:** *Cloud Native Patterns* (Cornelia Davis) & *Architecting Google Cloud Solutions* (Shankar Kambhampaty) — **100% Score**.<br>Highlighted for hands-on microservices and architecture deployments.<br>**#3 Pick:** *Cloud Computing: Concepts & Architecture* (Thomas Erl) — **93% Score**. |
| **Test Case 3** | **Subject:** Artificial Intelligence<br>**Difficulty:** Advanced<br>**Purpose:** Interview Preparation | **#1 & #2 Picks:** *Deep Learning* (Goodfellow et al.) & *Pattern Recognition and Machine Learning* (Bishop) — **100% Score**.<br>Highlighted for rigorous neural network math and statistical theory tested in tech interviews.<br>**#3 Pick:** *AI: A Modern Approach* (Russell & Norvig) — **93% Score**. |
| **Test Case 4** | **Subject:** Quantum Computing (Not in catalogue)<br>**Difficulty:** Beginner<br>**Purpose:** Exam Preparation | **Fallback State Triggered:** Displays polite alert explaining that no books currently match "Quantum Computing", and automatically presents 1-click alternative subjects (Artificial Intelligence, Cloud Computing, Cybersecurity, etc.). |

---

## 7. Compliance with Project Requirements
- **Simple, modern, responsive UI**: Styled with clean typography, card layouts, and responsive tables.
- **Transparent AI prototype**: Explains logic clearly without misrepresenting itself as an opaque large language model.
- **Reliable local operation**: No external paid APIs, keys, or cloud databases required.
