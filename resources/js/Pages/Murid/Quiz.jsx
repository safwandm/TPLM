import { useEffect, useState } from "react";
import { API } from "@/lib/api";

export default function StudentQuiz() {
    const peserta = JSON.parse(localStorage.getItem("peserta"));
    const sessionId = Number(window.location.pathname.split("/").pop());


    const [status, setStatus] = useState("idle");
    // idle | answered | result

    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [questionIndex, setQuestionIndex] = useState(0);

    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [correctAnswer, setCorrectAnswer] = useState(null);
    const [isCorrect, setIsCorrect] = useState(null);

    /* ================= SOCKET ================= */
    useEffect(() => {
        const channel = window.Echo.channel(`sesi.${sessionId}`)
            .listen(".QuestionStarted", (e) => {
                console.log("QuestionStarted", e);

                setCurrentQuestion({
                    pertanyaan_id: e.pertanyaan_id,
                    pertanyaan: e.pertanyaan,
                    opsi: e.opsi,
                    batas_waktu: e.batas_waktu,
                    ends_at: e.ends_at,
                    jawaban_benar: e.jawaban_benar ?? null,
                });

                setQuestionIndex((prev) => prev + 1);
                resetState();
            })
            .listen(".QuestionEnded", () => {
                console.log("QuestionEnded");
            })
            .listen(".SessionFinished", () => {
                console.log("SessionFinished");
                setCurrentQuestion(null);
            });

        return () => {
            window.Echo.leave(`sesi.${sessionId}`);
        };
    }, [sessionId]);

    console.log("PESERTA:", peserta);
    console.log("PESERTA ID:", peserta?.id, typeof peserta?.id);

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
                API.session.submitAnswer(sessionId, currentQuestion.pertanyaan_id),
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

            if (data.jawaban.is_benar) {
                setCorrectAnswer(choice);
            } else {
                setCorrectAnswer(currentQuestion.jawaban_benar);
            }

            setStatus("result");
        } catch (err) {
            console.error("Submit error", err);
        }
    }

    /* ================= COLOR ================= */
    function getOptionClass(key) {
        const base = {
            a: "bg-red-500",
            b: "bg-blue-500",
            c: "bg-orange-500",
            d: "bg-green-500",
        }[key];

        if (status === "idle") return base;

        if (status === "answered") {
            return key === selectedAnswer
                ? `${base} opacity-80`
                : `${base} opacity-40`;
        }

        if (status === "result") {
            if (key === correctAnswer) return "bg-green-600";
            if (key === selectedAnswer && !isCorrect) return "bg-red-600";
            return "bg-gray-500 opacity-40";
        }

        return base;
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
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-900 to-blue-700 p-4">
            {/* Header */}
            <div className="bg-white rounded-full px-6 py-2 mb-6">
                <span className="text-blue-700 font-semibold">
                    Soal {questionIndex}
                </span>
            </div>

            {/* Question */}
            <h2 className="text-white text-xl mb-6 text-center">
                {currentQuestion.pertanyaan}
            </h2>

            {/* Options */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                {["a", "b", "c", "d"].map((key) => (
                    <button
                        key={key}
                        onClick={() => handleAnswer(key)}
                        disabled={status !== "idle"}
                        className={`
                            h-36 rounded-xl text-white text-2xl font-bold
                            flex items-center justify-center relative
                            transition-all duration-300
                            ${getOptionClass(key)}
                        `}
                    >
                        {key}. {currentQuestion.opsi[key]}

                        {status === "result" &&
                            key === correctAnswer && (
                                <span className="absolute right-4 text-3xl">
                                    ✓
                                </span>
                            )}

                        {status === "result" &&
                            key === selectedAnswer &&
                            !isCorrect && (
                                <span className="absolute right-4 text-3xl">
                                    ✕
                                </span>
                            )}
                    </button>
                ))}
            </div>

            {/* Result */}
            {status === "result" && (
                <div
                    className={`mt-6 w-full max-w-md p-4 rounded-xl text-white text-center
                        ${isCorrect ? "bg-green-600" : "bg-red-600"}
                    `}
                >
                    <p className="text-xl font-bold">
                        {isCorrect ? "✓ Benar!" : "✕ Kurang Tepat 💪"}
                    </p>

                    {!isCorrect && (
                        <p className="text-sm mt-1">
                            Jawaban: {correctAnswer?.toUpperCase()}
                        </p>
                    )}

                    <button className="mt-3 bg-white text-black px-4 py-2 rounded font-semibold">
                        Lihat Peringkat 📊
                    </button>
                </div>
            )}
        </div>
    );
}
