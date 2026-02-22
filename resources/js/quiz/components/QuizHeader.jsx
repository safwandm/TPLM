

import React from "react";

/**
 * QuizHeader
 * ------------------------------------
 * Extracted from MuridQuiz top UI section.
 * Shows:
 *  - Question number
 *  - HP (game mode)
 *  - Timer label + countdown
 */
export default function QuizHeader({
    questionIndex,
    isGameMode,
    hp,
    timeLeft,
    status,
    pendingSessionFinish,
}) {
    const getTimerLabel = () => {
        if (pendingSessionFinish) return "Kuis berakhir dalam:";
        if (status === "result") return "Soal berikutnya dalam:";
        return "Sisa waktu:";
    };

    return (
        <>
            <div className="bg-white rounded-full px-6 py-2 mb-2">
                Soal {questionIndex}
            </div>

            {isGameMode && hp !== null && (
                <div className="mb-2 text-white font-bold">
                    ❤️ HP: {hp}
                </div>
            )}

            <div className="text-white mb-4">
                ⏱ {getTimerLabel()} <b>{timeLeft}s</b>
            </div>
        </>
    );
}