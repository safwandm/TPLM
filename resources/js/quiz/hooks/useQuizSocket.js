import { useEffect, useRef } from "react";
import webFetch from "@/lib/webFetch";
import { WebAPI } from "@/lib/api.web";
import { shuffleQuestionOptions } from "@/quiz/utils/shuffleQuestion";
import { mapCorrectAnswerToShuffled, normalizeForCompare } from "@/quiz/utils/answerMapper";

/**
 * useQuizSocket
 * --------------------------------------------------
 * Extracts ALL websocket / realtime behaviour from MuridQuiz.
 *
 * Responsibilities:
 *  - fetch quiz config
 *  - listen QuestionStarted
 *  - listen QuestionEnded
 *  - listen LeaderboardUpdated
 *  - listen SessionFinished
 */
export default function useQuizSocket({
    sessionId,

    // state setters
    setCurrentQuestion,
    setQuestionIndex,
    setStatus,
    setSelectedAnswer,
    setCorrectAnswer,
    setIsCorrect,
    setLeaderboard,
    setTimeLeft,
    setQuizFinished,
    setPendingSessionFinish,
    setFinalScore,
    setQuizConfig,
    setHp,

    // refs (live state access inside events)
    currentQuestionRef,
    selectedAnswerRef,
    quizConfigRef,

    hp,
}) {

    useEffect(() => {
        if (!sessionId) return;
        console.log("[useQuizSocket] connecting to session", sessionId);
        console.log("[useQuizSocket] window.Echo exists?", !!window.Echo);

        /* ================= FETCH CONFIG ================= */
        async function fetchConfig() {
            const res = await webFetch(WebAPI.session.getConfig(sessionId), {
                skipAuth: true,
            });
            const config = await res.json();
            setQuizConfig(config);

            if (config.mode === "game" && hp === null) {
                setHp(config.hp_awal);
            }
        }

        fetchConfig();

        const channel = window.Echo.channel(`sesi.${sessionId}`);
        console.log("[useQuizSocket] joined channel", `sesi.${sessionId}`);

        /* ================= QUESTION STARTED ================= */
        channel.listen(".QuestionStarted", (e) => {
            console.log("[SOCKET] QuestionStarted event received", e);
            const shuffled = shuffleQuestionOptions(e);

            setCurrentQuestion(shuffled);
            setQuestionIndex(p => p + 1);
            setStatus("idle");
            setSelectedAnswer(null);
            setCorrectAnswer(null);
            setIsCorrect(null);

            if (e.ends_at) {
                const end = new Date(e.ends_at).getTime();
                setTimeLeft(Math.max(0, Math.floor((end - Date.now()) / 1000)));
            }
        });

        /* ================= QUESTION ENDED ================= */
        channel.listen(".QuestionEnded", (e) => {
            console.log("[SOCKET] QuestionEnded event received", e);
            setStatus("result");

            const liveConfig = quizConfigRef.current;
            const liveQuestion = currentQuestionRef.current;
            const liveAnswer = selectedAnswerRef.current;

            if (liveConfig?.tampilkan_jawaban_benar && liveQuestion) {
                let correctAnswerPayload = mapCorrectAnswerToShuffled(
                    e.jawaban_benar,
                    liveQuestion
                );

                // normalize true/false payload
                if (liveQuestion.tipe_pertanyaan === "true_false") {
                    if (Array.isArray(correctAnswerPayload)) {
                        correctAnswerPayload = correctAnswerPayload[0];
                    }
                    correctAnswerPayload =
                        correctAnswerPayload === true || correctAnswerPayload === 1;
                }

                setCorrectAnswer(correctAnswerPayload);

                // student never answered
                if (liveAnswer === null) {
                    setIsCorrect(null);
                } else {
                    let studentToCompare = liveAnswer;
                    let correctToCompare = correctAnswerPayload;

                    // ordering comparison must use ORIGINAL indices
                    if (
                        liveQuestion.tipe_pertanyaan === "ordering" &&
                        Array.isArray(liveAnswer) &&
                        liveQuestion?._optionIndexMap
                    ) {
                        const map = liveQuestion._optionIndexMap;
                        studentToCompare = liveAnswer.map(i => map[i]);
                    }

                    const normalizedStudent = normalizeForCompare(studentToCompare, liveQuestion.tipe_pertanyaan);
                    const normalizedCorrect = normalizeForCompare(correctToCompare, liveQuestion.tipe_pertanyaan);

                    // full correct
                    if (normalizedStudent === normalizedCorrect) {
                        setIsCorrect("correct");
                    }
                    // partial logic for multi-answer / ordering / matching
                    else if (
                        Array.isArray(studentToCompare) &&
                        Array.isArray(correctToCompare) &&
                        studentToCompare.length > 0
                    ) {
                        const intersection = studentToCompare.filter(v => correctToCompare.includes(v));
                        if (intersection.length > 0) {
                            setIsCorrect("partial");
                        } else {
                            setIsCorrect("wrong");
                        }
                    }
                    else {
                        setIsCorrect("wrong");
                    }
                }
            }

            if (e.break_time) {
                setTimeLeft(Math.floor(e.break_time));
            }
        });

        /* ================= LEADERBOARD ================= */
        channel.listen(".LeaderboardUpdated", (e) => {
            console.log("[SOCKET] LeaderboardUpdated", e);
            setLeaderboard(e.leaderboard);
        });

        /* ================= SESSION FINISHED ================= */
        channel.listen(".SessionFinished", () => {
            console.log("[SOCKET] SessionFinished");
            const latest = JSON.parse(localStorage.getItem("peserta"));
            setFinalScore(latest?.total_skor ?? 0);
            setPendingSessionFinish(true);
        });

        return () => window.Echo.leave(`sesi.${sessionId}`);
    }, [sessionId]);
}