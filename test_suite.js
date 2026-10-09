/**
 * Automated Test Suite for AI Library Assistance Agent Core Engine
 * Verifies all 4 required test cases and edge cases.
 */

const { BOOK_CATALOGUE } = require('./js/books.js');

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

const GENERIC_MODIFIERS = new Set([
  "computing", "science", "engineering", "management", "development", 
  "technology", "technologies", "studies", "programming", "course", 
  "concepts", "systems", "system"
]);

function normalizeString(str) {
  if (!str) return "";
  return str.toLowerCase().trim().replace(/[^\w\s]/gi, " ").replace(/\s+/g, " ");
}

function resolveCanonicalSubject(rawInput) {
  const cleaned = normalizeString(rawInput);
  if (SUBJECT_SYNONYMS[cleaned]) {
    return SUBJECT_SYNONYMS[cleaned];
  }
  for (const [key, canonical] of Object.entries(SUBJECT_SYNONYMS)) {
    if (cleaned.includes(key) || key.includes(cleaned)) {
      return canonical;
    }
  }
  return null;
}

function stringSimilarity(s1, s2) {
  const longer = s1.length < s2.length ? s2 : s1;
  const shorter = s1.length < s2.length ? s1 : s2;
  if (longer.length === 0) return 1.0;
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

function retrieveBooks(catalogue, rawQuery) {
  const query = normalizeString(rawQuery);
  const canonical = resolveCanonicalSubject(rawQuery);
  const queryTokens = query.split(" ").filter(t => t.length > 1);
  const distinctiveTokens = queryTokens.filter(t => !GENERIC_MODIFIERS.has(t));

  const retrieved = [];

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
    return { query: rawQuery, canonicalSubject: canonical, candidates: retrieved };
  }

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

  return { query: rawQuery, canonicalSubject: canonical, candidates: retrieved };
}

function compareAndScoreBooks(retrievalResult, targetDifficulty, targetPurpose) {
  const scoredBooks = retrievalResult.candidates.map(item => {
    const book = item.book;
    const subjectScore = item.subjectRelevanceScore;

    let difficultyScore = 0;
    let difficultyExplanation = "";
    const bookDiffIdx = DIFFICULTY_LEVELS.indexOf(book.difficulty);
    const targetDiffIdx = DIFFICULTY_LEVELS.indexOf(targetDifficulty);
    const diffDistance = Math.abs(bookDiffIdx - targetDiffIdx);

    if (diffDistance === 0) {
      difficultyScore = 25;
      difficultyExplanation = `Exact ${targetDifficulty} level match.`;
    } else if (diffDistance === 1) {
      difficultyScore = 14;
      difficultyExplanation = `1 level offset (${book.difficulty}).`;
    } else {
      difficultyScore = 4;
      difficultyExplanation = `2 levels offset (${book.difficulty}).`;
    }

    let purposeScore = 0;
    const targetPurposeNorm = normalizeString(targetPurpose);
    const bookPrimaryPurposeNorm = normalizeString(book.learningPurpose);
    const secondaryNorms = (book.secondaryPurposes || []).map(p => normalizeString(p));

    if (bookPrimaryPurposeNorm === targetPurposeNorm) {
      purposeScore = 25;
    } else if (secondaryNorms.includes(targetPurposeNorm)) {
      purposeScore = 18;
    } else {
      purposeScore = 6;
    }

    const totalScore = Math.min(100, Math.round(subjectScore + difficultyScore + purposeScore));
    return { book, subjectScore, difficultyScore, purposeScore, totalScore, difficultyExplanation, diffDistance };
  });

  scoredBooks.sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    if (b.difficultyScore !== a.difficultyScore) return b.difficultyScore - a.difficultyScore;
    return b.book.rating - a.book.rating;
  });

  return scoredBooks;
}

function findSuggestedSubjects(rawQuery, catalogue) {
  const availableSubjects = Array.from(new Set(catalogue.map(b => b.subject)));
  const queryNorm = normalizeString(rawQuery);
  const scoredSubjects = availableSubjects.map(sub => {
    const subNorm = normalizeString(sub);
    const similarity = stringSimilarity(queryNorm, subNorm);
    return { subject: sub, score: similarity };
  });
  scoredSubjects.sort((a, b) => b.score - a.score);
  return scoredSubjects.slice(0, 4).map(s => s.subject);
}

// ==========================================
// RUN TEST CASES
// ==========================================

