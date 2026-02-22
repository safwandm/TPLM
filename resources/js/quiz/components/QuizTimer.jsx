

import React from "react";

/**
 * QuizTimer
 * ------------------------------------
 * Displays the countdown text + value.
 * Extracted from MuridQuiz timer UI.
 */
export default function QuizTimer({
    timeLeft,
    status,
    pendingSessionFinish,
}) {
    const getTimerLabel = () => {
        if (pendingSessionFinish) return "Kuis berakhir dalam:";
        if (status === "result") return "Soal berikutnya dalam:";
        return "Sisa waktu:";
    };

    if (timeLeft === null) return null;

    return (
        <div className="text-white mb-4">
            ⏱ {getTimerLabel()} <b>{timeLeft}s</b>
        </div>
    );
}