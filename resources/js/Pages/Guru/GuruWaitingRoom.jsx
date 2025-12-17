import { useEffect, useState } from "react";
import ProtectedLayout from "@/Layouts/ProtectedLayout";
import { FaPlay } from "react-icons/fa";
import { API } from "@/lib/api";

export default function TeacherQuiz() {
    const id = Number(window.location.pathname.split("/")[2]);

    const [sesi, setSesi] = useState(null);
    const [status, setStatus] = useState("waiting"); // waiting | starting | running | finished
    const [participants, setParticipants] = useState([]); // array of names
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [starting, setStarting] = useState(false);
    const [questionIndex, setQuestionIndex] = useState(0);

    /* ================================
       WEBSOCKET SUBSCRIPTION
    ================================= */
    useEffect(() => {
        console.log("Teacher subscribing to sesi." + id);

        const channel = window.Echo.channel(`sesi.${id}`)

            /* ================= PESERTA ================= */
            .listen(".ParticipantsUpdated", e => {
                console.log("ParticipantsUpdated", e);

                setParticipants(e.peserta); // array of names
            })

            /* ================= QUIZ FLOW ================= */
            .listen(".QuizStarting", e => {
                console.log("QuizStarting", e);
                setStatus("starting");
                setCurrentQuestion(null);
                setQuestionIndex(0);
            })

            .listen(".QuestionStarted", e => {
                console.log("QuestionStarted", e);
                setStatus("running");
                setQuestionIndex(prev => prev + 1);
                setCurrentQuestion({
                    id: e.pertanyaan?.id ?? e.pertanyaan_id,
                    text: e.pertanyaan?.teks ?? e.pertanyaan?.pertanyaan,
                    endsAt: e.ends_at,
                });
            })

            .listen(".QuestionEnded", () => {
                console.log("QuestionEnded");
                setCurrentQuestion(null);
            })

            /* ================= LEADERBOARD ================= */
            .listen(".LeaderboardUpdated", e => {
                console.log("LeaderboardUpdated", e);
                setLeaderboard(e.leaderboard || []);
            })

            /* ================= FINISH ================= */
            .listen(".SessionFinished", () => {
                console.log("SessionFinished");
                setStatus("finished");
                setCurrentQuestion(null);
            });

        channel.subscribed(() => {
            console.log("✅ SUBSCRIBED to", channel);
        });

        // console.log("Subscribed to sesi." + channel.name);

        return () => {
            window.Echo.leave(`sesi.${id}`);
        };
    }, [id]);

    /* ================================
       FETCH INITIAL DATA
    ================================= */
    useEffect(() => {
        const token = localStorage.getItem("auth_token");
        fetch(API.session.detail(id), {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
        })
            .then(res => res.json())
            .then(json => {
                setSesi(json);
                setStatus(json.status);
                setParticipants(json.pesertas?.map(p => p.nama) || []);
                setLeaderboard(json.pesertas || []);
            });
    }, [id]);

    /* ================================
       ACTION
    ================================= */
    async function handleStartQuiz() {
        const token = localStorage.getItem("auth_token");
        setStarting(true);

        try {
            const res = await fetch(API.session.start(id), {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

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

                    <h1 className="text-2xl font-bold mb-4">Kontrol Kuis</h1>

                    <div className="bg-blue-50 border rounded p-4 mb-4">
                        <p>Kode: <b>{sesi?.kode}</b></p>
                        <p>Status: <b>{status}</b></p>
                        <p>Peserta: <b>{participants.length}</b></p>
                    </div>

                    {/* ================= WAITING ================= */}
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
                                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg text-lg ${starting ? "bg-gray-400" : "bg-green-600 hover:bg-green-700 text-white"}`}
                                >
                                    <FaPlay />
                                    {starting ? "Memulai..." : "Mulai Kuis"}
                                </button>
                            </div>
                        </>
                    )}

                    {/* ================= STARTING ================= */}
                    {status === "starting" && (
                        <div className="text-center mt-6 font-semibold">
                            ⏳ Kuis akan dimulai...
                        </div>
                    )}

                    {/* ================= RUNNING ================= */}
                    {status === "running" && (
                        <>
                            <div className="mt-6 p-4 border rounded bg-gray-50 text-center">
                                {currentQuestion ? (
                                    <>
                                        <p className="text-sm text-gray-500 mb-1">Soal ke-{questionIndex}</p>
                                        <p className="font-semibold mb-2">Soal Aktif</p>
                                        <p>{currentQuestion.text}</p>
                                    </>
                                ) : (
                                    <p>⏳ Transisi antar soal</p>
                                )}
                            </div>

                            <div className="mt-6">
                                <h3 className="font-semibold mb-2">Leaderboard</h3>
                                <ul className="border rounded p-3">
                                    {leaderboard.map((l, i) => (
                                        <li key={i}>{i + 1}. {l.nama} — {l.total_skor}</li>
                                    ))}
                                </ul>
                            </div>
                        </>
                    )}

                    {/* ================= FINISHED ================= */}
                    {status === "finished" && (
                        <div className="text-center mt-6 font-semibold">✅ Kuis Telah Selesai</div>
                    )}
                </div>
            </div>
        </ProtectedLayout>
    );
}