import { useEffect, useState } from "react";

export default function WaitingRoom({ id }) {
    const peserta = JSON.parse(localStorage.getItem("peserta"));

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [sesi, setSesi] = useState(null);
    const [pesertaList, setPesertaList] = useState([]);

    /* ================================
       VALIDATE PESERTA
    ================================= */
    useEffect(() => {
        if (!peserta || peserta.session_id != id) {
            window.location.href = "/";
        }
    }, [id]);

    /* ================================
       INITIAL FETCH (1x SAJA)
    ================================= */
    useEffect(() => {
        async function fetchSesi() {
            try {
                const res = await fetch(
                    `http://127.0.0.1:8001/api/sesi/${id}`,
                    { headers: { Accept: "application/json" } }
                );

                if (!res.ok) throw new Error("Gagal memuat sesi");

                const data = await res.json();

                setSesi(data);
                setPesertaList(data.pesertas?.map(p => p.nama) || []);

                if (data.status === "running") {
                    window.location.href = `/kuis/${id}`;
                }

                if (data.status === "finished") {
                    window.location.href = "/";
                }

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchSesi();
    }, [id]);

    /* ================================
       WEBSOCKET (REALTIME)
    ================================= */
    useEffect(() => {
        const channel = window.Echo.channel(`sesi.${id}`)
            .listen(".ParticipantsUpdated", e => {
                console.log("ParticipantsUpdated", e);
                setPesertaList(e.peserta.map(p => p.nama));
            })
            .listen(".QuizStarting", e => {
                console.log("QuizStarting", e);
                window.location.href = `/kuis/${id}`;
            })
            .listen(".SessionFinished", () => {
                window.location.href = "/";
            });

        return () => {
            window.Echo.leave(`sesi.${id}`);
        };
    }, [id]);

    /* ================================
       STATES
    ================================= */
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Loading sesi...
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center text-red-600">
                {error}
            </div>
        );
    }

    /* ================================
       UI (TIDAK DIUBAH)
    ================================= */
    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700 flex items-center justify-center">
            <div className="bg-white w-full max-w-xl p-8 rounded-xl shadow-lg">

                {/* HEADER */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">
                        Menunggu Kuis Dimulai ⏳
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Tetap di halaman ini sampai guru memulai kuis
                    </p>
                </div>

                {/* SESSION INFO */}
                <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-6">
                    <div className="flex justify-between text-sm">
                        <span className="font-medium">Kode Kuis</span>
                        <span className="font-mono text-lg tracking-widest">
                            {sesi.kode}
                        </span>
                    </div>

                    <div className="flex justify-between text-sm mt-2">
                        <span className="font-medium">Nama Anda</span>
                        <span>{peserta.nama}</span>
                    </div>

                    <div className="flex justify-between text-sm mt-2">
                        <span className="font-medium">Status</span>
                        <span className="capitalize">{sesi.status}</span>
                    </div>
                </div>

                {/* PARTICIPANTS */}
                <div>
                    <h2 className="font-semibold text-gray-700 mb-2">
                        Peserta ({pesertaList.length})
                    </h2>

                    <div className="border rounded max-h-40 overflow-y-auto">
                        {pesertaList.length === 0 ? (
                            <p className="text-sm text-gray-500 p-3">
                                Belum ada peserta
                            </p>
                        ) : (
                            pesertaList.map((nama, idx) => (
                                <div
                                    key={idx}
                                    className="px-3 py-2 border-b last:border-b-0 text-sm"
                                >
                                    {nama}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* FOOTER */}
                <div className="mt-6 text-center text-sm text-gray-500">
                    🚀 Kuis akan otomatis dimulai saat guru menekan{" "}
                    <b>Start</b>
                </div>
            </div>
        </div>
    );
}
