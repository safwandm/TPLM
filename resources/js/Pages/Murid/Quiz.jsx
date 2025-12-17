import { useEffect, useState } from "react";
// import "./echo";

export default function StudentQuiz() {
    const id = Number(window.location.pathname.split("/")[2]);
    const peserta = JSON.parse(localStorage.getItem("peserta"));

    const [status, setStatus] = useState("running");
    const [question, setQuestion] = useState(null);
    const [endsAt, setEndsAt] = useState(null);
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
    // useEffect(() => {
    //     const channel = window.Echo.channel(`sesi.${id}`);

    //     channel
    //         .listen(".QuestionStarted", (e) => {
    //             setQuestion(e);
    //             setEndsAt(e.ends_at);
    //         })
    //         .listen(".QuestionEnded", () => {
    //             setQuestion(null);
    //             setEndsAt(null);
    //         })
    //         .listen(".SessionFinished", () => {
    //             window.location.href = "/";
    //         });

    //     return () => {
    //         window.Echo.leave(`sesi.${id}`);
    //     };
    // }, [id]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center text-red-600">
                {error}
            </div>
        );
    }

    /* ================================
       UI
    ================================= */
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-xl w-full">

                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    Kuis Sedang Berlangsung
                </h1>

                <p className="text-gray-600 mb-6">
                    Peserta: <b>{peserta.nama}</b>
                </p>

                {!question && (
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
                                    className="w-full border rounded px-4 py-2 hover:bg-blue-50"
                                >
                                    {key.toUpperCase()}. {val}
                                </button>
                            ))}
                        </div>

                        <p className="text-sm text-gray-500 text-center">
                            ⏱ Berakhir pada: {new Date(endsAt).toLocaleTimeString()}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
