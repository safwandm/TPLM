import { useEffect, useRef } from "react";
import webFetch from "@/lib/webFetch";
import { WebAPI } from "@/lib/api.web";
import { shuffleQuestionOptions } from "@/quiz/utils/shuffleQuestion";
import { toShuffledAnswer } from "@/quiz/utils/answerMapper";

/**
 * useQuizRestore
 * --------------------------------------------------
 * Handles restoring quiz state when:
 *  - page reload
 *  - back button
 *  - tab becomes visible again
 *
 * Extracted from MuridQuiz restore logic.
 */
export default function useQuizRestore({
    sessionId,
    peserta,

    setCurrentQuestion,
    setTimeLeft,
    setStatus,
    setQuizFinished,
    setFinalScore,
    setLeaderboard,
    setHp,
    setQuestionIndex,
    setSelectedAnswer,
    setIsCorrect,
}) {
    // ===== TAB RETURN / PAGE SHOW RESTORE =====
    useEffect(() => {
        if (!sessionId || !peserta?.id) return;

        const restoreState = async () => {
            try {
                const res = await webFetch(
                    WebAPI.session.restore(sessionId, peserta.id),
                    { skipAuth: true }
                );
                if (!res.ok) return;

                const data = await res.json();

                // quiz already finished
                if (data.status === "finished") {
                    setQuizFinished(true);
                    setFinalScore(data.final_score);
                    return;
                }

                if (data.current_question) {
                    const shuffled = shuffleQuestionOptions(data.current_question);
                    setCurrentQuestion(shuffled);
                    setTimeLeft(Math.floor(data.time_left));
                    setStatus(data.answered ? "result" : "idle");
                }
            } catch {
                // silent fail
            }
        };

        const handleShow = () => restoreState();

        window.addEventListener("pageshow", handleShow);
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") handleShow();
        });

        return () => window.removeEventListener("pageshow", handleShow);
    }, [sessionId]);


    // ===== INITIAL RESTORE (ON MOUNT) =====
    useEffect(() => {
        if (!sessionId || !peserta?.id) return;

        async function restore() {
            const res = await webFetch(
                WebAPI.session.restore(sessionId, peserta.id),
                { skipAuth: true }
            );
            const data = await res.json();

            if (data.status === "finished") {
                setQuizFinished(true);
                setFinalScore(data.final_score);
                return;
            }

            if (data.leaderboard?.length) {
                setLeaderboard(data.leaderboard);
            }

            setHp(data.hp_sisa);
            setQuestionIndex(data.current_question_number);

            if (data.current_question) {
                const shuffled = shuffleQuestionOptions(data.current_question);
                setCurrentQuestion(shuffled);
                setTimeLeft(Math.floor(data.time_left));

                if (data.answered) {
                    // convert ORIGINAL -> SHUFFLED
                    const restoredAnswer = toShuffledAnswer(data.jawaban, shuffled);
                    setSelectedAnswer(restoredAnswer);

                    const correct =
                        data?.correctness ??
                        data?.jawaban?.correctness ??
                        null;

                    setIsCorrect(correct === 1 || correct === true);
                    setStatus("result");
                } else {
                    setStatus("idle");
                }
            }
        }

        restore();
    }, []);
}