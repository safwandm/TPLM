import { useEffect, useRef } from "react";

/**
 * useQuizTimer
 * -------------------------
 * Extracts ALL timer behaviour from MuridQuiz.
 * Handles:
 *  - countdown ticking
 *  - delayed session finish after break timer
 *  - timeout HP penalty (game mode)
 */
export default function useQuizTimer({
    onTimeoutSubmit,
    timeLeft,
    setTimeLeft,
    pendingSessionFinish,
    setQuizFinished,
    setCurrentQuestion,
    isGameMode,
    hp,
    setHp,
    status,
    timeoutPenaltyApplied,
    setTimeoutPenaltyApplied,
}) {
    const autoSubmittedRef = useRef(false);

    /* ================= COUNTDOWN ================= */
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) return;

        const t = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(t);

                    // if this was the last break timer → finish quiz
                    if (pendingSessionFinish) {
                        setQuizFinished(true);
                        setCurrentQuestion(null);
                    }

                    autoSubmittedRef.current = false;
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(t);
    }, [timeLeft, pendingSessionFinish]);


    /* ================= TIMEOUT PENALTY (GAME MODE) ================= */
    useEffect(() => {
        if (!isGameMode) return;
        if (hp === null || hp <= 0) return;

        // time ran out and student didn't answer
        if (timeLeft === 0 && status === "idle" && !timeoutPenaltyApplied) {
            const newHp = Math.max(0, hp - 1);
            setHp(newHp);
            setTimeoutPenaltyApplied(true);

            const latest = JSON.parse(localStorage.getItem("peserta"));
            if (latest) {
                latest.hp_sisa = newHp;
                localStorage.setItem("peserta", JSON.stringify(latest));
            }
        }
    }, [timeLeft, status]);

    /* AUTO SUBMIT WHEN TIME RUNS OUT */
    useEffect(() => {
        console.log("[TIMER] effect fired", { timeLeft, status, hasSubmit: !!onTimeoutSubmit, alreadyAutoSubmitted: autoSubmittedRef.current });

        if (!onTimeoutSubmit) {
            console.log("[TIMER] no submit function");
            return;
        }
        if (timeLeft !== 0) {
            console.log("[TIMER] not zero yet");
            return;
        }
        if (status !== "idle") {
            console.log("[TIMER] status not idle", status);
            return;
        }
        if (autoSubmittedRef.current) {
            console.log("[TIMER] already auto submitted");
            return;
        }

        console.log("[TIMER] AUTO SUBMIT TRIGGERED");
        autoSubmittedRef.current = true;
        onTimeoutSubmit();
    }, [timeLeft, status, onTimeoutSubmit]);

    useEffect(() => {
        window.__quizTimeLeftDebug = timeLeft;
        window.__quizStatusDebug = status;
    }, [timeLeft, status]);
}