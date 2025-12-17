import { useEffect, useState } from "react";
import ProtectedLayout from "@/Layouts/ProtectedLayout";
import { FaPlay } from "react-icons/fa";
// import echo from "@/lib/echo";
// import pusher from "@/lib/ws";


export default function TeacherQuiz() {
    const id = Number(window.location.pathname.split("/")[2]);

    const [status, setStatus] = useState("waiting");
    const [participants, setParticipants] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [starting, setStarting] = useState(false);

    /* ================================
       WEBSOCKET SUBSCRIPTION
    ================================= */
    // useEffect(() => {
    //     const channel = pusher.subscribe(`sesi.${id}`);

    //     channel.bind("ParticipantsUpdated", (e) => {
    //         console.log(e);
    //     });

    //     channel.bind("QuestionStarted", (e) => {
    //         console.log(e);
    //     });

    //     return () => {
    //         pusher.unsubscribe(`sesi.${id}`);
    //     };
    // }, [id]);

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

            if (!res.ok) {
                throw new Error("Gagal memulai kuis");
            }

            setStatus("running");
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
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-xl w-full">

                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        Kontrol Kuis
                    </h1>

                    <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
                        <p>Status: <b>{status}</b></p>
                        <p>Peserta: <b>{participants}</b></p>
                    </div>

                    {status === "waiting" && (
                        <div className="text-center mt-6">
                            <button
                                onClick={handleStartQuiz}
                                disabled={starting}
                                className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg text-lg
                                    ${starting
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-green-600 hover:bg-green-700 text-white"}
                                `}
                            >
                                <FaPlay />
                                {starting ? "Memulai..." : "Mulai Kuis"}
                            </button>
                        </div>
                    )}

                    {status === "running" && (
                        <div className="mt-6 p-4 border rounded bg-gray-50 text-center">
                            {currentQuestion ? (
                                <>
                                    <p className="font-medium">
                                        Soal aktif:
                                    </p>
                                    <p className="mt-2">
                                        {currentQuestion.pertanyaan}
                                    </p>
                                </>
                            ) : (
                                <p>⏳ Transisi antar soal</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </ProtectedLayout>
    );
}
