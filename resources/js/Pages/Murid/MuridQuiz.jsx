import { useEffect, useState } from "react";
import webFetch from "@/lib/webFetch";
import { WebAPI } from "@/lib/api.web";

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


    /* ================= SAFETY ================= */
    useEffect(() => {
        if (!peserta || !sessionId) {
            window.location.href = "/";
        }
    }, []);

    /* ================= SOCKET ================= */
    useEffect(() => {

        async function fetchConfig() {
            try {
                const res = await webFetch(
                    WebAPI.session.getConfig(sessionId)
                );

                const data = await res.json();
                console.log("Fetched quiz config:", data);

                setQuizConfig(data);

                console.log("Loaded quiz config:", data);
            } catch (err) {
                console.error("Failed to load quiz config", err);
            }
        }

        fetchConfig();

        const channel = window.Echo.channel(`sesi.${sessionId}`);

        channel

            .listenToAll((event, data) => {
                console.log("EVENT:", event, data);
            })
            .listen(".QuestionStarted", (e) => {
                setCurrentQuestion({
                    pertanyaan_id: e.pertanyaan_id,
                    pertanyaan: e.pertanyaan,
                    opsi: e.opsi,
                    jawaban_benar: e.jawaban_benar ?? null,
                });

                setQuestionIndex((p) => p + 1);
                resetState();
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

        return () => {
            window.Echo.leave(`sesi.${sessionId}`);
        };
    }, [sessionId]);

    /* ================= HELPERS ================= */
    function resetState() {
        setStatus("idle");
        setSelectedAnswer(null);
        setCorrectAnswer(null);
        setIsCorrect(null);
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
    async function handleAnswer(choice) {
        if (status !== "idle") return;

        setSelectedAnswer(choice);
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
                        jawaban: choice,
                    }),
                }
            );

            const data = await res.json();
            if (!res.ok) throw data;

            if (quizConfig.tampilkan_jawaban_benar) {
                setIsCorrect(data.jawaban.is_benar);
                setCorrectAnswer(
                    data.jawaban.is_benar
                        ? choice
                        : currentQuestion.jawaban_benar
                );
            }

            setStatus("result");
        } catch (err) {
            console.error("Submit error", err);
        }
    }

    /* ================= UI HELPERS ================= */
    function getOptionClass(key) {
        const base = {
            a: "bg-red-500",
            b: "bg-blue-500",
            c: "bg-orange-500",
            d: "bg-purple-500",
        }[key];

        if (status === "idle") return base;

        if (status === "answered") {
            return key === selectedAnswer
                ? `${base} opacity-80`
                : `${base} opacity-40`;
        }

        if (status === "result") {
            if (!quizConfig.tampilkan_jawaban_benar) {
                return key === selectedAnswer
                    ? `${base} opacity-80`
                    : `${base} opacity-40`;
            }

            if (key === correctAnswer) return "bg-green-600";
            if (key === selectedAnswer && !isCorrect)
                return "bg-red-600";

            return "bg-gray-400 opacity-40";
        }

        return base;
    }

    /* ================= FINISHED ================= */
    if (quizFinished) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-blue-900 text-white">
                <div className="bg-white text-black rounded-xl p-8 w-full max-w-md text-center">
                    <h1 className="text-2xl font-bold mb-4">
                        🎉 Kuis Selesai!
                    </h1>

                    {quizConfig.tampilkan_peringkat && (
                        <>
                            <div className="text-5xl font-bold text-blue-600 my-4">
                                {finalScore}
                            </div>
                            <p className="text-gray-500 mb-4">
                                Skor Akhir Anda
                            </p>

                            <div className="mt-6 text-left">
                                <h3 className="font-bold mb-2">
                                    Leaderboard
                                </h3>
                                <ul className="space-y-1">
                                    {leaderboard.map((p, i) => (
                                        <li
                                            key={i}
                                            className="flex justify-between"
                                        >
                                            <span>
                                                {i + 1}. {p.nama}
                                            </span>
                                            <span>{p.total_skor}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </>
                    )}

                    <button
                        className="mt-6 bg-blue-600 text-white px-6 py-2 rounded"
                        onClick={() => (window.location.href = "/")}
                    >
                        Kembali ke Beranda
                    </button>
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

    /* ================= QUESTION UI ================= */
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-900 to-blue-700 p-4">
            <div className="bg-white rounded-full px-6 py-2 mb-6">
                Soal {questionIndex}
            </div>

            <h2 className="text-white text-xl mb-6 text-center">
                {currentQuestion.pertanyaan}
            </h2>

            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                {["a", "b", "c", "d"].map((key) => (
                    <button
                        key={key}
                        disabled={status !== "idle"}
                        onClick={() => handleAnswer(key)}
                        className={`h-36 rounded-xl text-white text-2xl font-bold ${getOptionClass(
                            key
                        )}`}
                    >
                        {key}. {currentQuestion.opsi[key]}
                    </button>
                ))}
            </div>

            {quizConfig.tampilkan_peringkat && leaderboard.length > 0 && (
                <div className="mt-8 w-full max-w-md bg-white rounded-xl p-4">
                    <h3 className="font-bold mb-2">Leaderboard</h3>
                    <ul className="space-y-1">
                        {leaderboard.slice(0, 5).map((p, i) => (
                            <li
                                key={i}
                                className="flex justify-between text-sm"
                            >
                                <span>
                                    {i + 1}. {p.nama}
                                </span>
                                <span>{p.total_skor}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
