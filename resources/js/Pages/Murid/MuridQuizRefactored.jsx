import React from "react";
import { usePage } from "@inertiajs/react";
import useQuizState from "@/quiz/hooks/useQuizState";
import useQuizSocket from "@/quiz/hooks/useQuizSocket";
import useQuizTimer from "@/quiz/hooks/useQuizTimer";
import useQuizRestore from "@/quiz/hooks/useQuizRestore";
import useQuizSubmit from "@/quiz/hooks/useQuizSubmit";

import QuizFinishScreen from "@/quiz/components/QuizFinishScreen";
// import QuizHeader from "@/quiz/components/QuizHeader";
// import QuizTimer from "@/quiz/components/QuizTimer";
import QuizResultBanner from "@/quiz/components/QuizResultBanner";

// Existing question components (keep using global ones)
import MCQSingle from "@/Components/Questions/MCQSingle";
import MCQMulti from "@/Components/Questions/MCQMulti";
import TrueFalse from "@/Components/Questions/TrueFalse";
import OrderingQuestion from "@/Components/Questions/OrderingQuestion";
import MatchingQuestion from "@/Components/Questions/MatchingQuestion";

import Leaderboard from "@/Components/Leaderboard";

export default function MuridQuizRefactored() {
    // In the old page, peserta is stored in localStorage, not passed via Inertia props
    const peserta = JSON.parse(localStorage.getItem("peserta"));
    const sessionId = peserta?.session_id;

    /* ================= STATE ================= */
    const quiz = useQuizState();

    /* ================= SOCKET ================= */
    useQuizSocket({
        sessionId,
        setCurrentQuestion: quiz.setCurrentQuestion,
        setQuestionIndex: quiz.setQuestionIndex,
        setStatus: quiz.setStatus,
        setSelectedAnswer: quiz.setSelectedAnswer,
        setCorrectAnswer: quiz.setCorrectAnswer,
        setIsCorrect: quiz.setIsCorrect,
        setLeaderboard: quiz.setLeaderboard,
        setTimeLeft: quiz.setTimeLeft,
        setQuizFinished: quiz.setQuizFinished,
        setPendingSessionFinish: quiz.setPendingSessionFinish,
        setFinalScore: quiz.setFinalScore,
        setQuizConfig: quiz.setQuizConfig,
        setHp: quiz.setHp,
        currentQuestionRef: quiz.currentQuestionRef,
        selectedAnswerRef: quiz.selectedAnswerRef,
        quizConfigRef: quiz.quizConfigRef,
        hp: quiz.hp,
    });

    /* ================= RESTORE ================= */
    useQuizRestore({
        sessionId,
        peserta,
        setCurrentQuestion: quiz.setCurrentQuestion,
        setTimeLeft: quiz.setTimeLeft,
        setStatus: quiz.setStatus,
        setQuizFinished: quiz.setQuizFinished,
        setFinalScore: quiz.setFinalScore,
        setLeaderboard: quiz.setLeaderboard,
        setHp: quiz.setHp,
        setQuestionIndex: quiz.setQuestionIndex,
        setSelectedAnswer: quiz.setSelectedAnswer,
        setIsCorrect: quiz.setIsCorrect,
    });

    /* ================= SUBMIT ================= */
    const { submitAnswer } = useQuizSubmit({
        sessionId,
        peserta,
        isGameMode: quiz.isGameMode,
        hp: quiz.hp,
        setHp: quiz.setHp,
        setStatus: quiz.setStatus,
        timeLeft: quiz.timeLeft,
        currentQuestion: quiz.currentQuestion,
        selectedAnswer: quiz.selectedAnswer,
    });

    /* ================= TIMER ================= */
    useQuizTimer({
        onTimeoutSubmit: submitAnswer,
        timeLeft: quiz.timeLeft,
        setTimeLeft: quiz.setTimeLeft,
        pendingSessionFinish: quiz.pendingSessionFinish,
        setQuizFinished: quiz.setQuizFinished,
        setCurrentQuestion: quiz.setCurrentQuestion,
        isGameMode: quiz.isGameMode,
        hp: quiz.hp,
        setHp: quiz.setHp,
        status: quiz.status,
        timeoutPenaltyApplied: quiz.timeoutPenaltyApplied,
        setTimeoutPenaltyApplied: quiz.setTimeoutPenaltyApplied,
    });

    /* ================= FINISHED SCREEN ================= */
    if (quiz.quizFinished) {
        return (
            <QuizFinishScreen
                leaderboard={quiz.leaderboard}
                peserta={peserta}
                finalScore={quiz.finalScore}
                questionIndex={quiz.questionIndex}
                quizConfig={quiz.quizConfig}
            />
        );
    }

    /* ================= WAITING SCREEN ================= */
    if (!quiz.currentQuestion) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-blue-900 text-white">
                <h1 className="text-3xl font-bold">Menunggu soal berikutnya...</h1>
            </div>
        );
    }

    /* ================= QUESTION RENDERER ================= */
    function renderQuestion() {
        const props = {
            currentQuestion: quiz.currentQuestion,
            selectedAnswer: quiz.selectedAnswer,
            setSelectedAnswer: quiz.setSelectedAnswer,
            status: quiz.status,
            correctAnswer: quiz.correctAnswer,
        };

        switch (quiz.currentQuestion.tipe_pertanyaan) {
            case "multiple_choice_single":
                return <MCQSingle {...props} />;
            case "multiple_choice_multi":
                return <MCQMulti {...props} />;
            case "true_false":
                return <TrueFalse {...props} />;
            case "ordering":
                return <OrderingQuestion {...props} />;
            case "matching":
                return <MatchingQuestion {...props} />;
            default:
                return null;
        }
    }

    /* ================= MAIN UI ================= */
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-blue-900 p-4">
            <div className="bg-white rounded-full px-6 py-2 mb-2">
                Soal {quiz.questionIndex}
            </div>

            {quiz.isGameMode && quiz.hp !== null && (
                <div className="mb-2 text-white font-bold">
                    ❤️ HP: {quiz.hp}
                </div>
            )}

            <div className="text-white mb-4">
                ⏱ {
                    quiz.pendingSessionFinish
                        ? "Kuis berakhir dalam:"
                        : quiz.status === "result"
                            ? "Soal berikutnya dalam:"
                            : "Sisa waktu:"
                } <b>{quiz.timeLeft}s</b>
            </div>

            <h2 className="text-white text-xl mb-6 text-center">
                {quiz.currentQuestion.pertanyaan}
            </h2>

            {renderQuestion()}

            {quiz.status === "idle" && (
                <button
                    onClick={submitAnswer}
                    className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg opacity-80"
                >
                    Kirim Sekarang
                </button>
            )}

            <QuizResultBanner
                status={quiz.status}
                showCorrectAnswer={quiz.quizConfig.tampilkan_jawaban_benar}
                isCorrect={quiz.isCorrect}
                selectedAnswer={quiz.selectedAnswer}
                correctAnswer={quiz.correctAnswer}
            />

            {quiz.status === "result" && quiz.quizConfig.tampilkan_peringkat && (
                <div className="mt-6 w-full max-w-md bg-white text-black rounded-2xl p-6 shadow-xl border border-gray-200">
                    <Leaderboard
                        leaderboard={quiz.leaderboard}
                        questionIndex={quiz.questionIndex}
                    />
                </div>
            )}
        </div>
    );
}