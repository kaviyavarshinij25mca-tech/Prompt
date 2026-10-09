/**
 * AI Library Assistance Agent - Core Logic & UI Controller
 * Implements the 4 Core Functionalities:
 * 1. Information Retrieval
 * 2. Filtering
 * 3. Comparison & Scoring
 * 4. Recommendation Generation
 */

(function () {
  "use strict";

  // Cache DOM Elements
  const form = document.getElementById("recommendation-form");
  const subjectInput = document.getElementById("subject-input");
  const difficultySelect = document.getElementById("difficulty-select");
  const purposeSelect = document.getElementById("purpose-select");
  const btnReset = document.getElementById("btn-reset");
  const btnSubmit = document.getElementById("btn-submit");

  const resultsSection = document.getElementById("results-section");
  const resultsSummary = document.getElementById("results-summary");
  const recommendationsContainer = document.getElementById("recommendations-container");
  const comparisonTableBody = document.getElementById("comparison-table-body");
  const comparisonSection = document.getElementById("comparison-section");
  const emptyStateSection = document.getElementById("empty-state-section");
  const emptyStateSubject = document.getElementById("empty-state-subject");
  const suggestedSubjectsContainer = document.getElementById("suggested-subjects");

  const fullCatalogueSection = document.getElementById("full-catalogue-section");
  const fullCatalogueGrid = document.getElementById("full-catalogue-grid");
  const btnToggleCatalogue = document.getElementById("btn-toggle-catalogue");
  const catalogueSearchInput = document.getElementById("catalogue-search-input");
  const catalogueFilterSubject = document.getElementById("catalogue-filter-subject");

  // Subject Synonym & Keyword Mapping Dictionary
  const SUBJECT_SYNONYMS = {
    "python": "Python",
    "py": "Python",
    "python3": "Python",
    "python programming": "Python",

    "cloud": "Cloud Computing",
    "cloud computing": "Cloud Computing",
    "aws": "Cloud Computing",
    "azure": "Cloud Computing",
    "gcp": "Cloud Computing",
    "google cloud": "Cloud Computing",
    "cloud native": "Cloud Computing",

    "ai": "Artificial Intelligence",
    "artificial intelligence": "Artificial Intelligence",
    "artificial intellect": "Artificial Intelligence",
    "machine learning": "Artificial Intelligence",
    "ml": "Artificial Intelligence",
    "deep learning": "Artificial Intelligence",
    "neural networks": "Artificial Intelligence",

    "cyber": "Cybersecurity",
    "cyber security": "Cybersecurity",
    "cybersecurity": "Cybersecurity",
    "infosec": "Cybersecurity",
    "information security": "Cybersecurity",
    "security": "Cybersecurity",
    "ethical hacking": "Cybersecurity",
    "penetration testing": "Cybersecurity",

    "database": "Database Management",
    "databases": "Database Management",
    "database management": "Database Management",
    "dbms": "Database Management",
    "db": "Database Management",
    "sql": "Database Management",
    "relational database": "Database Management",

    "software engineering": "Software Engineering",
    "se": "Software Engineering",
    "clean code": "Software Engineering",
    "system design": "Software Engineering",

    "web": "Web Development",
    "web development": "Web Development",
    "web dev": "Web Development",
    "javascript": "Web Development",
    "frontend": "Web Development"
  };

  const DIFFICULTY_LEVELS = ["Beginner", "Intermediate", "Advanced"];

  // =========================================================================
  // PILLAR A: INFORMATION RETRIEVAL
  // =========================================================================

  /**
   * Normalizes a text string (lowercase, trims, strips punctuation).
   */
  function normalizeString(str) {
    if (!str) return "";
    return str.toLowerCase().trim().replace(/[^\w\s]/gi, " ").replace(/\s+/g, " ");
  }

  /**
   * Resolves a user entered query to a canonical subject if possible.
   */
  function resolveCanonicalSubject(rawInput) {
    const cleaned = normalizeString(rawInput);
    if (SUBJECT_SYNONYMS[cleaned]) {
      return SUBJECT_SYNONYMS[cleaned];
    }

    // Check partial key matches
    for (const [key, canonical] of Object.entries(SUBJECT_SYNONYMS)) {
      if (cleaned.includes(key) || key.includes(cleaned)) {
        return canonical;
      }
    }
    return null;
  }

  /**
   * Computes string similarity (Levenshtein based) for fuzzy fallback suggestions.
   */
  function stringSimilarity(s1, s2) {
    const longer = s1.length < s2.length ? s2 : s1;
    const shorter = s1.length < s2.length ? s1 : s2;
    if (longer.length === 0) return 1.0;
    
    // Levenshtein edit distance
    const costs = [];
    for (let i = 0; i <= longer.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= shorter.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (longer.charAt(i - 1) !== shorter.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[shorter.length] = lastValue;
    }
    return (longer.length - costs[shorter.length]) / parseFloat(longer.length);
  }

  const GENERIC_MODIFIERS = new Set([
    "computing", "science", "engineering", "management", "development", 
    "technology", "technologies", "studies", "programming", "course", 
    "concepts", "systems", "system"
  ]);

  /**
   * Pillar A: Retrieve candidate books matching the query
   */
  function retrieveBooks(catalogue, rawQuery) {
    const query = normalizeString(rawQuery);
    const canonical = resolveCanonicalSubject(rawQuery);
    const queryTokens = query.split(" ").filter(t => t.length > 1);
    const distinctiveTokens = queryTokens.filter(t => !GENERIC_MODIFIERS.has(t));

    const retrieved = [];

    // If there is an exact canonical subject match
    if (canonical) {
      catalogue.forEach(book => {
        if (book.subject.toLowerCase() === canonical.toLowerCase()) {
          retrieved.push({
            book: book,
            subjectRelevanceScore: 50,
            isExactSubjectMatch: true
          });
        }
      });
      return {
        query: rawQuery,
        canonicalSubject: canonical,
        candidates: retrieved
      };
    }

    // Otherwise, check for matching subjects or distinctive token hits
    catalogue.forEach(book => {
      let subjectScore = 0;
      const bookSubjectNorm = normalizeString(book.subject);
      const bookTitleNorm = normalizeString(book.title);
      const bookDescNorm = normalizeString(book.description);
      const bookKeywordsNorm = book.keywords.map(k => normalizeString(k));

      if (bookSubjectNorm === query) {
        subjectScore = 50;
      } else if (bookSubjectNorm.includes(query) || query.includes(bookSubjectNorm)) {
        subjectScore = 45;
      } else if (distinctiveTokens.length > 0) {
        // Must match at least one distinctive query token in subject, keywords, or title
        const hasDistinctiveMatch = distinctiveTokens.some(dt => 
          bookSubjectNorm.includes(dt) ||
          bookKeywordsNorm.some(k => k.includes(dt)) ||
          bookTitleNorm.includes(dt)
        );

        if (hasDistinctiveMatch) {
          let tokenHits = 0;
          let keywordHits = 0;

          queryTokens.forEach(token => {
            if (bookSubjectNorm.includes(token)) tokenHits += 2;
            if (bookTitleNorm.includes(token)) tokenHits += 1.5;
            if (bookKeywordsNorm.some(k => k.includes(token))) keywordHits += 2;
            if (bookDescNorm.includes(token)) tokenHits += 0.5;
          });

          subjectScore = Math.min(42, Math.round((tokenHits + keywordHits) * 7));
        }
      }

      if (subjectScore > 0) {
        retrieved.push({
          book: book,
          subjectRelevanceScore: subjectScore,
          isExactSubjectMatch: false
        });
      }
    });

    return {
      query: rawQuery,
      canonicalSubject: canonical,
      candidates: retrieved
    };
  }

  // =========================================================================
  // PILLAR B & C: FILTERING & COMPARISON (SCORING)
  // =========================================================================

  /**
   * Pillar B & C: Evaluates and compares books against difficulty & purpose.
   * Total Score (0 - 100):
   * - Subject Relevance: Up to 50 pts
   * - Difficulty Alignment: Up to 25 pts
   * - Learning Purpose Alignment: Up to 25 pts
   */
  function compareAndScoreBooks(retrievalResult, targetDifficulty, targetPurpose) {
    const scoredBooks = retrievalResult.candidates.map(item => {
      const book = item.book;
      const subjectScore = item.subjectRelevanceScore; // max 50

      // Difficulty Scoring (max 25)
      let difficultyScore = 0;
      let difficultyExplanation = "";
      const bookDiffIdx = DIFFICULTY_LEVELS.indexOf(book.difficulty);
      const targetDiffIdx = DIFFICULTY_LEVELS.indexOf(targetDifficulty);
      const diffDistance = Math.abs(bookDiffIdx - targetDiffIdx);

      if (diffDistance === 0) {
        difficultyScore = 25;
        difficultyExplanation = `Exact ${targetDifficulty} level match. Ideal pace and depth for your current background.`;
      } else if (diffDistance === 1) {
        difficultyScore = 14;
        if (bookDiffIdx > targetDiffIdx) {
          difficultyExplanation = `Slightly more advanced (${book.difficulty}), offering a structured challenge with room for growth.`;
        } else {
          difficultyExplanation = `Slightly foundational (${book.difficulty}), excellent for reinforcing fundamentals without feeling overwhelmed.`;
        }
      } else {
        difficultyScore = 4;
        difficultyExplanation = `Significant level difference (${book.difficulty} vs requested ${targetDifficulty}). Requires extra background effort.`;
      }

      // Purpose Scoring (max 25)
      let purposeScore = 0;
      let purposeExplanation = "";
      const targetPurposeNorm = normalizeString(targetPurpose);
      const bookPrimaryPurposeNorm = normalizeString(book.learningPurpose);
      const secondaryNorms = (book.secondaryPurposes || []).map(p => normalizeString(p));

      if (bookPrimaryPurposeNorm === targetPurposeNorm) {
        purposeScore = 25;
        purposeExplanation = `Specifically authored for ${targetPurpose}. Directly matches your primary learning objective.`;
      } else if (secondaryNorms.includes(targetPurposeNorm)) {
        purposeScore = 18;
        purposeExplanation = `Primary focus is ${book.learningPurpose}, but provides comprehensive support for ${targetPurpose}.`;
      } else {
        purposeScore = 6;
        purposeExplanation = `Focuses primarily on ${book.learningPurpose}, though core domain concepts still provide useful reference.`;
      }

      const totalScore = Math.min(100, Math.round(subjectScore + difficultyScore + purposeScore));

      // Suitability Category
      let suitabilityBadge = "";
      let suitabilityClass = "";
      if (totalScore >= 88) {
        suitabilityBadge = "Optimal Fit";
        suitabilityClass = "badge-optimal";
      } else if (totalScore >= 72) {
        suitabilityBadge = "Strong Fit";
        suitabilityClass = "badge-strong";
      } else if (totalScore >= 50) {
        suitabilityBadge = "Moderate Fit";
        suitabilityClass = "badge-moderate";
      } else {
        suitabilityBadge = "Partial Match";
        suitabilityClass = "badge-partial";
      }

      return {
        book,
        subjectScore,
        difficultyScore,
        purposeScore,
        totalScore,
        difficultyExplanation,
        purposeExplanation,
        suitabilityBadge,
        suitabilityClass,
        diffDistance
      };
    });

    // Sort descending by totalScore, then secondary by difficultyScore, then by book rating
    scoredBooks.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      if (b.difficultyScore !== a.difficultyScore) return b.difficultyScore - a.difficultyScore;
      return b.book.rating - a.book.rating;
    });

    return scoredBooks;
  }

  // =========================================================================
  // PILLAR D: RECOMMENDATION GENERATION
  // =========================================================================

  /**
   * Synthesizes natural, human-readable recommendation reasons based on rule evaluation.
   */
  function generateRecommendationReason(scoredItem, targetSubject, targetDifficulty, targetPurpose, rank) {
    const book = scoredItem.book;
    const isExactDiff = scoredItem.diffDistance === 0;
    const isPrimaryPurpose = normalizeString(book.learningPurpose) === normalizeString(targetPurpose);
    const isSecondaryPurpose = (book.secondaryPurposes || []).map(p => normalizeString(p)).includes(normalizeString(targetPurpose));

    const parts = [];

    if (rank === 1) {
      parts.push(`Top Recommendation (#1) with a ${scoredItem.totalScore}% relevance score.`);
    } else if (rank === 2) {
      parts.push(`Ranked #2 Alternative (${scoredItem.totalScore}% match).`);
    } else {
      parts.push(`Ranked #3 Supplementary Choice (${scoredItem.totalScore}% match).`);
    }

    // Subject rationale
    if (scoredItem.subjectScore >= 45) {
      parts.push(`Provides authoritative, direct coverage of ${book.subject}.`);
    } else {
      parts.push(`Covers key core principles and overlapping applications related to ${targetSubject}.`);
    }

    // Difficulty rationale
    if (isExactDiff) {
      parts.push(`Calibrated exactly for ${targetDifficulty} level students, ensuring smooth comprehension without cognitive overload.`);
    } else if (scoredItem.diffDistance === 1) {
      if (DIFFICULTY_LEVELS.indexOf(book.difficulty) > DIFFICULTY_LEVELS.indexOf(targetDifficulty)) {
        parts.push(`Presents an intermediate/advanced bridge with practical case studies to accelerate your learning curve.`);
      } else {
        parts.push(`Provides solid foundational grounding to ensure zero prerequisite gaps.`);
      }
    }

    // Purpose rationale
    if (isPrimaryPurpose) {
      parts.push(`Explicitly tailored for ${targetPurpose}, featuring curriculum alignment, actionable frameworks, and targeted practice problems.`);
    } else if (isSecondaryPurpose) {
      parts.push(`While primarily structured for ${book.learningPurpose}, it includes dedicated modules directly addressing ${targetPurpose}.`);
    } else {
      parts.push(`Serves as an essential conceptual reference book while pursuing ${targetPurpose}.`);
    }

    return parts.join(" ");
  }

  /**
   * Fallback suggestions when no matching books are found.
   */
  function findSuggestedSubjects(rawQuery, catalogue) {
    const availableSubjects = Array.from(new Set(catalogue.map(b => b.subject)));
    const queryNorm = normalizeString(rawQuery);

    const scoredSubjects = availableSubjects.map(sub => {
      const subNorm = normalizeString(sub);
      const similarity = stringSimilarity(queryNorm, subNorm);
      return { subject: sub, score: similarity };
    });

    scoredSubjects.sort((a, b) => b.score - a.score);
    // Return top 4 distinct subjects
    return scoredSubjects.slice(0, 4).map(s => s.subject);
  }

  // =========================================================================
  // UI RENDERING
  // =========================================================================

  function renderRecommendations(scoredBooks, queryInfo, targetDifficulty, targetPurpose) {
    recommendationsContainer.innerHTML = "";
    comparisonTableBody.innerHTML = "";

    const topRecommendations = scoredBooks.slice(0, 3);

    // Summary Card
    const exactMatchesCount = scoredBooks.filter(s => s.totalScore >= 70).length;
    resultsSummary.innerHTML = `
      <div class="summary-chip">
        <span class="chip-label">Subject Analyzed:</span>
        <span class="chip-value">${queryInfo.canonicalSubject || escapeHtml(queryInfo.query)}</span>
      </div>
      <div class="summary-chip">
        <span class="chip-label">Target Level:</span>
        <span class="chip-value">${escapeHtml(targetDifficulty)}</span>
      </div>
      <div class="summary-chip">
        <span class="chip-label">Objective:</span>
        <span class="chip-value">${escapeHtml(targetPurpose)}</span>
      </div>
      <div class="summary-chip">
        <span class="chip-label">Catalogue Matches:</span>
        <span class="chip-value highlight">${scoredBooks.length} Books Retrieved</span>
      </div>
    `;

    // Render Top Cards
    topRecommendations.forEach((item, index) => {
      const rank = index + 1;
      const book = item.book;
      const reason = generateRecommendationReason(item, queryInfo.query, targetDifficulty, targetPurpose, rank);

      const card = document.createElement("article");
      card.className = `recommendation-card rank-${rank}`;
      card.setAttribute("data-book-id", book.id);

      const rankBadgeLabel = rank === 1 ? "★ Top AI Pick (#1)" : (rank === 2 ? "✓ Strong Match (#2)" : "✦ Recommended (#3)");
      const rankClass = rank === 1 ? "rank-badge-first" : (rank === 2 ? "rank-badge-second" : "rank-badge-third");

      card.innerHTML = `
        <div class="card-header">
          <div class="card-badges">
            <span class="badge ${rankClass}">${rankBadgeLabel}</span>
            <span class="badge ${item.suitabilityClass}">${item.suitabilityBadge}</span>
          </div>
          <div class="score-pill" title="Relevance Score: ${item.totalScore}/100">
            <span class="score-number">${item.totalScore}</span>
            <span class="score-unit">/100</span>
          </div>
        </div>

        <div class="card-body">
          <h3 class="book-title">${escapeHtml(book.title)}</h3>
          <p class="book-author">by <span class="author-name">${escapeHtml(book.author)}</span></p>

          <div class="book-meta-grid">
            <div class="meta-item">
              <span class="meta-icon">📚</span>
              <div>
                <span class="meta-label">Subject</span>
                <span class="meta-val">${escapeHtml(book.subject)}</span>
              </div>
            </div>
            <div class="meta-item">
              <span class="meta-icon">📊</span>
              <div>
                <span class="meta-label">Difficulty</span>
                <span class="meta-val badge-difficulty ${book.difficulty.toLowerCase()}">${escapeHtml(book.difficulty)}</span>
              </div>
            </div>
            <div class="meta-item">
              <span class="meta-icon">🎯</span>
              <div>
                <span class="meta-label">Primary Focus</span>
                <span class="meta-val">${escapeHtml(book.learningPurpose)}</span>
              </div>
            </div>
            <div class="meta-item">
              <span class="meta-icon">⭐</span>
              <div>
                <span class="meta-label">Rating & Size</span>
                <span class="meta-val">${book.rating} ★ • ${book.pages} pp</span>
              </div>
            </div>
          </div>

          <p class="book-description">${escapeHtml(book.description)}</p>

          <div class="recommendation-reason-box">
            <div class="reason-header">
              <span class="ai-spark-icon">🤖</span>
              <strong>Why This Book Matches Your Request:</strong>
            </div>
            <p class="reason-text">${escapeHtml(reason)}</p>
          </div>

          <div class="score-breakdown-bar" title="Subject: ${item.subjectScore}/50 | Difficulty: ${item.difficultyScore}/25 | Purpose: ${item.purposeScore}/25">
            <div class="bar-segment seg-subject" style="width: ${item.subjectScore}%;"></div>
            <div class="bar-segment seg-difficulty" style="width: ${item.difficultyScore * 2}%;"></div>
            <div class="bar-segment seg-purpose" style="width: ${item.purposeScore * 2}%;"></div>
          </div>
          <div class="score-breakdown-legend">
            <span><span class="legend-dot dot-subject"></span> Subject (${item.subjectScore}/50)</span>
            <span><span class="legend-dot dot-difficulty"></span> Difficulty (${item.difficultyScore}/25)</span>
            <span><span class="legend-dot dot-purpose"></span> Purpose (${item.purposeScore}/25)</span>
          </div>
        </div>

        <div class="card-footer">
          <span class="book-isbn">ISBN: ${escapeHtml(book.isbn)}</span>
          <span class="book-year">Pub. Year: ${book.year}</span>
        </div>
      `;

      recommendationsContainer.appendChild(card);
    });

    // Render Comparison Table (all matching candidate books)
    scoredBooks.forEach((item, index) => {
      const book = item.book;
      const tr = document.createElement("tr");
      tr.className = index < 3 ? "highlighted-row" : "";

      tr.innerHTML = `
        <td class="col-rank"><strong>#${index + 1}</strong></td>
        <td class="col-title">
          <div class="table-book-title">${escapeHtml(book.title)}</div>
          <div class="table-book-author">${escapeHtml(book.author)}</div>
        </td>
        <td class="col-subject"><span class="badge-sub">${escapeHtml(book.subject)}</span></td>
        <td class="col-diff">
          <span class="badge-difficulty ${book.difficulty.toLowerCase()}">${escapeHtml(book.difficulty)}</span>
        </td>
        <td class="col-purpose">${escapeHtml(book.learningPurpose)}</td>
        <td class="col-score">
          <div class="table-score-wrapper">
            <div class="table-score-number">${item.totalScore}%</div>
            <div class="table-score-bar">
              <div class="table-score-fill" style="width: ${item.totalScore}%;"></div>
            </div>
          </div>
        </td>
        <td class="col-suitability">
          <span class="badge ${item.suitabilityClass}">${item.suitabilityBadge}</span>
        </td>
        <td class="col-rationale">
          <span class="table-short-reason">${item.difficultyExplanation}</span>
        </td>
      `;

      comparisonTableBody.appendChild(tr);
    });

    // Smooth show
    emptyStateSection.classList.add("hidden");
    resultsSection.classList.remove("hidden");
    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderEmptyState(rawSubject, catalogue) {
    resultsSection.classList.add("hidden");
    emptyStateSection.classList.remove("hidden");
    emptyStateSubject.textContent = rawSubject || "your requested subject";

    const suggested = findSuggestedSubjects(rawSubject, catalogue);
    suggestedSubjectsContainer.innerHTML = "";

    suggested.forEach(sub => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "suggested-subject-btn";
      btn.textContent = sub;
      btn.addEventListener("click", () => {
        subjectInput.value = sub;
        handleSearch();
      });
      suggestedSubjectsContainer.appendChild(btn);
    });

    emptyStateSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // =========================================================================
  // WORKFLOW HANDLER
  // =========================================================================

  function handleSearch() {
    const rawSubject = subjectInput.value.trim();
    const difficulty = difficultySelect.value;
    const purpose = purposeSelect.value;

    if (!rawSubject) {
      alert("Please enter a subject (e.g., Python, Cloud Computing, Artificial Intelligence).");
      subjectInput.focus();
      return;
    }

    const catalogue = window.BOOK_CATALOGUE || [];

    // Step A: Information Retrieval
    const retrievalResult = retrieveBooks(catalogue, rawSubject);

    if (retrievalResult.candidates.length === 0) {
      renderEmptyState(rawSubject, catalogue);
      return;
    }

    // Step B & C: Filtering, Comparison, and Scoring
    const scoredBooks = compareAndScoreBooks(retrievalResult, difficulty, purpose);

    if (scoredBooks.length === 0) {
      renderEmptyState(rawSubject, catalogue);
      return;
    }

    // Step D: Recommendation Rendering
    renderRecommendations(scoredBooks, retrievalResult, difficulty, purpose);
  }

  function handleReset() {
    form.reset();
    resultsSection.classList.add("hidden");
    emptyStateSection.classList.add("hidden");
    subjectInput.focus();
  }

  // =========================================================================
  // FULL CATALOGUE BROWSER
  // =========================================================================

  function renderFullCatalogue() {
    const catalogue = window.BOOK_CATALOGUE || [];
    const filterSubject = catalogueFilterSubject.value;
    const searchFilter = normalizeString(catalogueSearchInput.value);

    fullCatalogueGrid.innerHTML = "";

    const filtered = catalogue.filter(book => {
      if (filterSubject && book.subject !== filterSubject) return false;
      if (searchFilter) {
        const titleNorm = normalizeString(book.title);
        const authorNorm = normalizeString(book.author);
        const subjectNorm = normalizeString(book.subject);
        const keywordsNorm = book.keywords.join(" ");
        if (!titleNorm.includes(searchFilter) &&
            !authorNorm.includes(searchFilter) &&
            !subjectNorm.includes(searchFilter) &&
            !keywordsNorm.includes(searchFilter)) {
          return false;
        }
      }
      return true;
    });

    const countElem = document.getElementById("catalogue-count");
    if (countElem) {
      countElem.textContent = `Showing ${filtered.length} of ${catalogue.length} books`;
    }

    filtered.forEach(book => {
      const card = document.createElement("div");
      card.className = "catalogue-item-card";
      card.innerHTML = `
        <div class="cat-card-header">
          <span class="badge-sub">${escapeHtml(book.subject)}</span>
          <span class="badge-difficulty ${book.difficulty.toLowerCase()}">${escapeHtml(book.difficulty)}</span>
        </div>
        <h4 class="cat-card-title">${escapeHtml(book.title)}</h4>
        <p class="cat-card-author">by ${escapeHtml(book.author)}</p>
        <p class="cat-card-desc">${escapeHtml(book.description)}</p>
        <div class="cat-card-footer">
          <span class="cat-card-purpose">🎯 ${escapeHtml(book.learningPurpose)}</span>
          <span class="cat-card-rating">⭐ ${book.rating}</span>
        </div>
      `;
      fullCatalogueGrid.appendChild(card);
    });
  }

  function populateSubjectDropdowns() {
    const catalogue = window.BOOK_CATALOGUE || [];
    const subjects = Array.from(new Set(catalogue.map(b => b.subject))).sort();
    
    // Populate datalist for subject input
    const datalist = document.getElementById("subject-suggestions");
    if (datalist) {
      datalist.innerHTML = "";
      subjects.forEach(sub => {
        const option = document.createElement("option");
        option.value = sub;
        datalist.appendChild(option);
      });
    }

    // Populate catalogue filter
    if (catalogueFilterSubject) {
      catalogueFilterSubject.innerHTML = '<option value="">All Subjects</option>';
      subjects.forEach(sub => {
        const option = document.createElement("option");
        option.value = sub;
        option.textContent = sub;
        catalogueFilterSubject.appendChild(option);
      });
    }
  }

  // Helper utility for safe HTML injection
  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // =========================================================================
  // EVENT LISTENERS & INITIALIZATION
  // =========================================================================

  function init() {
    // Form submission
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      handleSearch();
    });

    // Reset button
    btnReset.addEventListener("click", function () {
      handleReset();
    });

    // Quick test preset buttons
    const presetButtons = document.querySelectorAll(".preset-btn");
    presetButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const subject = btn.getAttribute("data-subject");
        const difficulty = btn.getAttribute("data-difficulty");
        const purpose = btn.getAttribute("data-purpose");

        subjectInput.value = subject;
        if (difficulty) difficultySelect.value = difficulty;
        if (purpose) purposeSelect.value = purpose;

        handleSearch();
      });
    });

    // Subject suggestion pills
    const pillButtons = document.querySelectorAll(".subject-pill");
    pillButtons.forEach(pill => {
      pill.addEventListener("click", () => {
        subjectInput.value = pill.textContent.trim();
        subjectInput.focus();
      });
    });

    // Toggle Catalogue Explorer
    if (btnToggleCatalogue) {
      btnToggleCatalogue.addEventListener("click", () => {
        fullCatalogueSection.classList.toggle("hidden");
        const isHidden = fullCatalogueSection.classList.contains("hidden");
        btnToggleCatalogue.textContent = isHidden ? "📖 Browse Full Library Catalogue (24 Books)" : "▲ Hide Library Catalogue";
        if (!isHidden) {
          renderFullCatalogue();
          fullCatalogueSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }

    if (catalogueSearchInput) {
      catalogueSearchInput.addEventListener("input", renderFullCatalogue);
    }
    if (catalogueFilterSubject) {
      catalogueFilterSubject.addEventListener("change", renderFullCatalogue);
    }

    populateSubjectDropdowns();
  }

  // Run on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
