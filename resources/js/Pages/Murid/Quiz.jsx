import { useEffect, useState } from "react";
import { API } from "@/lib/api";

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

    /* ================= SAFETY ================= */
    useEffect(() => {
        if (!peserta || !sessionId) {
            window.location.href = "/";
        }
    }, []);

    /* ================= SOCKET ================= */
    useEffect(() => {
        const channel = window.Echo.channel(`sesi.${sessionId}`);

        channel
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
                if (Array.isArray(e.leaderboard)) {
                    setLeaderboard(e.leaderboard);
                }
            })

            .listen(".SessionFinished", (e) => {
                const finalBoard = Array.isArray(e.leaderboard)
                    ? e.leaderboard
                    : leaderboard;

                setLeaderboard(finalBoard);

                const me = finalBoard?.find(
                    (p) => Number(p.id) === Number(peserta.id)
                );

                setFinalScore(me?.total_skor ?? 0);
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

    /* ================= SUBMIT ================= */
    async function handleAnswer(choice) {
        if (status !== "idle") return;

        setSelectedAnswer(choice);
        setStatus("answered");

        try {
            const res = await fetch(
                API.session.submitAnswer(
                    sessionId,
                    currentQuestion.pertanyaan_id
                ),
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
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

            setIsCorrect(data.jawaban.is_benar);
            setCorrectAnswer(
                data.jawaban.is_benar
                    ? choice
                    : currentQuestion.jawaban_benar
            );

            setStatus("result");
        } catch (err) {
            console.error("Submit error", err);
        }
    }

    function getOptionClass(key) {
        const base = {
            a: "bg-red-500",
            b: "bg-blue-500",
            c: "bg-orange-500",
            d: "bg-green-500",
        }[key];

        if (status === "idle") return base;
        if (status === "answered")
            return key === selectedAnswer
                ? `${base} opacity-80`
                : `${base} opacity-40`;
        if (status === "result") {
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
                <div className="bg-white text-black rounded-xl p-8 text-center w-full max-w-md">
                    <h1 className="text-2xl font-bold mb-4">
                        🎉 Kuis Selesai!
                    </h1>

                    <p className="text-gray-600 mb-2">
                        Terima kasih sudah berpartisipasi
                    </p>

                    <div className="text-5xl font-bold text-blue-600 my-6">
                        {finalScore}
                    </div>

                    <p className="text-gray-500">Skor Akhir</p>

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
        </div>
    );
}
