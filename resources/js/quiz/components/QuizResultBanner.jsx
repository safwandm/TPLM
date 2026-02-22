import React from "react";

/**
 * QuizResultBanner
 * ------------------------------------
 * Shows green/red correctness message after QuestionEnded.
 */
export default function QuizResultBanner({
  status,
  showCorrectAnswer,
  isCorrect,
  selectedAnswer,
  correctAnswer,
}) {
  if (status !== "result" || !showCorrectAnswer) {
    return null;
  }

  const didAnswer = selectedAnswer !== null && selectedAnswer !== undefined &&
    !(Array.isArray(selectedAnswer) && selectedAnswer.length === 0);

  if (!didAnswer) {
    return (
      <div className="mt-4 font-bold text-lg text-gray-300">
        ⚠️ Kamu tidak mengirim jawaban
      </div>
    );
  }

  const colorMap = {
    correct: "text-green-300",
    wrong: "text-red-300",
    partial: "text-yellow-300",
    invalid: "text-orange-300",
  };

  const textMap = {
    correct: "✅ Jawaban benar!",
    wrong: "❌ Jawaban salah",
    partial: "🟡 Sebagian jawaban benar",
    invalid: "⚠️ Semua opsi dipilih (jawaban tidak valid)",
  };

  // Prefer the realtime result coming from socket (multi‑answer already handled there)
  let resultKey = null;

  // If socket already provided string result (correct / wrong / partial / invalid)
  if (typeof isCorrect === "string") {
    resultKey = isCorrect;
  }
  // Fallback for boolean single‑answer questions
  else if (typeof isCorrect === "boolean") {
    resultKey = isCorrect ? "correct" : "wrong";
  }
  // Last fallback (should rarely happen) – keep old array comparison only if socket gave nothing
  else if (Array.isArray(selectedAnswer) && Array.isArray(correctAnswer)) {
    let correctCount = 0;
    for (let i = 0; i < correctAnswer.length; i++) {
      if (selectedAnswer[i] === correctAnswer[i]) correctCount++;
    }

    if (correctCount === 0) resultKey = "wrong";
    else if (correctCount === correctAnswer.length) resultKey = "correct";
    else resultKey = "partial";
  }

  if (!resultKey) return null;

  return (
    <div className={`mt-4 font-bold text-lg ${colorMap[resultKey]}`}>
      {textMap[resultKey]}
    </div>
  );
}