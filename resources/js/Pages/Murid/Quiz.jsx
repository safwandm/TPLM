import { useEffect, useState } from "react";
import { API } from "../../lib/api";

export default function StudentQuiz() {
    const id = Number(window.location.pathname.split("/")[2]);
    const peserta = JSON.parse(localStorage.getItem("peserta"));

    const [answered, setAnswered] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState("running");
    const [question, setQuestion] = useState(null);
    const [endsAt, setEndsAt] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [finished, setFinished] = useState(false);
    const [error, setError] = useState("");

    /* ================================
       VALIDATE PESERTA
    ================================= */
    useEffect(() => {
        if (!peserta || peserta.session_id !== id) {
            window.location.href = "/";
        }
    }, [id]);

    /* ================================
       WEBSOCKET SUBSCRIPTION
    ================================= */
    useEffect(() => {
        const channel = window.Echo.channel(`sesi.${id}`);

        channel
            .listen(".QuestionStarted", (e) => {
                setQuestion(e);
                setEndsAt(e.ends_at);
                setAnswered(false);
                setSubmitting(false);
                setShowLeaderboard(false);
            })
        

            .listen(".QuestionEnded", () => {
                console.log("QuestionEnded");
                setQuestion(null);
                setEndsAt(null);
                setShowLeaderboard(true); // tampilkan leaderboard
            })

            .listen(".LeaderboardUpdated", (e) => {
                console.log("LeaderboardUpdated", e);
                setLeaderboard(e.leaderboard);
            })

            .listen(".SessionFinished", () => {
                console.log("SessionFinished");
                setFinished(true);
                setShowLeaderboard(true);
            });

        return () => {
            window.Echo.leave(`sesi.${id}`);
        };
    }, [id]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center text-red-600">
                {error}
            </div>
        );
    }

    async function submitAnswer(jawaban) {
        if (answered || submitting) return;
    
        setSubmitting(true);
    
        try {
            const res = await fetch(
                API.session.submitAnswer(id, question.pertanyaan_id),
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({
                        peserta_id: peserta.id,
                        pertanyaan_id: question.pertanyaan_id,
                        jawaban: jawaban,
                    }),
                }
            );
    
            if (!res.ok) {
                throw new Error("Gagal mengirim jawaban");
            }
    
            setAnswered(true);
        } catch (err) {
            console.error(err);
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    }
    

    /* ================================
       UI
    ================================= */
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-xl w-full">

                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    {finished ? "Kuis Selesai" : "Kuis Sedang Berlangsung"}
                </h1>

                <p className="text-gray-600 mb-6">
                    Peserta: <b>{peserta.nama}</b>
                </p>

                {/* ================= SOAL ================= */}
                {!question && !showLeaderboard && (
                    <div className="p-6 border rounded bg-gray-50 text-center text-gray-500">
                        ⏳ Menunggu soal berikutnya...
                    </div>
                )}

                {question && (
                    <div className="space-y-4">
                        <h2 className="font-semibold text-lg">
                            {question.pertanyaan}
                        </h2>

                        {question.url_gambar && (
                            <img
                                src={question.url_gambar}
                                alt="Soal"
                                className="mx-auto max-h-48"
                            />
                        )}

                        <div className="space-y-2">
                            {Object.entries(question.opsi).map(([key, val]) => (
                                <button
                                    key={key}
                                    disabled={answered}
                                    onClick={() => submitAnswer(key)}
                                    className={`w-full border rounded px-4 py-2
                                        ${answered
                                            ? "bg-gray-200 cursor-not-allowed"
                                            : "hover:bg-blue-50"}
                                    `}
                                >
                                    {key.toUpperCase()}. {val}
                                </button>
                            ))}
                        </div>

                        {answered && (
                            <p className="text-center text-green-600 text-sm">
                                ✅ Jawaban terkirim
                            </p>
                        )}

                        <p className="text-sm text-gray-500 text-center">
                            ⏱ Berakhir pada:{" "}
                            {endsAt && new Date(endsAt).toLocaleTimeString()}
                        </p>
                    </div>
                )}

                {/* ================= LEADERBOARD ================= */}
                {showLeaderboard && (
                    <div className="mt-6">
                        <h2 className="font-semibold text-lg mb-2 text-center">
                            🏆 Leaderboard
                        </h2>

                        <ul className="border rounded divide-y">
                            {leaderboard.length === 0 && (
                                <li className="p-3 text-center text-gray-500">
                                    Belum ada data
                                </li>
                            )}

                            {leaderboard.map((l, i) => (
                                <li
                                    key={i}
                                    className="flex justify-between p-3 text-sm"
                                >
                                    <span>
                                        {i + 1}. {l.nama}
                                    </span>
                                    <span className="font-semibold">
                                        {l.skor}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        {finished && (
                            <div className="text-center mt-4 text-green-600 font-semibold">
                                ✅ Terima kasih telah mengikuti kuis
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
