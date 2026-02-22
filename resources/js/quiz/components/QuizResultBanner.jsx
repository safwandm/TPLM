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
  };

  const textMap = {
    correct: "✅ Jawaban benar!",
    wrong: "❌ Jawaban salah",
    partial: "🟡 Sebagian jawaban benar",
  };

  let resultKey;

  // Matching questions → compute real correctness from arrays
  if (Array.isArray(selectedAnswer) && Array.isArray(correctAnswer)) {
    let correctCount = 0;
    for (let i = 0; i < correctAnswer.length; i++) {
      if (selectedAnswer[i] === correctAnswer[i]) correctCount++;
    }

    if (correctCount === 0) resultKey = "wrong";
    else if (correctCount === correctAnswer.length) resultKey = "correct";
    else resultKey = "partial";
  } else {
    resultKey =
      isCorrect === true ? "correct" :
      isCorrect === false ? "wrong" :
      isCorrect;
  }

  if (!resultKey) return null;

  return (
    <div className={`mt-4 font-bold text-lg ${colorMap[resultKey]}`}>
      {textMap[resultKey]}
    </div>
  );
}