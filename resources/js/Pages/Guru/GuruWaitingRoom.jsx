import { useEffect, useState } from "react";
import ProtectedLayout from "@/Layouts/ProtectedLayout";
import { FaPlay } from "react-icons/fa";

export default function TeacherQuiz() {
    const id = Number(window.location.pathname.split("/")[2]);

    const [sesi, setSesi] = useState({});
    const [status, setStatus] = useState("waiting");
    const [participants, setParticipants] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [starting, setStarting] = useState(false);

    /* ================================
       WEBSOCKET SUBSCRIPTION
    ================================= */
    useEffect(() => {
        const channel = window.Echo.channel(`sesi.${id}`)
            /* ================= PESERTA ================= */
            .listen(".ParticipantsUpdated", e => {
                console.log("ParticipantsUpdated", e);
                setParticipants(e.peserta);
            })

            /* ================= QUIZ ================= */
            .listen(".QuizStarting", e => {
                console.log("QuizStarting", e);
                setStatus("running");
                setCurrentQuestion(null);
            })

            .listen(".QuestionStarted", e => {
                console.log("QuestionStarted", e);
                setStatus("running");
                setCurrentQuestion(e);
            })

            .listen(".QuestionEnded", e => {
                console.log("QuestionEnded", e);
                setCurrentQuestion(null);
            })

            /* ================= LEADERBOARD ================= */
            .listen(".LeaderboardUpdated", e => {
                console.log("LeaderboardUpdated", e);
                setLeaderboard(e.leaderboard);
            })

            /* ================= FINISH ================= */
            .listen(".SessionFinished", e => {
                console.log("SessionFinished", e);
                setStatus("finished");
                setCurrentQuestion(null);
            });

        /* cleanup */
        return () => {
            window.Echo.leave(`sesi.${id}`);
        };
    }, [id]);

    /* ================================
       FETCH INITIAL DATA
    ================================= */
    useEffect(() => {
        const token = localStorage.getItem("auth_token");
        fetch(`http://localhost:8001/api/sesi/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
        }).then(async res => {
            const json = await res.json();
            setSesi(json);
            setStatus(json.status);
            setLeaderboard(json.pesertas)
            setParticipants(json.pesertas.map(e => e.nama))
        });
    }, [id]);

    /* ================================
       ACTION
    ================================= */
    async function handleStartQuiz() {
        const token = localStorage.getItem("auth_token");
        setStarting(true);

        try {
            const res = await fetch(
                `http://localhost:8001/api/sesi/${id}/start`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                }
            );

            if (!res.ok) throw new Error("Gagal memulai kuis");
        } catch (err) {
            alert(err.message);
        } finally {
            setStarting(false);
        }
    }

    /* ================================
       UI
    ================================= */
    return (
        <ProtectedLayout allowedRoles={["teacher"]}>
            <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full">

                    <h1 className="text-2xl font-bold mb-4">
                        Kontrol Kuis
                    </h1>

                    <div className="bg-blue-50 border rounded p-4 mb-4">
                        <p>Kode: <b>{sesi.kode}</b></p>
                        <p>Status: <b>{status}</b></p>
                        <p>Peserta: <b>{participants.length}</b></p>
                    </div>

                    {/* ================= WAITING ================= */}
                    {status === "waiting" && (
                        <>
                            <h2 className="font-semibold mb-2">
                                Daftar Peserta
                            </h2>

                            <ul className="border rounded p-3 max-h-40 overflow-y-auto">
                                {participants.map(p => (
                                    <li key={p.id}>
                                        • {p}
                                    </li>
                                ))}
                            </ul>

                            <div className="text-center mt-6">
                                <button
                                    onClick={handleStartQuiz}
                                    disabled={starting}
                                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg text-lg
                                        ${starting
                                            ? "bg-gray-400"
                                            : "bg-green-600 hover:bg-green-700 text-white"}
                                    `}
                                >
                                    <FaPlay />
                                    {starting ? "Memulai..." : "Mulai Kuis"}
                                </button>
                            </div>
                        </>
                    )}

                    {/* ================= RUNNING ================= */}
                    {status === "running" && (
                        <>
                            <div className="mt-6 p-4 border rounded bg-gray-50 text-center">
                                {currentQuestion ? (
                                    <>
                                        <p className="font-semibold mb-2">
                                            Soal Aktif
                                        </p>
                                        <p>{currentQuestion.pertanyaan}</p>
                                    </>
                                ) : (
                                    <p>⏳ Transisi antar soal</p>
                                )}
                            </div>

                            {/* Leaderboard */}
                            <div className="mt-6">
                                <h3 className="font-semibold mb-2">
                                    Leaderboard
                                </h3>
                                <ul className="border rounded p-3">
                                    {leaderboard.map((l, i) => (
                                        <li key={i}>
                                            {i + 1}. {l.nama} — {l.skor}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </>
                    )}

                    {/* ================= FINISHED ================= */}
                    {status === "finished" && (
                        <div className="text-center mt-6 font-semibold">
                            ✅ Kuis Telah Selesai
                        </div>
                    )}

                </div>
            </div>
        </ProtectedLayout>
    );
}
