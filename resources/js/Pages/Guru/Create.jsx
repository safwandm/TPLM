import { useState } from "react";
import { API } from "@/lib/api";
import ProtectedLayout from "@/Layouts/ProtectedLayout";
import { FaTrash, FaPlus } from "react-icons/fa";

export default function CreateQuiz() {
    const [title, setTitle] = useState("");
    const [duration, setDuration] = useState("");
    const [showAnswers, setShowAnswers] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);

    const [questions, setQuestions] = useState([]);

    const [qText, setQText] = useState("");
    const [qImage, setQImage] = useState("");
    const [qMath, setQMath] = useState("");
    const [optA, setOptA] = useState("");
    const [optB, setOptB] = useState("");
    const [optC, setOptC] = useState("");
    const [optD, setOptD] = useState("");
    const [correct, setCorrect] = useState("a");
    const [qTimer, setQTimer] = useState("1");

    function addQuestion() {

        if (!qText.trim()) {
            alert("Pertanyaan tidak boleh kosong");
            return;
        }

        if (!optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
            alert("Semua opsi jawaban harus diisi");
            return;
        }

        if (qTimer && isNaN(Number(qTimer))) {
            alert("Batas waktu harus berupa angka");
            return;
        }

        const newQ = {
            id: Date.now(),
            text: qText,
            image: qImage,
            math: qMath,
            options: {
                a: optA,
                b: optB,
                c: optC,
                d: optD,
            },
            correct,
            timer: qTimer ? Number(qTimer) : null,
        };

        setQuestions([...questions, newQ]);

        setQText("");
        setQImage("");
        setQMath("");
        setOptA("");
        setOptB("");
        setOptC("");
        setOptD("");
        setCorrect("a");
        setQTimer("");
    }

    async function saveQuiz() {
        if (!title.trim()) {
            alert("Judul kuis wajib diisi");
            return;
        }

        if (questions.length === 0) {
            alert("Minimal harus ada 1 pertanyaan");
            return;
        }

        const payload = {
            judul: title,
            total_waktu: duration ? Number(duration) : null,
            tampilkan_jawaban_benar: showAnswers,
            tampilkan_peringkat: showLeaderboard,
            pertanyaan: questions.map((q) => ({
                pertanyaan: q.text,
                opsi_a: q.options.a,
                opsi_b: q.options.b,
                opsi_c: q.options.c,
                opsi_d: q.options.d,
                jawaban_benar: q.correct,
                url_gambar: q.image || null,
                persamaan_matematika: q.math || null,
                batas_waktu: q.timer ?? null,
            })),
        };

        const token = localStorage.getItem("auth_token");

        try {
            const res = await fetch(API.teacher.createQuizFull, {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const text = await res.text(); 
                console.error("Server response:", text);
                alert("Gagal menyimpan kuis");
                return;
            }

            alert("Kuis berhasil dibuat");
            window.location.href = "/dashboard";

        } catch (err) {
            console.error("Fetch error:", err);
        }
    }

    return (
        <ProtectedLayout allowedRoles={["teacher"]}>
            <div className="max-w-4xl mx-auto space-y-8">

                {/* -------------------------------------- */}
                {/* CARD: Pengaturan Kuis */}
                {/* -------------------------------------- */}
                <div className="bg-white p-6 rounded-lg shadow">
                    {/* Top Buttons */}
                    <div className="flex justify-between mb-6">
                        <button
                            onClick={() => window.location.href = "/dashboard"}
                            className="text-blue-700"
                        >
                            ← Kembali
                        </button>

                        <button
                            onClick={saveQuiz}
                            className="bg-green-600 text-white px-4 py-2 rounded"
                        >
                            Tambahkan Kuis
                        </button>
                    </div>

                    <h2 className="font-semibold text-lg mb-3">Pengaturan Kuis</h2>
                    <div className="space-y-4 mb-4">
                        {/* Title */}
                        <div>
                            <label className="text-sm font-medium text-gray-600">Judul Kuis</label>
                            <input
                                type="text"
                                className="w-full border p-2 rounded mt-1"
                                placeholder="Masukkan judul kuis"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                        {/* Duration */}
                        <div>
                            <label className="text-sm font-medium text-gray-600">Total Waktu Kuis (detik)</label>
                            <input
                                type="number"
                                className="w-full border p-2 rounded mt-1"
                                placeholder="Biarkan kosong jika tidak ada total waktu"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                            />
                        </div>

                        {/* Checkboxes */}
                        <div className="flex gap-6 mt-4">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={showAnswers}
                                    onChange={(e) => setShowAnswers(e.target.checked)}
                                />
                                Tunjukkan Jawaban Benar
                            </label>

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={showLeaderboard}
                                    onChange={(e) => setShowLeaderboard(e.target.checked)}
                                />
                                Tunjukkan Peringkat
                            </label>
                        </div>
                    </div>
                </div>

                {/* -------------------------------------- */}
                {/* CARD: Tambah Pertanyaan */}
                {/* -------------------------------------- */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="font-semibold text-lg mb-3">Tambah Pertanyaan</h2>

                    <div className="space-y-4">

                        {/* Question text */}
                        <div>
                            <label className="text-sm font-medium text-gray-600">Pertanyaan</label>
                            <textarea
                                className="w-full border p-2 rounded mt-1"
                                placeholder="Masukkan pertanyaan kuis"
                                value={qText}
                                onChange={(e) => setQText(e.target.value)}
                            />
                        </div>

                        {/* Image */}
                        <div>
                            <label className="text-sm font-medium text-gray-600">URL Gambar (opsional)</label>
                            <input
                                type="text"
                                className="w-full border p-2 rounded mt-1"
                                placeholder="https://..."
                                value={qImage}
                                onChange={(e) => setQImage(e.target.value)}
                            />
                        </div>

                        {/* Math */}
                        <div>
                            <label className="text-sm font-medium text-gray-600">Persamaan Matematika</label>
                            <input
                                type="text"
                                className="w-full border p-2 rounded mt-1"
                                placeholder="x^2 + y^2 = z^2"
                                value={qMath}
                                onChange={(e) => setQMath(e.target.value)}
                            />
                        </div>

                        {/* Options */}
                        <div>
                            <label className="text-sm font-medium text-gray-600">Pilihan Jawaban</label>
                            <div className="grid grid-cols-2 gap-3 mt-1">
                                <input className="border p-2 rounded" placeholder="Masukkan pilihan a" value={optA} onChange={(e) => setOptA(e.target.value)} />
                                <input className="border p-2 rounded" placeholder="Masukkan pilihan b" value={optB} onChange={(e) => setOptB(e.target.value)} />
                                <input className="border p-2 rounded" placeholder="Masukkan pilihan c" value={optC} onChange={(e) => setOptC(e.target.value)} />
                                <input className="border p-2 rounded" placeholder="Masukkan pilihan d" value={optD} onChange={(e) => setOptD(e.target.value)} />
                            </div>
                        </div>

                        {/* Correct answer + timer */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium text-gray-600">Kunci Jawaban</label>
                                <select
                                    className="border p-2 rounded w-full mt-1"
                                    value={correct}
                                    onChange={(e) => setCorrect(e.target.value)}
                                >
                                    <option value="a">Pilihan a</option>
                                    <option value="b">Pilihan b</option>
                                    <option value="c">Pilihan c</option>
                                    <option value="d">Pilihan d</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-600">Batas Waktu per Soal (detik)</label>
                                <input
                                    type="number"
                                    min={1}
                                    className="border p-2 rounded w-full mt-1"
                                    placeholder="Masukkan batas waktu"
                                    value={qTimer}
                                    onChange={(e) => setQTimer(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            onClick={addQuestion}
                            className="bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
                        >
                            <FaPlus /> Tambahkan Soal
                        </button>
                    </div>
                </div>

                {/* -------------------------------------- */}
                {/* CARD: Preview Pertanyaan */}
                {/* -------------------------------------- */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="font-semibold text-lg mb-4">Pertanyaan</h2>

                    <div className="space-y-4">
                        {questions.map((q, index) => (
                            <div key={q.id} className="border rounded-lg p-4 shadow-sm bg-white">

                                {/* Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="font-medium text-gray-800">
                                        {index + 1}. {q.text}
                                    </div>

                                    <button
                                        onClick={() =>
                                            setQuestions(questions.filter((x) => x.id !== q.id))
                                        }
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>

                                {q.image && (
                                    <img src={q.image} className="max-w-xs rounded border mb-3" />
                                )}

                                {q.math && (
                                    <div className="text-gray-600 mb-3 font-mono">
                                        <span className="font-semibold">Persamaan:</span> {q.math}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    {Object.entries(q.options).map(([key, value]) => (
                                        <div
                                            key={key}
                                            className={`border px-3 py-2 rounded ${key === q.correct
                                                ? "bg-green-100 border-green-600"
                                                : "bg-gray-50"
                                                }`}
                                        >
                                            <span className="font-semibold uppercase">{key}.</span>{" "}
                                            {value || <span className="opacity-50">—</span>}
                                        </div>
                                    ))}
                                </div>

                                <div className="text-xs text-gray-500 mt-3">
                                    Batas waktu: {q.timer ? `${q.timer} detik` : "Tidak ada batas waktu"}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </ProtectedLayout>
    );
}
