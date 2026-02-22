import { useEffect, useState, useRef } from "react";
import webFetch from "@/lib/webFetch";
import { WebAPI } from "@/lib/api.web";
import { ApiAPI } from "../../lib/api.api";

import Leaderboard from "../../Components/Leaderboard";
import MCQSingle from "../../Components/Questions/MCQSingle";
import MCQMulti from "../../Components/Questions/MCQMulti";
import TrueFalse from "../../Components/Questions/TrueFalse";
import OrderingQuestion from "../../Components/Questions/OrderingQuestion";
import MatchingQuestion from "../../Components/Questions/MatchingQuestion";

/* ================= SHUFFLE HELPERS ================= */
function shuffleArray(array) {
    if (!Array.isArray(array)) return array;
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function shuffleQuestionOptions(question) {
    if (!question?.opsi) return question;

    // Multiple choice + ordering
    if (Array.isArray(question.opsi)) {

        const original = question.opsi.map((text, index) => ({
            text,
            originalIndex: index,
        }));

        const shuffled = shuffleArray(original);

        // map newIndex -> originalIndex (REVERSE MAP for submit)
        const reverseMap = {};
        shuffled.forEach((item, newIndex) => {
            reverseMap[newIndex] = item.originalIndex;
        });

        return {
            ...question,
            opsi: shuffled.map(s => s.text),
            _optionIndexMap: reverseMap,
        };
    }

    // MATCHING → shuffle kanan only
    if (question.tipe_pertanyaan === "matching" && question.opsi.kanan) {

        const kananOriginal = question.opsi.kanan.map((text, index) => ({
            text,
            originalIndex: index,
        }));

        const kananShuffled = shuffleArray(kananOriginal);

        const reverseMap = {};
        kananShuffled.forEach((item, newIndex) => {
            reverseMap[newIndex] = item.originalIndex;
        });

        return {
            ...question,
            opsi: {
                ...question.opsi,
                kanan: kananShuffled.map(k => k.text),
            },
            _optionIndexMap: reverseMap,
        };
    }

    return question;
}

export default function StudentQuiz() {
    const peserta = JSON.parse(localStorage.getItem("peserta"));
    const sessionId = peserta?.session_id;

    /* ================= CORE STATE ================= */
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [questionIndex, setQuestionIndex] = useState(0);

    const [status, setStatus] = useState("idle"); // idle | answered | result
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [isCorrect, setIsCorrect] = useState(null);
    const [correctAnswer, setCorrectAnswer] = useState(null);

    const [leaderboard, setLeaderboard] = useState([]);
    const [quizFinished, setQuizFinished] = useState(false);
    const [pendingSessionFinish, setPendingSessionFinish] = useState(false);
    const [finalScore, setFinalScore] = useState(0);

    const [quizConfig, setQuizConfig] = useState({
        tampilkan_jawaban_benar: false,
        tampilkan_peringkat: false,
        mode: "normal",
    });

    const [hp, setHp] = useState(null);
    const [timeoutPenaltyApplied, setTimeoutPenaltyApplied] = useState(false);
    const isGameMode = quizConfig.mode === "game";

    /* ================= TIMER ================= */
    const [timeLeft, setTimeLeft] = useState(null);
    const [dragIndex, setDragIndex] = useState(null);
    // matchingPairs: { rightIndex -> leftIndex }
    const [matchingPairs, setMatchingPairs] = useState({});
    const [activeAnswer, setActiveAnswer] = useState(null);
    const [activeQuestion, setActiveQuestion] = useState(null);
    const leftRefs = useRef([]);
    const rightRefs = useRef([]);
    const containerRef = useRef(null);
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

    /* ================= SAFETY ================= */
    useEffect(() => {
        if (!peserta || !sessionId) {
            window.location.href = "/";
        }
    }, []);

    /* ================= RETURN TO TAB / BACK BUTTON ================= */
    useEffect(() => {
        const restoreState = async () => {
            if (!sessionId || !peserta?.id) return;

            try {
                const res = await webFetch(
                    WebAPI.session.restore(sessionId, peserta.id),
                    { skipAuth: true }
                );
                if (!res.ok) return;

                const data = await res.json();

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
            } catch { }
        };

        const handleShow = () => restoreState();

        window.addEventListener("pageshow", handleShow);
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") handleShow();
        });

        return () => window.removeEventListener("pageshow", handleShow);
    }, [sessionId]);

    /* ================= SOCKET ================= */
    useEffect(() => {
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

        channel
            .listen(".QuestionStarted", (e) => {
                console.log("QuestionStarted event:", e);
                const shuffled = shuffleQuestionOptions(e);
                setCurrentQuestion(shuffled);
                setQuestionIndex(p => p + 1);
                resetState(shuffled);

                if (e.ends_at) {
                    const end = new Date(e.ends_at).getTime();
                    setTimeLeft(Math.max(0, Math.floor((end - Date.now()) / 1000)));
                }
            })
            .listen(".QuestionEnded", (e) => {
                // stop answering phase -> ENTER RESULT PHASE
                setStatus("result");

                console.log("QuestionEnded event:", e);

                const liveConfig = quizConfigRef.current;
                const liveQuestion = currentQuestionRef.current;
                const liveAnswer = selectedAnswerRef.current;

                if (liveConfig?.tampilkan_jawaban_benar && liveQuestion) {
                    let correctAnswerPayload = e.jawaban_benar;

                    // 🔁 convert ORIGINAL indices -> SHUFFLED indices so UI can highlight correctly
                    if (liveQuestion?._optionIndexMap) {
                        const reverseMap = liveQuestion._optionIndexMap; // shuffledIndex -> originalIndex
                        const inverted = Object.fromEntries(
                            Object.entries(reverseMap).map(([k, v]) => [v, Number(k)])
                        );

                        // remap based on question type
                        switch (liveQuestion.tipe_pertanyaan) {
                            case "multiple_choice_single":
                                if (Array.isArray(correctAnswerPayload)) {
                                    correctAnswerPayload = inverted
                                        ? inverted[correctAnswerPayload[0]]
                                        : correctAnswerPayload[0];
                                }
                                break;

                            case "multiple_choice_multi":
                                if (Array.isArray(correctAnswerPayload)) {
                                    correctAnswerPayload = correctAnswerPayload.map(i => inverted[i]);
                                }
                                break;

                            // ordering case removed
                            case "matching":
                                // backend sends [rightIndex,rightIndex...] per left index
                                // UI expects array indexed by LEFT index with SHUFFLED right indices
                                if (Array.isArray(correctAnswerPayload)) {
                                    correctAnswerPayload = correctAnswerPayload.map(i => inverted[i]);
                                }
                                break;
                        }
                    }

                    // ===== ALWAYS normalize true_false payload =====
                    if (liveQuestion.tipe_pertanyaan === "true_false") {
                        if (Array.isArray(correctAnswerPayload)) {
                            correctAnswerPayload = correctAnswerPayload[0];
                        }
                        // force boolean
                        correctAnswerPayload = correctAnswerPayload === true || correctAnswerPayload === 1;
                    }

                    setCorrectAnswer(correctAnswerPayload);

                    // compare student answer vs correct answer
                    const normalize = (v, type) => {
                        if (v === null || v === undefined) return "null";

                        // ORDERING must preserve order
                        if (type === "ordering" && Array.isArray(v)) {
                            return JSON.stringify(v);
                        }

                        // MULTI / MATCHING can ignore order
                        if (Array.isArray(v)) {
                            return JSON.stringify([...v].sort());
                        }

                        return JSON.stringify(v);
                    };

                    // if student never answered → treat as wrong
                    if (liveAnswer === null) {
                        setIsCorrect(false);
                    } else {

                        let studentToCompare = liveAnswer;
                        let correctToCompare = correctAnswerPayload;

                        // 🔧 FIX ORDERING COMPARISON
                        if (
                            liveQuestion.tipe_pertanyaan === "ordering" &&
                            Array.isArray(liveAnswer) &&
                            liveQuestion?._optionIndexMap
                        ) {
                            const map = liveQuestion._optionIndexMap; // shuffledIndex -> originalIndex

                            // convert student's shuffled order back to ORIGINAL indices
                            studentToCompare = liveAnswer.map(i => map[i]);

                            // backend already gives ORIGINAL correct order → do NOT remap
                            correctToCompare = correctAnswerPayload;
                        }

                        setIsCorrect(
                            normalize(studentToCompare, liveQuestion.tipe_pertanyaan) ===
                            normalize(correctToCompare, liveQuestion.tipe_pertanyaan)
                        );
                    }
                }

                // break timer countdown before next question
                if (e.break_time) {
                    setTimeLeft(Math.floor(e.break_time));
                }
            })
            .listen(".LeaderboardUpdated", (e) => {
                console.log("LeaderboardUpdated event:", e);
                setLeaderboard(e.leaderboard);
            })
            .listen(".SessionFinished", () => {
                console.log("SessionFinished event (delayed finish)");
                const latest = JSON.parse(localStorage.getItem("peserta"));
                setFinalScore(latest?.total_skor ?? 0);

                // do NOT finish immediately — wait until break timer ends
                setPendingSessionFinish(true);
            });

        return () => window.Echo.leave(`sesi.${sessionId}`);
    }, [sessionId]);

    /* ================= TIMER ================= */
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) return;

        const t = setInterval(() => {
            setTimeLeft(p => {
                if (p <= 1) {
                    clearInterval(t);

                    // if this was the last break timer → now show finish popup
                    if (pendingSessionFinish) {
                        setQuizFinished(true);
                        setCurrentQuestion(null);
                    }

                    return 0;
                }
                return p - 1;
            });
        }, 1000);

        return () => clearInterval(t);
    }, [timeLeft, pendingSessionFinish]);

    /* ================= TIMEOUT PENALTY ================= */
    useEffect(() => {
        if (!isGameMode || hp === null || hp <= 0) return;

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

    // restore session
    useEffect(() => {
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

                // --- PATCHED RESTORE LOGIC ---
                if (data.answered) {
                    let restoredAnswer = data.jawaban;

                    // 🔁 IMPORTANT: backend stores ORIGINAL indices
                    // convert back to SHUFFLED indices for frontend UI (ordering question)
                    if (
                        restoredAnswer !== null &&
                        Array.isArray(restoredAnswer) &&
                        shuffled?._optionIndexMap &&
                        shuffled.tipe_pertanyaan === "ordering"
                    ) {
                        const shuffledToOriginal = shuffled._optionIndexMap;
                        const originalToShuffled = Object.fromEntries(
                            Object.entries(shuffledToOriginal).map(([s, o]) => [o, Number(s)])
                        );

                        restoredAnswer = restoredAnswer.map(i => originalToShuffled[i]);
                    }

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
                // --- END PATCHED RESTORE LOGIC ---
            }
        }

        restore();
    }, []);

    /* ================= HELPERS ================= */
    function resetState(question = null) {
        setStatus("idle");
        setIsCorrect(null);
        setTimeoutPenaltyApplied(false);

        if (!question) {
            setSelectedAnswer(null);
            return;
        }

        if (question.tipe_pertanyaan === "ordering") {
            // student has not answered yet
            setSelectedAnswer(null);
        }
        else if (question.tipe_pertanyaan === "matching") {
            setMatchingPairs({});
            setActiveAnswer(null);
            setActiveQuestion(null);
            setSelectedAnswer([]);
        }
        else {
            setSelectedAnswer(null);
        }
    }

    /* ================= SUBMIT ================= */
    async function submitAnswer() {
        if (status !== "idle" || timeLeft === 0) return;
        if (isGameMode && hp <= 0) return;

        // waiting for QuestionEnded event to reveal result
        setStatus("answered");

        // --- BEGIN: FIX ORDERING + SHUFFLE REMAP ---
        let answerToSend = selectedAnswer;

        // If student did NOT drag anything on ordering question
        // use current shuffled order as their answer
        if (answerToSend === null && currentQuestion.tipe_pertanyaan === "ordering") {
            answerToSend = currentQuestion.opsi.map((_, i) => i);
        }

        // Always convert shuffled indices → original indices before sending
        if (answerToSend !== null && currentQuestion?._optionIndexMap) {
            const map = currentQuestion._optionIndexMap; // shuffledIndex -> originalIndex

            if (Array.isArray(answerToSend)) {
                answerToSend = answerToSend.map(i => map[i]);
            } else if (typeof answerToSend === "number") {
                answerToSend = map[answerToSend];
            }
        }
        // --- END: FIX ORDERING + SHUFFLE REMAP ---

        try {
            const res = await webFetch(
                ApiAPI.session.submitAnswer(
                    sessionId,
                    currentQuestion.pertanyaan_id
                ),
                {
                    method: "POST",
                    skipAuth: true,
                    body: JSON.stringify({
                        peserta_id: peserta.id,
                        pertanyaan_id: currentQuestion.pertanyaan_id,
                        jawaban: answerToSend ?? null,
                    }),
                }
            );

            const data = await res.json();
            console.log("Submit Answer Response:", data);
            if (!res.ok) throw data;

            // correctness will be revealed after QuestionEnded event, not here

            if (isGameMode && typeof data.hp_sisa === "number") {
                setHp(data.hp_sisa);
                localStorage.setItem(
                    "peserta",
                    JSON.stringify({ ...peserta, hp_sisa: data.hp_sisa })
                );
            }

            // waiting for QuestionEnded event to reveal result
            // setStatus("answered");
        } catch (err) {
            console.log("Current Question:", currentQuestion);
            console.error(err);
            console.error(err?.message || "Gagal mengirim jawaban");
        }
    }

    /* ================= RENDERERS ================= */

    function renderQuestionByType() {
        const sharedProps = {
            currentQuestion,
            selectedAnswer,
            setSelectedAnswer,
            submitAnswer,
            status,
            correctAnswer,
        };

        switch (currentQuestion.tipe_pertanyaan) {
            case "multiple_choice_single":
                return <MCQSingle {...sharedProps} />;
            case "multiple_choice_multi":
                return <MCQMulti {...sharedProps} />;
            case "true_false":
                return <TrueFalse {...sharedProps} />;
            case "ordering":
                return <OrderingQuestion {...sharedProps} />;
            case "matching":
                return <MatchingQuestion {...sharedProps} />;
            default:
                return <div>Tipe soal tidak dikenali</div>;
        }
    }

    /* ================= FINISHED ================= */
    if (quizFinished) {
        const sorted = [...leaderboard].sort((a, b) => b.total_skor - a.total_skor);

        const meIndex = sorted.findIndex(p => p.nama === peserta?.nama);
        const myRank = meIndex >= 0 ? meIndex + 1 : "-";

        const totalSoal = questionIndex;

        // If your scoring base per question is 1000 max, adjust if needed
        const percentage = totalSoal > 0
            ? Math.round((finalScore / (totalSoal * 1000)) * 100)
            : 0;

        return (
            <div className="min-h-screen flex items-center justify-center bg-blue-900 p-6">
                <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl p-10">

                    {/* HEADER */}
                    <div className="text-center mb-8">
                        <div className="text-5xl mb-3">🏆</div>
                        <div className="bg-blue-100 border-2 border-blue-200 text-blue-900 rounded-xl py-3 font-semibold">
                            Kuis Selesai! Semoga hasilnya menyenangkan
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-10">

                        {/* LEFT PANEL */}
                        <div>
                            <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white rounded-2xl p-8 mb-6">
                                <div className="text-sm opacity-80">Skor Akhir Kamu</div>
                                <div className="text-6xl font-bold">
                                    {finalScore}
                                    <span className="text-2xl font-normal"> / 1000</span>
                                </div>
                            </div>

                            <div className="bg-gray-100 rounded-2xl p-6 space-y-4">
                                <div className="flex justify-between">
                                    <span>🏆 Peringkat</span>
                                    <span className="font-bold text-blue-700">#{myRank}</span>
                                </div>

                                <div className="flex justify-between">
                                    <span>📝 Total Soal</span>
                                    <span className="font-bold">{totalSoal}</span>
                                </div>

                                <div className="flex justify-between">
                                    <span>📊 Persentase</span>
                                    <span className="font-bold">{percentage}%</span>
                                </div>
                            </div>

                            <button
                                onClick={() => window.location.href = "/"}
                                className="mt-6 w-full bg-blue-800 hover:bg-blue-900 text-white py-3 rounded-xl font-semibold shadow-md"
                            >
                                Keluar
                            </button>
                        </div>

                        {/* RIGHT PANEL */}
                        {quizConfig.tampilkan_peringkat && (
                            <div>
                                <div className="bg-yellow-500 text-black font-bold px-4 py-3 rounded-t-2xl">
                                    🏆 Papan Peringkat Final
                                </div>

                                <div className="bg-gray-100 rounded-b-2xl p-4 space-y-3">
                                    {sorted.map((p, index) => {
                                        const isMe = p.nama === peserta?.nama;

                                        return (
                                            <div
                                                key={index}
                                                className={`flex justify-between items-center px-4 py-3 rounded-xl shadow-sm
                                                ${index === 0 ? "bg-blue-600 text-white" : "bg-white"}
                                                ${isMe ? "ring-2 ring-yellow-400" : ""}
                                            `}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold">{index + 1}.</span>

                                                    <span className="font-semibold">
                                                        {isMe ? "Kamu" : p.nama}
                                                    </span>

                                                    {isMe && (
                                                        <span className="text-xs bg-blue-200 text-blue-900 px-2 py-1 rounded-full">
                                                            YOU
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="font-bold">
                                                    {p.total_skor}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        );
    }
    
    if (!currentQuestion) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-blue-900 text-white">
                Menunggu soal dimulai...
            </div>
        );
    }

    /* ================= UI ================= */
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-blue-900 p-4">
            <div className="bg-white rounded-full px-6 py-2 mb-2">
                Soal {questionIndex}
            </div>

            {isGameMode && hp !== null && (
                <div className="mb-2 text-white font-bold">
                    ❤️ HP: {hp}
                </div>
            )}

            <div className="text-white mb-4">
                ⏱ {
                    pendingSessionFinish
                        ? "Kuis berakhir dalam:"
                        : status === "result"
                            ? "Soal berikutnya dalam:"
                            : "Sisa waktu:"
                } <b>{timeLeft}s</b>
            </div>

            <h2 className="text-white text-xl mb-6 text-center">
                {currentQuestion.pertanyaan}
            </h2>

            {renderQuestionByType()}

            {status === "result" && quizConfig.tampilkan_jawaban_benar && isCorrect !== null && (
                <div className={`mt-4 font-bold text-lg ${isCorrect ? "text-green-300" : "text-red-300"
                    }`}>
                    {isCorrect ? "✅ Jawaban benar!" : "❌ Jawaban salah"}
                </div>
            )}

            {status === "result" && quizConfig.tampilkan_peringkat && (
                <div className="mt-6 w-full max-w-md bg-white text-black rounded-2xl p-6 shadow-xl border border-gray-200">
                    <Leaderboard
                        leaderboard={leaderboard}
                        questionIndex={questionIndex}
                    />
                </div>
            )}
        </div>
    );
}
