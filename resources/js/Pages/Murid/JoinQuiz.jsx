import { useState } from "react";
import { API } from "@/lib/api";

export default function JoinQuiz() {
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleJoin(e) {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch(API.session.joinByCode(code), {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ nama: name }),
            });

            const data = await res.json();
            if (!res.ok) throw data;

            localStorage.setItem(
                "peserta",
                JSON.stringify({
                    id: data.peserta.id,
                    nama: data.peserta.nama,
                    session_id: data.peserta.session_id,
                })
            );

            window.location.href = `/menunggu/${data.peserta.session_id}`;
        } catch (err) {
            if (err?.message) setError(err.message);
            else if (err?.errors?.nama) setError(err.errors.nama[0]);
            else setError("Gagal bergabung ke kuis");
        } finally {
            setLoading(false);
        }
    }

    const canJoin = name.length > 0 && code.length > 0;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-900 to-blue-700">
            <div className="bg-white w-full max-w-md p-8 rounded-xl shadow-lg">

                {/* Header */}
                <div className="flex flex-col items-center mb-6">
                    <img src="/logo.png" alt="Logo" className="w-24 h-24 mb-3" />
                    <h1 className="text-xl font-semibold text-gray-800">
                        Ayo Ikut Kuis! 🚀
                    </h1>
                    <p className="text-gray-500 text-sm text-center">
                        Masukkan nama dan kode kuis dari gurumu
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-600 p-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleJoin} className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="text-gray-700">Nama</label>
                        <input
                            type="text"
                            placeholder="Masukkan nama Anda"
                            className="w-full mt-1 p-2 border rounded"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    {/* Quiz Code */}
                    <div>
                        <label className="text-gray-700">Kode Kuis</label>
                        <input
                            type="text"
                            placeholder="MASUKKAN KODE"
                            className="w-full mt-1 p-2 border rounded text-center tracking-widest font-semibold"
                            value={code}
                            onChange={(e) =>
                                setCode(e.target.value.toUpperCase())
                            }
                        />
                    </div>

                    {/* Button */}
                    <button
                        type="submit"
                        disabled={!canJoin || loading}
                        className={`w-full py-2 text-white rounded ${canJoin && !loading
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "bg-gray-400"
                            }`}
                    >
                        {loading ? "Loading..." : "Mulai Kuis"}
                    </button>
                </form>

                {/* Tips */}
                <div className="mt-6 bg-blue-50 border border-blue-200 text-blue-700 text-sm p-4 rounded">
                    💡 <strong>Tips:</strong> Tanya kode kuis kepada gurumu atau
                    gunakan link yang dibagikan guru.
                </div>
            </div>
        </div>
    );
}
