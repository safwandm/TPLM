import { useEffect, useState } from "react";
import { WebAPI } from "@/lib/api.web";
import { webFetch } from "@/lib/webFetch";

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
        if (!peserta || peserta.session_id !== Number(id)) {
            window.location.href = "/";
        }
    }, [id]);

    /* ================================
       INITIAL FETCH
    ================================= */
    useEffect(() => {
        async function fetchSesi() {
            try {
                const res = await webFetch(WebAPI.session.detail(id));

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

    function getCsrfToken() {
        return decodeURIComponent(
            document.cookie
                .split("; ")
                .find(row => row.startsWith("XSRF-TOKEN="))
                ?.split("=")[1] ?? ""
        );
    }

    /* ================================
       WEBSOCKET
    ================================= */
    useEffect(() => {
        const channel = window.Echo.channel(`sesi.${id}`)
            .listen(".ParticipantsUpdated", e => {
                if (Array.isArray(e.peserta)) {
                    setPesertaList(e.peserta);
                }
            })
            .listen(".QuizStarting", () => {
                window.location.href = `/kuis/${id}`;
            })
            .listen(".SessionFinished", () => {
                window.location.href = "/";
            });

        return () => {
            window.Echo.leave(`sesi.${id}`);
        };
    }, [id]);

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

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700 flex items-center justify-center">
            <div className="bg-white w-full max-w-xl p-8 rounded-xl shadow-lg">

                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold">
                        Menunggu Kuis Dimulai ⏳
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Jangan tutup halaman ini
                    </p>
                </div>

                <div className="bg-blue-50 border p-4 rounded mb-6">
                    <div className="flex justify-between text-sm">
                        <span>Kode Kuis</span>
                        <span className="font-mono text-lg">
                            {sesi.kode}
                        </span>
                    </div>

                    <div className="flex justify-between text-sm mt-2">
                        <span>Nama</span>
                        <span>{peserta.nama}</span>
                    </div>

                    <div className="flex justify-between text-sm mt-2">
                        <span>Status</span>
                        <span className="capitalize">{sesi.status}</span>
                    </div>
                </div>

                <h2 className="font-semibold mb-2">
                    Peserta ({pesertaList.length})
                </h2>

                <div className="border rounded max-h-40 overflow-y-auto">
                    {pesertaList.map((nama, i) => (
                        <div
                            key={i}
                            className="px-3 py-2 border-b last:border-b-0"
                        >
                            {nama}
                        </div>
                    ))}
                </div>

                <div className="mt-6 text-center text-sm text-gray-500">
                    🚀 Kuis akan otomatis dimulai oleh guru
                </div>
            </div>
        </div>
    );
}
