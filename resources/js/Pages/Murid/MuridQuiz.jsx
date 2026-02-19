import { useEffect, useState, useRef } from "react";
import webFetch from "@/lib/webFetch";
import { WebAPI } from "@/lib/api.web";
import { ApiAPI } from "../../lib/api.api";

import Leaderboard from "../../Components/Leaderboard";

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

    const [leaderboard, setLeaderboard] = useState([]);
    const [quizFinished, setQuizFinished] = useState(false);
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
            } catch {}
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
            .listen(".LeaderboardUpdated", (e) => {
                console.log("LeaderboardUpdated event:", e);
                setLeaderboard(e.leaderboard);
            })
            .listen(".SessionFinished", () => {
                console.log("SessionFinished event");
                const latest = JSON.parse(localStorage.getItem("peserta"));
                setFinalScore(latest?.total_skor ?? 0);
                setQuizFinished(true);
                setCurrentQuestion(null);
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
                    return 0;
                }
                return p - 1;
            });
        }, 1000);

        return () => clearInterval(t);
    }, [timeLeft]);

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
                {skipAuth: true}
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

                if (!data.answered && shuffled.tipe_pertanyaan === "ordering") {
                    setSelectedAnswer(
                        shuffled.opsi.map((_, i) => i)
                    );
                }

                if (data.answered) {
                    setSelectedAnswer(data.jawaban);
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
            setSelectedAnswer(question.opsi.map((_, i) => i));
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

        setStatus("answered");

        // --- BEGIN: Index remapping for shuffled options ---
        let answerToSend = selectedAnswer;

        // convert shuffled indices back to original indices
        if (currentQuestion?._optionIndexMap) {

            const map = currentQuestion._optionIndexMap;

            if (Array.isArray(answerToSend)) {
                answerToSend = answerToSend.map(i => map[i]);
            } 
            else if (typeof answerToSend === "number") {
                answerToSend = map[answerToSend];
            }
            else if (currentQuestion.tipe_pertanyaan === "matching" && Array.isArray(answerToSend)) {
                answerToSend = answerToSend.map(i => map[i]);
            }
        }
        // --- END: Index remapping for shuffled options ---

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
                        jawaban:
                            answerToSend !== null
                                ? answerToSend
                                : currentQuestion.tipe_pertanyaan === "ordering"
                                ? currentQuestion.opsi.map((_, i) => i)
                                : null,
                    }),
                }
            );

            const data = await res.json();
            console.log("Submit Answer Response:", data);
            if (!res.ok) throw data;

            if (quizConfig.tampilkan_jawaban_benar) {
                // backend usually returns correctness at root or inside jawaban
                const correct =
                    data?.correctness ??
                    data?.jawaban?.correctness ??
                    null;

                setIsCorrect(correct === 1 || correct === true);
            }

            if (isGameMode && typeof data.hp_sisa === "number") {
                setHp(data.hp_sisa);
                localStorage.setItem(
                    "peserta",
                    JSON.stringify({ ...peserta, hp_sisa: data.hp_sisa })
                );
            }

            setStatus("result");
        } catch (err) {
            console.log("Current Question:", currentQuestion);
            console.error(err);
            console.error(err?.message || "Gagal mengirim jawaban");
        }
    }

    /* ================= RENDERERS ================= */

    function renderMultipleChoiceSingle() {
        return (
            <>
                <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                    {currentQuestion.opsi.map((opt, i) => (
                        <button
                            key={i}
                            disabled={status !== "idle"}
                            onClick={() => setSelectedAnswer(i)}
                            className={`h-28 rounded-xl font-bold ${
                                selectedAnswer === i
                                    ? "bg-blue-700 text-white"
                                    : "bg-gray-300"
                            }`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>

                <button
                    disabled={selectedAnswer === null || status !== "idle"}
                    onClick={submitAnswer}
                    className="mt-4 bg-green-600 text-white px-6 py-2 rounded"
                >
                    Kirim Jawaban
                </button>
            </>
        );
    }

    function renderMultipleChoiceMulti() {
        const toggle = (i) => {
            setSelectedAnswer(prev => {
                const arr = Array.isArray(prev) ? prev : [];
                return arr.includes(i)
                    ? arr.filter(x => x !== i)
                    : [...arr, i];
            });
        };

        return (
            <>
                <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                    {currentQuestion.opsi.map((opt, i) => (
                        <button
                            key={i}
                            disabled={status !== "idle"}
                            onClick={() => toggle(i)}
                            className={`h-28 rounded-xl font-bold ${
                                selectedAnswer?.includes(i)
                                    ? "bg-green-600 text-white"
                                    : "bg-gray-300"
                            }`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>

                <button
                    className="mt-4 bg-blue-600 text-white px-6 py-2 rounded"
                    disabled={!selectedAnswer?.length || status !== "idle"}
                    onClick={submitAnswer}
                >
                    Kirim Jawaban
                </button>
            </>
        );
    }

    function renderTrueFalse() {
        return (
            <>
                <div className="flex gap-4">
                    {[true, false].map(v => (
                        <button
                            key={String(v)}
                            disabled={status !== "idle"}
                            onClick={() => setSelectedAnswer(v)}
                            className={`px-10 py-6 rounded-xl text-xl ${
                                selectedAnswer === v
                                    ? "bg-blue-700 text-white"
                                    : "bg-gray-300"
                            }`}
                        >
                            {v ? "Benar" : "Salah"}
                        </button>
                    ))}
                </div>

                <button
                    disabled={selectedAnswer === null || status !== "idle"}
                    onClick={submitAnswer}
                    className="mt-4 bg-green-600 text-white px-6 py-2 rounded"
                >
                    Kirim Jawaban
                </button>
            </>
        );
    }

    function renderOrdering() {
        const order =
            Array.isArray(selectedAnswer)
                ? selectedAnswer
                : currentQuestion.opsi.map((_, i) => i);

        const handleDragStart = (index) => {
            setDragIndex(index);
        };

        const handleDragOver = (e, hoverIndex) => {
            e.preventDefault();

            if (dragIndex === null || dragIndex === hoverIndex) return;

            const rect = e.currentTarget.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;

            if (
                (dragIndex < hoverIndex && e.clientY < midpoint) ||
                (dragIndex > hoverIndex && e.clientY > midpoint)
            ) {
                return;
            }

            const newOrder = [...order];
            const draggedItem = newOrder[dragIndex];

            newOrder.splice(dragIndex, 1);
            newOrder.splice(hoverIndex, 0, draggedItem);

            setDragIndex(hoverIndex);
            setSelectedAnswer(newOrder);
        };

        const handleDragEnd = () => {
            setDragIndex(null);
        };

        return (
            <>
                <div className="space-y-4 w-full max-w-2xl">
                    {order.map((idx, i) => (
                        <div
                            key={idx}
                            draggable={status === "idle"}
                            onDragStart={() => handleDragStart(i)}
                            onDragOver={(e) => handleDragOver(e, i)}
                            onDragEnd={handleDragEnd}
                            className={`flex items-stretch rounded-xl border-2 transition-all duration-200
                                ${dragIndex === i ? "border-blue-400 shadow-lg scale-[1.02]" : "border-gray-200"}
                                ${status !== "idle" ? "opacity-60" : ""}
                                bg-white`}
                        >
                            {/* Number block (like matching UI left index) */}
                            <div className="flex items-center justify-center w-16 bg-green-400 text-white font-bold text-lg rounded-l-xl">
                                {i + 1}
                            </div>

                            {/* Content block */}
                            <div className="flex-1 p-4 flex items-center justify-between">
                                <span className="font-medium">
                                    {currentQuestion.opsi[idx]}
                                </span>

                                <span className="text-gray-400 text-sm">
                                    ⠿ Drag
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    className="mt-6 bg-blue-600 text-white px-6 py-2 rounded disabled:bg-gray-400"
                    disabled={status !== "idle"}
                    onClick={submitAnswer}
                >
                    Kirim Urutan
                </button>
            </>
        );
    }

    function renderMatching() {
        const kiri = currentQuestion.opsi.kiri;   // QUESTIONS
        const kanan = currentQuestion.opsi.kanan; // ANSWERS

        const colors = [
            "#86efac","#93c5fd","#fca5a5","#fde68a","#c4b5fd","#f9a8d4","#fdba74"
        ];

        const findQuestionUsingAnswer = (answerIndex, pairs) =>
            Object.keys(pairs).find(q => pairs[q] === answerIndex);

        const getPairColor = (questionIndex) =>
            matchingPairs[questionIndex] !== undefined
                ? colors[questionIndex % colors.length]
                : null;

        /* ================= ANSWER CLICK ================= */
        const selectAnswer = (answerIndex) => {
            if (status !== "idle") return;

            // if already paired
            const usedByQuestion = findQuestionUsingAnswer(answerIndex, matchingPairs);
            if (usedByQuestion !== undefined) {

                // If question is active → replace pair
                if (activeQuestion !== null) {
                    setMatchingPairs(prev => {
                        const updated = { ...prev };
                        delete updated[usedByQuestion];
                        updated[activeQuestion] = answerIndex;
                        setSelectedAnswer(Object.values(updated));
                        return updated;
                    });
                    setActiveAnswer(null);
                    setActiveQuestion(null);
                    return;
                }

                // If no active question → just UNMATCH (do not enter picking state)
                setMatchingPairs(prev => {
                    const updated = { ...prev };
                    delete updated[usedByQuestion];
                    setSelectedAnswer(Object.values(updated));
                    return updated;
                });

                setActiveAnswer(null);
                setActiveQuestion(null);
                return;
            }

            // if question already selected → pair
            if (activeQuestion !== null) {
                setMatchingPairs(prev => {
                    const updated = { ...prev };

                    // remove old pair using this answer
                    const oldQ = findQuestionUsingAnswer(answerIndex, updated);
                    if (oldQ !== undefined) delete updated[oldQ];

                    updated[activeQuestion] = answerIndex;
                    setSelectedAnswer(Object.values(updated));
                    return updated;
                });
                setActiveAnswer(null);
                setActiveQuestion(null);
                return;
            }

            // otherwise select answer
            setActiveAnswer(answerIndex);
        };

        /* ================= QUESTION CLICK ================= */
        const selectQuestion = (questionIndex) => {
            if (status !== "idle") return;

            // if already paired
            if (matchingPairs[questionIndex] !== undefined) {

                // If answer is active → replace pair
                if (activeAnswer !== null) {
                    setMatchingPairs(prev => {
                        const updated = { ...prev };
                        delete updated[questionIndex];
                        updated[questionIndex] = activeAnswer;
                        setSelectedAnswer(Object.values(updated));
                        return updated;
                    });
                    setActiveAnswer(null);
                    setActiveQuestion(null);
                    return;
                }

                // If no active answer → just UNMATCH (do not enter picking state)
                setMatchingPairs(prev => {
                    const updated = { ...prev };
                    delete updated[questionIndex];
                    setSelectedAnswer(Object.values(updated));
                    return updated;
                });

                setActiveQuestion(null);
                setActiveAnswer(null);
                return;
            }

            // if answer already selected → pair
            if (activeAnswer !== null) {
                setMatchingPairs(prev => {
                    const updated = { ...prev };

                    const oldQ = findQuestionUsingAnswer(activeAnswer, updated);
                    if (oldQ !== undefined) delete updated[oldQ];

                    updated[questionIndex] = activeAnswer;
                    setSelectedAnswer(Object.values(updated));
                    return updated;
                });
                setActiveAnswer(null);
                setActiveQuestion(null);
                return;
            }

            // otherwise select question
            setActiveQuestion(questionIndex);
        };

        /* ===== REAL DOM LINE POSITION ===== */
        const getCoords = (qIdx, aIdx) => {
            const leftEl = leftRefs.current[aIdx];
            const rightEl = rightRefs.current[qIdx];
            const containerEl = containerRef.current;

            if (!leftEl || !rightEl || !containerEl) return null;

            const L = leftEl.getBoundingClientRect();
            const R = rightEl.getBoundingClientRect();
            const C = containerEl.getBoundingClientRect();

            return {
                x1: L.right - C.left + 16,
                y1: L.top + L.height / 2 - C.top,
                x2: R.left - C.left - 16,
                y2: R.top + R.height / 2 - C.top,
            };
        };

        return (
            <>
            <div
                ref={containerRef}
                className="relative grid grid-cols-2 gap-24 w-full max-w-5xl mx-auto"
            >

                {/* ANSWERS */}
                <div className="space-y-6">
                    {kanan.map((ans,i)=>{
                        const usedBy = findQuestionUsingAnswer(i, matchingPairs);
                        const pairColor = usedBy !== undefined ? getPairColor(usedBy) : null;
                        const isActive = activeAnswer === i;

                        const bg =
                            pairColor ||
                            (isActive ? "#fde047" : "#bfdbfe");

                        return (
                            <div
                                key={i}
                                ref={el => leftRefs.current[i] = el}
                                onClick={()=>selectAnswer(i)}
                                className="p-5 rounded-xl border-2 cursor-pointer text-lg transition-all"
                                style={{
                                    backgroundColor: bg,
                                    borderColor: "white",
                                    color: pairColor ? "white" : "black"
                                }}
                            >
                                {ans}
                            </div>
                        );
                    })}
                </div>

                {/* QUESTIONS */}
                <div className="space-y-6">
                    {kiri.map((q,i)=>{
                        const color = getPairColor(i) || (activeQuestion === i ? "#fde047" : "#86efac");
                        return (
                            <div
                                key={i}
                                ref={el => rightRefs.current[i] = el}
                                onClick={()=>selectQuestion(i)}
                                className="p-5 rounded-xl border-2 cursor-pointer text-lg"
                                style={{
                                    backgroundColor: color,
                                    borderColor: "white",
                                    color: getPairColor(i) ? "white" : "black"
                                }}
                            >
                                {q}
                            </div>
                        );
                    })}
                </div>

                {/* REAL SVG LINES */}
                <svg className="absolute left-0 top-0 w-full h-full pointer-events-none">
                    {Object.entries(matchingPairs).map(([q,a])=>{
                        const coords = getCoords(Number(q), Number(a));
                        if (!coords) return null;

                        return (
                            <line
                                key={q}
                                x1={coords.x1}
                                y1={coords.y1}
                                x2={coords.x2}
                                y2={coords.y2}
                                stroke={getPairColor(q)}
                                strokeWidth="10"
                                strokeLinecap="round"
                            />
                        );
                    })}
                </svg>
            </div>

            <button
                className="mt-8 bg-blue-600 text-white px-6 py-2 rounded disabled:bg-gray-400"
                disabled={Object.keys(matchingPairs).length !== kiri.length || status !== "idle"}
                onClick={submitAnswer}
            >
                Kirim Pasangan
            </button>
            </>
        );
    }

    function renderQuestionByType() {
        switch (currentQuestion.tipe_pertanyaan) {
            case "multiple_choice_single":
                return renderMultipleChoiceSingle();
            case "multiple_choice_multi":
                return renderMultipleChoiceMulti();
            case "true_false":
                return renderTrueFalse();
            case "ordering":
                return renderOrdering();
            case "matching":
                return renderMatching();
            default:
                return <div>Tipe soal tidak dikenali</div>;
        }
    }

    /* ================= FINISHED ================= */
    if (quizFinished) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-blue-900 text-white">
                <div className="bg-white text-black rounded-2xl p-8 max-w-md text-center shadow-xl border border-gray-200">
                    <h1 className="text-2xl font-bold mb-4">🎉 Kuis Selesai!</h1>

                    {quizConfig.tampilkan_peringkat && (
                        <Leaderboard
                            leaderboard={leaderboard}
                            questionIndex={questionIndex}
                        />
                    )}
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
                ⏱ Sisa waktu: <b>{timeLeft}s</b>
            </div>

            <h2 className="text-white text-xl mb-6 text-center">
                {currentQuestion.pertanyaan}
            </h2>

            {renderQuestionByType()}

            {status === "result" && quizConfig.tampilkan_jawaban_benar && isCorrect !== null && (
                <div className={`mt-4 font-bold text-lg ${
                    isCorrect ? "text-green-300" : "text-red-300"
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
