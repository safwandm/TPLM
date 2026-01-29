import { useEffect, useState } from "react";
import ProtectedLayout from "@/Layouts/ProtectedLayout";
import { FaPlay } from "react-icons/fa";
import { WebAPI } from "@/lib/api.web";
import webFetch from "@/lib/webFetch";

export default function GuruQuiz() {
    const id = Number(window.location.pathname.split("/")[2]);

    const [sesi, setSesi] = useState(null);
    const [status, setStatus] = useState("waiting");
    const [participants, setParticipants] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [starting, setStarting] = useState(false);
    const [questionIndex, setQuestionIndex] = useState(0);

    /* ================= SOCKET ================= */
    useEffect(() => {
        const channel = window.Echo.channel(`sesi.${id}`);


        // Logging for debugging purposes
        console.log("Listening to channel:", `sesi.${id}`);
        console.log("Current status:", status);
        console.log("channel:", channel);

        channel
            .listenToAll((event, data) => {
                console.log("EVENT:", event, data);
            })

            .listen(".ParticipantsUpdated", e => {
                setParticipants(e.peserta);
            })

            .listen(".QuizStarting", () => {
                setStatus("starting");
                setCurrentQuestion(null);
            })

            .listen(".QuestionStarted", e => {
                setStatus("running");
                setQuestionIndex(prev => prev + 1);

                setCurrentQuestion({
                    id: e.pertanyaan?.id ?? e.pertanyaan_id,
                    text: e.pertanyaan?.teks ?? e.pertanyaan?.pertanyaan,
                    endsAt: e.ends_at,
                });
            })

            .listen(".QuestionEnded", () => {
                setCurrentQuestion(null);
            })

            .listen(".LeaderboardUpdated", e => {
                if (Array.isArray(e.leaderboard)) {
                    setLeaderboard(e.leaderboard);
                }
            })

            .listen(".SessionFinished", () => {
                setStatus("finished");
                setCurrentQuestion(null);
            });

        return () => {
            window.Echo.leave(`sesi.${id}`);
        };
    }, [id]);

    /* ================= FETCH INITIAL ================= */
    useEffect(() => {
        const res = webFetch(WebAPI.session.detail(id), {
            headers: {
                "X-XSRF-TOKEN": getCsrfToken(),
            },
        })
            .then(res => res.json())
            .then(json => {
                setSesi(json);
                setStatus(json.status);
                setParticipants(json.pesertas?.map(p => p.nama) || []);
                setLeaderboard(json.pesertas || []);
            });

            console.log("Fetched initial session data:", res);

    }, [id]);

    /* ================= ACTION ================= */

    function getCsrfToken() {
        return decodeURIComponent(
            document.cookie
                .split("; ")
                .find(row => row.startsWith("XSRF-TOKEN="))
                ?.split("=")[1] ?? ""
        );
    }

    async function handleStartQuiz() {
        setStarting(true);

        try {
            const res = await webFetch(WebAPI.session.start(id), {
                method: "POST",
                headers: {
                    "X-XSRF-TOKEN": getCsrfToken(),
                },
            });

            if (!res.ok) throw new Error("Gagal memulai kuis");
        } catch (err) {
            alert(err.message);
        } finally {
            setStarting(false);
        }
    }

    /* ================= UI ================= */
    return (
        <ProtectedLayout allowedRoles={["teacher"]}>
            <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full">

                    <div className="flex justify-between mb-6">
                        <button
                            onClick={() => window.location.href = "/dashboard"}
                            className="text-blue-700"
                        >
                            ← Kembali
                        </button>

                    </div>

                    <h1 className="text-2xl font-bold mb-4">Kontrol Kuis</h1>

                    <div className="bg-blue-50 border rounded p-4 mb-4">
                        <p>Kode: <b>{sesi?.kode}</b></p>
                        <p>Status: <b>{status}</b></p>
                        <p>Peserta: <b>{participants.length}</b></p>
                    </div>

                    {/* WAITING */}
                    {status === "waiting" && (
                        <>
                            <h2 className="font-semibold mb-2">Daftar Peserta</h2>
                            <ul className="border rounded p-3 max-h-40 overflow-y-auto">
                                {participants.map((name, idx) => (
                                    <li key={idx}>• {name}</li>
                                ))}
                            </ul>

                            <div className="text-center mt-6">
                                <button
                                    onClick={handleStartQuiz}
                                    disabled={starting}
                                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg text-lg ${starting
                                        ? "bg-gray-400"
                                        : "bg-green-600 hover:bg-green-700 text-white"
                                        }`}
                                >
                                    <FaPlay />
                                    {starting ? "Memulai..." : "Mulai Kuis"}
                                </button>
                            </div>
                        </>
                    )}

                    {/* STARTING */}
                    {status === "starting" && (
                        <div className="text-center mt-6 font-semibold">
                            ⏳ Kuis akan dimulai...
                        </div>
                    )}

                    {/* RUNNING */}
                    {status === "running" && (
                        <>
                            <div className="mt-6 p-4 border rounded bg-gray-50 text-center">
                                {currentQuestion ? (
                                    <>
                                        <p className="text-sm text-gray-500 mb-1">
                                            Soal ke-{questionIndex}
                                        </p>
                                        <p className="font-semibold mb-2">Soal Aktif</p>
                                        <p>{currentQuestion.text}</p>
                                    </>
                                ) : (
                                    <p>⏳ Transisi antar soal</p>
                                )}
                            </div>

                            <Leaderboard leaderboard={leaderboard} />
                        </>
                    )}

                    {/* FINISHED */}
                    {status === "finished" && (
                        <>
                            <div className="text-center mt-6 font-semibold mb-4">
                                ✅ Kuis Telah Selesai
                            </div>
                            <Leaderboard leaderboard={leaderboard} />
                        </>
                    )}
                </div>
            </div>
        </ProtectedLayout>
    );
}

/* ================= LEADERBOARD COMPONENT ================= */
function Leaderboard({ leaderboard }) {
    if (!leaderboard.length) {
        return <p className="text-center text-gray-500">Belum ada skor</p>;
    }

    return (
        <div className="mt-6">
            <h3 className="font-semibold mb-2">Leaderboard</h3>
            <ul className="border rounded p-3">
                {leaderboard.map((l, i) => (
                    <li key={l.id ?? i}>
                        {i + 1}. {l.nama} — {l.total_skor}
                    </li>
                ))}
            </ul>
        </div>
    );
}
