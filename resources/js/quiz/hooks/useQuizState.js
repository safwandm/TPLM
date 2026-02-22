import { useRef, useState, useEffect } from "react";

/**
 * useQuizState
 * --------------------------------------------------
 * Centralizes ALL React state previously inside MuridQuiz.
 * This becomes the single source of truth for the quiz page.
 */
export default function useQuizState() {

    // ===== CORE QUESTION FLOW =====
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [questionIndex, setQuestionIndex] = useState(0);

    const [status, setStatus] = useState("idle"); // idle | answered | result
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [isCorrect, setIsCorrect] = useState(null);
    const [correctAnswer, setCorrectAnswer] = useState(null);

    // ===== LEADERBOARD / FINISH =====
    const [leaderboard, setLeaderboard] = useState([]);
    const [quizFinished, setQuizFinished] = useState(false);
    const [pendingSessionFinish, setPendingSessionFinish] = useState(false);
    const [finalScore, setFinalScore] = useState(0);

    // ===== QUIZ CONFIG / GAME MODE =====
    const [quizConfig, setQuizConfig] = useState({
        tampilkan_jawaban_benar: false,
        tampilkan_peringkat: false,
        mode: "normal",
    });

    const [hp, setHp] = useState(null);
    const [timeoutPenaltyApplied, setTimeoutPenaltyApplied] = useState(false);
    const isGameMode = quizConfig.mode === "game";

    // ===== TIMER =====
    const [timeLeft, setTimeLeft] = useState(null);

    // ===== REFS (needed for socket callbacks) =====
    const currentQuestionRef = useRef(null);
    const selectedAnswerRef = useRef(null);
    const quizConfigRef = useRef(null);

    useEffect(() => {
        currentQuestionRef.current = currentQuestion;
    }, [currentQuestion]);

    useEffect(() => {
        selectedAnswerRef.current = selectedAnswer;
    }, [selectedAnswer]);

    useEffect(() => {
        quizConfigRef.current = quizConfig;
    }, [quizConfig]);

    return {
        // state
        currentQuestion, setCurrentQuestion,
        questionIndex, setQuestionIndex,
        status, setStatus,
        selectedAnswer, setSelectedAnswer,
        isCorrect, setIsCorrect,
        correctAnswer, setCorrectAnswer,
        leaderboard, setLeaderboard,
        quizFinished, setQuizFinished,
        pendingSessionFinish, setPendingSessionFinish,
        finalScore, setFinalScore,
        quizConfig, setQuizConfig,
        hp, setHp,
        timeoutPenaltyApplied, setTimeoutPenaltyApplied,
        isGameMode,
        timeLeft, setTimeLeft,

        // refs
        currentQuestionRef,
        selectedAnswerRef,
        quizConfigRef,
    };
}