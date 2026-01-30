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
    const [correctAnswer, setCorrectAnswer] = useState(null);
    const [isCorrect, setIsCorrect] = useState(null);

    const [leaderboard, setLeaderboard] = useState([]);
    const [quizFinished, setQuizFinished] = useState(false);
    const [finalScore, setFinalScore] = useState(0);

    const [quizConfig, setQuizConfig] = useState({
        tampilkan_jawaban_benar: false,
        tampilkan_peringkat: false,
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

            // set HP awal hanya sekali
            if (config.mode === "game" && hp === null) {
                setHp(config.hp_awal);
            }
        }

        fetchConfig();

        const channel = window.Echo.channel(`sesi.${sessionId}`);

        channel
            .listen(".QuestionStarted", (e) => {
                setCurrentQuestion(e);
                setQuestionIndex((p) => p + 1);
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
                const latestPeserta = JSON.parse(
                    localStorage.getItem("peserta")
                );
                setFinalScore(latestPeserta?.total_skor ?? 0);
                setQuizFinished(true);
                setCurrentQuestion(null);
            });

        return () => window.Echo.leave(`sesi.${sessionId}`);
    }, [sessionId]);

    /* ================= TIMER EFFECT ================= */
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) return;

        const t = setInterval(() => {
            setTimeLeft((p) => {
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
        if (
            !quizConfig ||
            quizConfig.mode !== "game" ||
            hp === null ||
            hp <= 0
        ) return;

        // waktu habis & belum menjawab
        if (
            timeLeft === 0 &&
            status === "idle" &&
            !timeoutPenaltyApplied
        ) {
            setHp(prev => Math.max(0, prev - 1));
            setTimeoutPenaltyApplied(true);

            // update localStorage biar konsisten
            const latestPeserta = JSON.parse(
                localStorage.getItem("peserta")
            );

            if (latestPeserta) {
                latestPeserta.hp_sisa = Math.max(
                    0,
                    (latestPeserta.hp_sisa ?? hp) - 1
                );
                localStorage.setItem(
                    "peserta",
                    JSON.stringify(latestPeserta)
                );
            }
        }
    }, [timeLeft, status, quizConfig.mode]);

    /* ================= HELPERS ================= */
    function resetState() {
        setStatus("idle");
        setSelectedAnswer(null);
        setCorrectAnswer(null);
        setIsCorrect(null);
        setTimeoutPenaltyApplied(false);
    }

    function getCsrfToken() {
        return decodeURIComponent(
            document.cookie
                .split("; ")
                .find((row) => row.startsWith("XSRF-TOKEN="))
                ?.split("=")[1] ?? ""
        );
    }

    /* ================= SUBMIT ================= */
    async function submitAnswer() {
        if (status !== "idle" || timeLeft === 0) return;

        if (
            status !== "idle" ||
            timeLeft === 0 ||
            (isGameMode && hp <= 0)
        ) return;

        setStatus("answered");

        try {
            const res = await webFetch(
                WebAPI.session.submitAnswer(
                    sessionId,
                    currentQuestion.pertanyaan_id
                ),
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
                setIsCorrect(data.jawaban.is_benar);
                setCorrectAnswer(currentQuestion.jawaban_benar);
            }

            if (isGameMode && typeof data.hp_sisa === "number") {
                setHp(data.hp_sisa);

                // simpan juga ke localStorage biar konsisten
                const latestPeserta = {
                    ...peserta,
                    hp_sisa: data.hp_sisa,
                };
                localStorage.setItem("peserta", JSON.stringify(latestPeserta));
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
            setSelectedAnswer((prev) => {
                prev = prev ?? []
                return prev.includes(i)
                    ? prev.filter((x) => x !== i)
                    : [...prev, i]
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
                    disabled={status !== "idle"}
                    onClick={() => submitAnswer(selectedAnswer ?? [])}
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
                    {[true, false].map((v) => (
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
        // fallback: kalau selectedAnswer kosong, pakai urutan default
        const order =
            selectedAnswer && selectedAnswer.length > 0
                ? selectedAnswer
                : currentQuestion.opsi.map((_, i) => i);

        const moveUp = (idx) => {
            setSelectedAnswer((prev) => {
                const arr =
                    prev && prev.length > 0
                        ? [...prev]
                        : currentQuestion.opsi.map((_, i) => i);

                [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                return arr;
            });
        };

        const moveDown = (idx) => {
            setSelectedAnswer((prev) => {
                const arr =
                    prev && prev.length > 0
                        ? [...prev]
                        : currentQuestion.opsi.map((_, i) => i);

                [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
                return arr;
            });
        };

        return (
            <div className="space-y-2">
                {order.map((optIndex, idx) => (
                    <div
                        key={optIndex}
                        className="flex items-center justify-between bg-gray-200 p-3 rounded"
                    >
                        {/* Isi opsi */}
                        <div className="flex items-center gap-3">
                            <span className="font-semibold w-6">
                                {idx + 1}.
                            </span>
                            <span>{currentQuestion.opsi[optIndex]}</span>
                        </div>

                        {/* Tombol naik / turun */}
                        <div className="flex flex-col gap-1">
                            {idx > 0 && (
                                <button
                                    disabled={status !== "idle"}
                                    onClick={() => moveUp(idx)}
                                    className="px-2 py-1 bg-gray-400 rounded disabled:opacity-50"
                                >
                                    ↑
                                </button>
                            )}

                            {idx < order.length - 1 && (
                                <button
                                    disabled={status !== "idle"}
                                    onClick={() => moveDown(idx)}
                                    className="px-2 py-1 bg-gray-400 rounded disabled:opacity-50"
                                >
                                    ↓
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                <button
                    className="mt-4 bg-blue-600 text-white px-6 py-2 rounded"
                    onClick={() => submitAnswer(order)}
                >
                    Kirim Urutan
                </button>
            </div>
        );
    }

    function renderMatching() {
        const kiri = currentQuestion.opsi.kiri;
        const kanan = currentQuestion.opsi.kanan;

        return (
            <div className="space-y-3">
                {kiri.map((k, i) => (
                    <div key={i} className="flex gap-2 items-center">
                        <div className="flex-1 bg-gray-200 p-2 rounded">
                            {k}
                        </div>
                        <select
                            disabled={status !== "idle"}
                            onChange={(e) =>
                                setSelectedAnswer((prev = {}) => ({
                                    ...prev,
                                    [i]: Number(e.target.value),
                                }))
                            }
                            className="p-2 rounded"
                        >
                            <option value="">Pilih</option>
                            {kanan.map((j, idx) => (
                                <option key={idx} value={idx}>
                                    {j}
                                </option>
                            ))}
                        </select>
                    </div>
                ))}

                <button
                    className="mt-4 bg-blue-600 text-white px-6 py-2 rounded"
                    onClick={() => submitAnswer(selectedAnswer ?? {})}
                >
                    Kirim Pasangan
                </button>
            </div>
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
                <div className="bg-white text-black rounded-xl p-8 w-full max-w-md text-center">
                    <h1 className="text-2xl font-bold mb-4">🎉 Kuis Selesai!</h1>

                    {quizConfig.tampilkan_peringkat && (
                        <>
                            <div className="text-5xl font-bold text-blue-600 my-4">
                                {finalScore}
                            </div>
                            <p className="text-gray-500 mb-4">
                                Skor Akhir Anda
                            </p>

                            <div className="mt-6 text-left">
                                {/* <h3 className="font-bold mb-2">
                                    Leaderboard
                                </h3> */}
                                {/* <ul className="space-y-1">
                                    {leaderboard.map((p, i) => (
                                        <li
                                            key={i}
                                            className="flex justify-between"
                                        >
                                            <span>
                                                {i + 1}. {p.nama}
                                            </span>
                                            <span>
                                                {p.total_correctness}/{questionIndex}
                                                {p.total_skor}
                                                {quizConfig.mode === "game" && ` ❤️ ${p.hp_sisa}`}
                                            </span>
                                        </li>
                                    ))}
                                </ul> */}
                                <Leaderboard leaderboard={leaderboard} questionIndex={questionIndex} />
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    /* ================= WAITING ================= */
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

            {isGameMode && hp <= 0 && (
                <div className="mt-4 bg-red-600 text-white px-4 py-2 rounded">
                    💀 HP kamu habis, kamu tidak bisa lagi menjawab soal
                </div>
            )}


            <div className="text-white mb-4">
                ⏱ Sisa waktu: <b>{timeLeft}s</b>
            </div>

            {isGameMode && timeLeft === 0 && status === "idle" && (
                <div className="mt-4 text-yellow-300 font-semibold">
                    Waktu habis — HP berkurang
                </div>
            )}


            <h2 className="text-white text-xl mb-6 text-center">
                {currentQuestion.pertanyaan}
            </h2>

            {renderQuestionByType()}

            {status !== "idle" && (
                <div className="mt-4 text-white">
                    ✅ Jawaban terkirim
                </div>
            )}

            {quizConfig.tampilkan_peringkat && leaderboard.length > 0 && (
                <div className="mt-8 w-full max-w-md bg-white rounded-xl p-4">
                    {/* <h3 className="font-bold mb-2">Leaderboard</h3>
                    <ul className="space-y-1">
                        {leaderboard.slice(0, 5).map((p, i) => (
                            <li className="flex justify-between text-sm">
                                <span>{i + 1}. {p.nama}</span>
                                <span>
                                    {p.total_correctness}/{questionIndex}
                                    {p.total_skor}
                                    {isGameMode && ` ❤️ ${p.hp_sisa}`}
                                </span>
                            </li>
                        ))}
                    </ul> */}
                    <Leaderboard leaderboard={leaderboard} questionIndex={questionIndex} />
                </div>
                
            )}
        </div>
    );
}
