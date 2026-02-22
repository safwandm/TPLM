import { useEffect, useState } from "react";
import ProtectedLayout from "@/Layouts/ProtectedLayout";
import webFetch from "@/lib/webFetch";
import {
    FaPlus,
    FaEdit,
    FaPlay,
    FaFileAlt,
    FaTrash,
} from "react-icons/fa";
import { WebAPI } from "@/lib/api.web";

export default function Dashboard() {

    /* =====================================
       QUIZ STATE
    ===================================== */
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [loadingId, setLoadingId] = useState(null);

    const [showTextModal, setShowTextModal] = useState(false);
    const [waitingText, setWaitingText] = useState("");
    const [selectedQuizId, setSelectedQuizId] = useState(null);

    /* =====================================
       FETCH QUIZZES
    ===================================== */
    useEffect(() => {

        async function fetchQuizzes() {
            try {
                console.log("Fetching quizzes from:", WebAPI.teacher.allQuiz);
                const res = await webFetch(WebAPI.teacher.allQuiz);

                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }

                const data = await res.json();
                setQuizzes(data);
                console.log("DATA QUIZZES:", data);
            } catch (err) {
                console.error("Fetch quiz error:", err);
                setError("Gagal memuat data kuis");
            } finally {
                setLoading(false);
            }
        }

        fetchQuizzes();
    }, []);

    /* =====================================
       HANDLERS
    ===================================== */

    function getCsrfToken() {
        return decodeURIComponent(
            document.cookie
                .split("; ")
                .find(row => row.startsWith("XSRF-TOKEN="))
                ?.split("=")[1] ?? ""
        );
    }
    function handleEdit(id) {
        window.location.href = `/quizzes/${id}/edit`;
    }

    async function handleStart(kuisId) {

        const teks = prompt("Masukkan teks apresiasi / doa sebelum kuis dimulai (opsional):");

        setLoadingId(kuisId);

        try {
            const res = await webFetch(WebAPI.session.create, {
                headers: {
                    "X-XSRF-TOKEN": getCsrfToken(),
                },
                method: "POST",
                body: JSON.stringify({
                    kuis_id: kuisId,
                    teks_waiting_room: teks || null
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error("Start quiz error:", errorData);
                throw new Error(errorData.message ?? "Start quiz gagal");
            }

            const data = await res.json();
            window.location.href = `/sesi/${data.sesi.id}`;

        } catch (err) {
            console.error(err);
            alert("Tidak bisa memulai kuis");
        } finally {
            setLoadingId(null);
        }
    }



    function handleExport(sesiId) {
    if (!sesiId) {
        alert("Kuis ini belum pernah dijalankan.");
        return;
    }

    window.open(
        `/web/teacher/export/sesi/${sesiId}/csv`,
        "_blank"
    );
    }



    async function handleDelete(id) {

        const confirmed = window.confirm(
            "Yakin ingin menghapus kuis ini?\nSemua soal dan sesi terkait akan ikut terhapus."
        );

        if (!confirmed) return;

        setLoadingId(id);

        try {
            const res = await webFetch(WebAPI.teacher.deleteQuiz(id), {
                headers: {
                    "X-XSRF-TOKEN": getCsrfToken(),
                },
                method: "DELETE",
            });

            if (!res.ok) {
                throw new Error("Gagal menghapus kuis");
            }

            setQuizzes((prev) => prev.filter((q) => q.id !== id));
        } catch (err) {
            console.error("Delete quiz error:", err);
            alert("Tidak bisa menghapus kuis");
        } finally {
            setLoadingId(null);
        }
    }

    /* =====================================
       LOADING / ERROR
    ===================================== */

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    /* =====================================
       UI
    ===================================== */
    return (
        <ProtectedLayout allowedRoles={["teacher"]}>
            <div>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-semibold">Kuis saya</h2>
                        <p className="text-sm text-gray-600">
                            Login sebagai{" "}
                            {/* <span className="font-medium">{user.name}</span> */}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <a
                            href="/quizzes/create"
                            className="inline-flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded"
                        >
                            <FaPlus /> Kuis Baru
                        </a>

                    </div>
                </div>

                {quizzes.length === 0 ? (
                    <p className="text-gray-500">Belum ada kuis.</p>
                ) : (
                    <div className="space-y-4">
                        {quizzes.map((q) => (
                            <div
                                key={q.id}
                                className="border rounded-xl p-4 flex justify-between items-center"
                            >
                                <div>
                                    <h3 className="text-blue-700 font-semibold text-lg">
                                        {q.judul}
                                    </h3>

                                    <div className="flex gap-4 text-gray-600 mt-1">
                                        <span className="text-yellow-600">
                                            {q.pertanyaan_count} Soal
                                        </span>

                                        {q.total_waktu && (
                                            <span>Batas waktu: {q.total_waktu}s</span>
                                        )}
                                    </div>
                                </div>

                                {/* <div className="flex gap-3">
                                    <button onClick={() => handleEdit(q.id)}>
                                        <FaEdit />
                                    </button>
                                    <button
                                        onClick={() => handleStart(q.id)}
                                        disabled={loadingId === q.id}
                                        className={loadingId === q.id ? "opacity-50 cursor-not-allowed" : ""}
                                    >
                                        <FaPlay />
                                        {q.timer ? `${q.kuis_aktif != null} detik` : "Tidak ada batas waktu"}
                                    </button>
                                    <button onClick={handleExport}>
                                        <FaFileAlt />
                                    </button>
                                    <button onClick={() => handleDelete(q.id)}>
                                        <FaTrash />
                                    </button>
                                </div> */}


                                <div className="flex gap-3 items-center">
                                    {/* Edit always allowed (optional rule) */}
                                    <button onClick={() => handleEdit(q.id)} title="Edit kuis">
                                        <FaEdit />
                                    </button>

                                    {/* NO ACTIVE SESSION → START */}
                                    {!q.kuis_aktif && (
                                        <button
                                            onClick={() => handleStart(q.id)}
                                            disabled={loadingId === q.id}
                                            title="Mulai kuis"
                                            className={loadingId === q.id ? "opacity-50 cursor-not-allowed" : ""}
                                        >
                                            <FaPlay />
                                        </button>
                                    )}

                                    {/* WAITING SESSION */}
                                    {q.kuis_aktif?.status === "waiting" && (
                                        <button
                                            onClick={() => window.location.href = `/sesi/${q.kuis_aktif.id}`}
                                            className="px-2 py-1 rounded text-yellow-700 border border-yellow-500"
                                            title={`Kode: ${q.kuis_aktif.kode}`}
                                        >
                                            🟡 Menunggu
                                        </button>
                                    )}

                                    {/* RUNNING SESSION */}
                                    {q.kuis_aktif?.status === "running" && (
                                        <button
                                            onClick={() => window.location.href = `/sesi/${q.kuis_aktif.id}`}
                                            className="px-2 py-1 rounded text-red-700 border border-red-500"
                                            title="Kuis sedang berjalan"
                                        >
                                            🔴 Berjalan
                                        </button>
                                    )}

                                    <button
                                        onClick={() => {
                                            if (!q.latest_sesi?.id) return;
                                            handleExport(q.latest_sesi.id);
                                        }}
                                        disabled={!q.latest_sesi?.id}
                                        title={
                                            q.latest_sesi?.id
                                                ? "Export Hasil Kuis"
                                                : "Belum ada sesi untuk diexport"
                                        }
                                        className={
                                            q.latest_sesi?.id
                                                ? ""
                                                : "opacity-40 cursor-not-allowed"
                                        }
                                    >
                                        <FaFileAlt />
                                    </button>



                                    <button onClick={() => handleDelete(q.id)} title="Hapus kuis">
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </ProtectedLayout>
    );
}