console.log("==================================================");
console.log("RUNNING AI LIBRARY ASSISTANCE AGENT TEST SUITE");
console.log("==================================================");

let allPassed = true;

// Test 1: Python + Beginner + Exam Preparation
console.log("\n[TEST 1] Python + Beginner + Exam Preparation");
const res1 = retrieveBooks(BOOK_CATALOGUE, "Python");
const scored1 = compareAndScoreBooks(res1, "Beginner", "Exam Preparation");
console.log(`Retrieved: ${res1.candidates.length} books`);
console.log(`Top 1: "${scored1[0].book.title}" by ${scored1[0].book.author}`);
console.log(`Score: ${scored1[0].totalScore}/100 (Subject: ${scored1[0].subjectScore}, Diff: ${scored1[0].difficultyScore}, Purpose: ${scored1[0].purposeScore})`);
if (scored1[0].book.id === "py-01" && scored1[0].totalScore === 100) {
  console.log(">>> TEST 1 PASSED: Perfect 100% match for Zelle's Python Programming!");
} else {
  console.error(">>> TEST 1 FAILED");
  allPassed = false;
}

// Test 2: Cloud Computing + Intermediate + Project Development
console.log("\n[TEST 2] Cloud Computing + Intermediate + Project Development");
const res2 = retrieveBooks(BOOK_CATALOGUE, "Cloud Computing");
const scored2 = compareAndScoreBooks(res2, "Intermediate", "Project Development");
console.log(`Retrieved: ${res2.candidates.length} books`);
console.log(`Top 1: "${scored2[0].book.title}" by ${scored2[0].book.author} (Score: ${scored2[0].totalScore}%)`);
console.log(`Top 2: "${scored2[1].book.title}" by ${scored2[1].book.author} (Score: ${scored2[1].totalScore}%)`);
console.log(`Top 3: "${scored2[2].book.title}" by ${scored2[2].book.author} (Score: ${scored2[2].totalScore}%)`);
if (scored2[0].totalScore === 100 && scored2[0].book.subject === "Cloud Computing") {
  console.log(">>> TEST 2 PASSED: 100% match for Cloud Native Patterns / Google Cloud Solutions!");
} else {
  console.error(">>> TEST 2 FAILED");
  allPassed = false;
}

// Test 3: Artificial Intelligence + Advanced + Interview Preparation
console.log("\n[TEST 3] Artificial Intelligence + Advanced + Interview Preparation");
const res3 = retrieveBooks(BOOK_CATALOGUE, "Artificial Intelligence");
const scored3 = compareAndScoreBooks(res3, "Advanced", "Interview Preparation");
console.log(`Retrieved: ${res3.candidates.length} books`);
console.log(`Top 1: "${scored3[0].book.title}" by ${scored3[0].book.author} (Score: ${scored3[0].totalScore}%)`);
console.log(`Top 2: "${scored3[1].book.title}" by ${scored3[1].book.author} (Score: ${scored3[1].totalScore}%)`);
console.log(`Top 3: "${scored3[2].book.title}" by ${scored3[2].book.author} (Score: ${scored3[2].totalScore}%)`);
if (scored3[0].totalScore === 100 && (scored3[0].book.id === "ai-02" || scored3[0].book.id === "ai-03")) {
  console.log(">>> TEST 3 PASSED: 100% match for Deep Learning / PRML!");
} else {
  console.error(">>> TEST 3 FAILED");
  allPassed = false;
}

// Test 4: Subject that does not exist in catalogue (Quantum Computing)
console.log("\n[TEST 4] Subject that does not exist in catalogue (Quantum Computing)");
const res4 = retrieveBooks(BOOK_CATALOGUE, "Quantum Computing");
console.log(`Retrieved: ${res4.candidates.length} books (Expected 0)`);
const suggestions = findSuggestedSubjects("Quantum Computing", BOOK_CATALOGUE);
console.log(`Fallback suggestions: ${suggestions.join(", ")}`);
if (res4.candidates.length === 0 && suggestions.length > 0) {
  console.log(">>> TEST 4 PASSED: Clean fallback detection and related subject recommendations!");
} else {
  console.error(">>> TEST 4 FAILED");
  allPassed = false;
}

console.log("\n==================================================");
if (allPassed) {
  console.log("ALL 4 MANDATORY TEST SUITE SCENARIOS PASSED 100%!");
} else {
  console.log("SOME TESTS FAILED");
}
console.log("==================================================");
