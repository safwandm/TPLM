import { useEffect, useState } from "react";
import webFetch from "@/lib/webFetch";
import { WebAPI } from "@/lib/api.web";
import Leaderboard from "../../Components/Leaderboard";

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

    /* ================= SAFETY ================= */
    useEffect(() => {
        if (!peserta || !sessionId) {
            window.location.href = "/";
        }
    }, []);

    /* ================= SOCKET ================= */
    useEffect(() => {
        async function fetchConfig() {
            const res = await webFetch(WebAPI.session.getConfig(sessionId));
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
                setCurrentQuestion(e);
                setQuestionIndex(p => p + 1);
                resetState();

                if (e.ends_at) {
                    const end = new Date(e.ends_at).getTime();
                    setTimeLeft(Math.max(0, Math.floor((end - Date.now()) / 1000)));
                }
            })
            .listen(".LeaderboardUpdated", (e) => {
                setLeaderboard(e.leaderboard);
            })
            .listen(".SessionFinished", () => {
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

    /* ================= HELPERS ================= */
    function resetState() {
        setStatus("idle");
        setSelectedAnswer(null);
        setIsCorrect(null);
        setTimeoutPenaltyApplied(false);
    }

    function getCsrfToken() {
        return decodeURIComponent(
            document.cookie
                .split("; ")
                .find(r => r.startsWith("XSRF-TOKEN="))
                ?.split("=")[1] ?? ""
        );
    }

    /* ================= SUBMIT ================= */
    async function submitAnswer() {
        if (status !== "idle" || timeLeft === 0) return;
        if (isGameMode && hp <= 0) return;

        setStatus("answered");

        try {
            const res = await webFetch(
                WebAPI.session.submitAnswer(sessionId, currentQuestion.pertanyaan_id),
                {
                    method: "POST",
                    headers: {
                        "X-XSRF-TOKEN": getCsrfToken(),
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        peserta_id: peserta.id,
                        pertanyaan_id: currentQuestion.pertanyaan_id,
                        jawaban: selectedAnswer,
                    }),
                }
            );

            const data = await res.json();
            if (!res.ok) throw data;

            if (quizConfig.tampilkan_jawaban_benar) {
                setIsCorrect(data.jawaban?.is_benar ?? null);
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
            console.error(err);
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

        const swap = (a, b) => {
            const arr = [...order];
            [arr[a], arr[b]] = [arr[b], arr[a]];
            setSelectedAnswer(arr);
        };

        return (
            <>
                <div className="space-y-2">
                    {order.map((idx, i) => (
                        <div key={idx} className="flex justify-between bg-gray-200 p-3 rounded">
                            <span>{i + 1}. {currentQuestion.opsi[idx]}</span>
                            <div className="flex gap-1">
                                {i > 0 && (
                                    <button onClick={() => swap(i, i - 1)}>↑</button>
                                )}
                                {i < order.length - 1 && (
                                    <button onClick={() => swap(i, i + 1)}>↓</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    className="mt-4 bg-blue-600 text-white px-6 py-2 rounded"
                    onClick={submitAnswer}
                >
                    Kirim Urutan
                </button>
            </>
        );
    }

    function renderMatching() {
        const kiri = currentQuestion.opsi.kiri;
        const kanan = currentQuestion.opsi.kanan;

        return (
            <>
                <div className="space-y-3">
                    {kiri.map((k, i) => (
                        <div key={i} className="flex gap-2 items-center">
                            <div className="flex-1 bg-gray-200 p-2 rounded">{k}</div>
                            <select
                                disabled={status !== "idle"}
                                onChange={e =>
                                    setSelectedAnswer(prev => ({
                                        ...(prev ?? {}),
                                        [i]: Number(e.target.value),
                                    }))
                                }
                                className="p-2 rounded"
                            >
                                <option value="">Pilih</option>
                                {kanan.map((j, idx) => (
                                    <option key={idx} value={idx}>{j}</option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>

                <button
                    className="mt-4 bg-blue-600 text-white px-6 py-2 rounded"
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
                <div className="bg-white text-black rounded-xl p-8 max-w-md text-center">
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

            {status !== "idle" && (
                <div className="mt-4 text-white">✅ Jawaban terkirim</div>
            )}
        </div>
    );
}
