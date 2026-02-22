/*
  answerMapper.js
  ----------------
  Central place for converting answers between:
  - SHUFFLED index space (frontend UI)
  - ORIGINAL index space (backend truth)

  Why this exists:
  Previously MuridQuiz duplicated this logic in many places:
  - submitAnswer()
  - restore session
  - QuestionEnded event
  - ordering comparison

  This file becomes the SINGLE SOURCE OF TRUTH.
*/

/* =====================================================
   Helpers
===================================================== */

function invertMap(shuffledToOriginal) {
    if (!shuffledToOriginal) return null;
    return Object.fromEntries(
        Object.entries(shuffledToOriginal).map(([s, o]) => [o, Number(s)])
    );
}

/* =====================================================
   FRONTEND → BACKEND
   Convert student answer to ORIGINAL indices before submit
===================================================== */
export function toOriginalAnswer(answer, question) {
    if (answer === null || answer === undefined) return null;
    if (!question?._optionIndexMap) return answer;

    const map = question._optionIndexMap; // shuffled -> original

    if (Array.isArray(answer)) return answer.map(i => map[i]);
    if (typeof answer === "number") return map[answer];

    return answer;
}

/* =====================================================
   BACKEND → FRONTEND
   Convert stored answer to SHUFFLED indices when restoring
===================================================== */
export function toShuffledAnswer(answer, question) {
    if (answer === null || answer === undefined) return null;
    if (!question?._optionIndexMap) return answer;

    const originalToShuffled = invertMap(question._optionIndexMap);
    if (!originalToShuffled) return answer;

    if (Array.isArray(answer)) return answer.map(i => originalToShuffled[i]);
    if (typeof answer === "number") return originalToShuffled[answer];

    return answer;
}

/* =====================================================
   CORRECT ANSWER → SHUFFLED
   Used during QuestionEnded so UI can highlight correctly
===================================================== */
export function mapCorrectAnswerToShuffled(correctAnswer, question) {
    if (!question?._optionIndexMap) return correctAnswer;

    const originalToShuffled = invertMap(question._optionIndexMap);
    if (!originalToShuffled) return correctAnswer;

    switch (question.tipe_pertanyaan) {
        case "multiple_choice_single":
            if (Array.isArray(correctAnswer)) return originalToShuffled[correctAnswer[0]];
            return originalToShuffled[correctAnswer];

        case "multiple_choice_multi":
        case "matching":
            if (Array.isArray(correctAnswer)) return correctAnswer.map(i => originalToShuffled[i]);
            return correctAnswer;

        case "ordering":
            // ordering stays in ORIGINAL space for comparison
            return correctAnswer;

        default:
            return correctAnswer;
    }
}

/* =====================================================
   NORMALIZE FOR COMPARISON
   Used when checking correctness
===================================================== */
export function normalizeForCompare(value, questionType) {
    if (value === null || value === undefined) return "null";

    // ordering must preserve order
    if (questionType === "ordering" && Array.isArray(value)) {
        return JSON.stringify(value);
    }

    // arrays where order doesn't matter
    if (Array.isArray(value)) {
        return JSON.stringify([...value].sort());
    }

    return JSON.stringify(value);
}