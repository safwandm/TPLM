import React, { useEffect, useState, useRef } from "react";
import ProtectedLayout from "@/Layouts/ProtectedLayout";
import { FaTrash, FaPlus } from "react-icons/fa";
import { API } from "../../lib/api";

export default function Edit() {
    const editFormRef = useRef(null);

    /* ===============================
       CHANGE TRACKING (PERSISTENT)
    =============================== */
    const addedQuestionsRef = useRef([]);
    const updatedQuestionsRef = useRef(new Map());
    const deletedQuestionIdsRef = useRef(new Set());

    /* ===============================
       GET QUIZ ID
    =============================== */
    const quizId = Number(window.location.pathname.split("/")[2]);

    /* ===============================
       STATE
    =============================== */
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [title, setTitle] = useState("");
    const [duration, setDuration] = useState("");
    const [showAnswers, setShowAnswers] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [questions, setQuestions] = useState([]);

    /* ===============================
       FORM STATE
    =============================== */
    const [editingId, setEditingId] = useState(null);
    const [qText, setQText] = useState("");
    const [qImage, setQImage] = useState("");
    const [qMath, setQMath] = useState("");
    const [optA, setOptA] = useState("");
    const [optB, setOptB] = useState("");
    const [optC, setOptC] = useState("");
    const [optD, setOptD] = useState("");
    const [correct, setCorrect] = useState("a");
    const [qTimer, setQTimer] = useState("");

    /* ===============================
       FETCH QUIZ
    =============================== */
    useEffect(() => {
        const token = localStorage.getItem("auth_token");
        if (!token) return (window.location.href = "/login");

        fetch(API.teacher.quiz(quizId), {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
        })
            .then((r) => r.json())
            .then((data) => {
                setTitle(data.judul);
                setDuration(data.total_waktu ?? "");
                setShowAnswers(data.tampilkan_jawaban_benar);
                setShowLeaderboard(data.tampilkan_peringkat);

                setQuestions(
                    data.pertanyaan.map((q) => ({
                        id: q.id,
                        text: q.pertanyaan,
                        image: q.url_gambar,
                        math: q.persamaan_matematika,
                        timer: q.batas_waktu,
                        options: {
                            a: q.opsi_a,
                            b: q.opsi_b,
                            c: q.opsi_c,
                            d: q.opsi_d,
                        },
                        correct: q.jawaban_benar,
                    }))
                );
            })
            .catch(() => setError("Gagal memuat kuis"))
            .finally(() => setLoading(false));
    }, [quizId]);

    /* ===============================
       HELPERS
    =============================== */
    function resetForm() {
        setEditingId(null);
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

    function startEdit(q) {
        setEditingId(q.id);
        setQText(q.text);
        setQImage(q.image ?? "");
        setQMath(q.math ?? "");
        setOptA(q.options.a);
        setOptB(q.options.b);
        setOptC(q.options.c);
        setOptD(q.options.d);
        setCorrect(q.correct);
        setQTimer(q.timer ?? "");
        editFormRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    /* ===============================
       ADD / UPDATE QUESTION
    =============================== */
    function submitQuestion() {
        if (!qText.trim()) return alert("Pertanyaan wajib diisi");

        const payload = {
            pertanyaan: qText,
            opsi_a: optA,
            opsi_b: optB,
            opsi_c: optC,
            opsi_d: optD,
            jawaban_benar: correct,
            url_gambar: qImage || null,
            persamaan_matematika: qMath || null,
            batas_waktu: qTimer ? Number(qTimer) : null,
        };

        if (editingId) {
            updatedQuestionsRef.current.set(editingId, payload);
            setQuestions((qs) =>
                qs.map((q) =>
                    q.id === editingId ? { ...q, text: qText, options: payload } : q
                )
            );
        } else {
            const tempId = `temp-${Date.now()}`;
            addedQuestionsRef.current.push({ ...payload, kuis_id: quizId });
            setQuestions((qs) => [...qs, {
                id: tempId, text: qText,
                image: qImage,
                math: qMath,
                options: {
                    a: optA,
                    b: optB,
                    c: optC,
                    d: optD,
                },
                correct,
                timer: qTimer ? Number(qTimer) : null
            }]);
        }

        resetForm();
    }

    /* ===============================
       DELETE QUESTION
    =============================== */
    function deleteQuestion(id) {
        if (!confirm("Hapus pertanyaan?")) return;

        if (String(id).startsWith("temp-")) {
            addedQuestionsRef.current = addedQuestionsRef.current.filter(
                (_, i) => i !== id
            );
        } else {
            deletedQuestionIdsRef.current.add(id);
            updatedQuestionsRef.current.delete(id);
        }

        setQuestions((qs) => qs.filter((q) => q.id !== id));
    }

    /* ===============================
       SAVE ALL
    =============================== */
    async function saveQuiz() {
        const token = localStorage.getItem("auth_token");

        try {
            /* 1️⃣ UPDATE KUIS */
            await fetch(API.teacher.quiz(quizId), {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    judul: title,
                    total_waktu: duration,
                    tampilkan_jawaban_benar: showAnswers,
                    tampilkan_peringkat: showLeaderboard,
                }),
            });

            /* 2️⃣ DELETE */
            for (const id of deletedQuestionIdsRef.current) {
                await fetch(API.teacher.question(id), {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                });
            }

            /* 3️⃣ UPDATE */
            for (const [id, payload] of updatedQuestionsRef.current.entries()) {
                await fetch(API.teacher.question(id), {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                });
            }

            /* 4️⃣ ADD */
            for (const q of addedQuestionsRef.current) {
                await fetch(API.teacher.createQuestion, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(q),
                });
            }

            alert("Perubahan disimpan");
            window.location.href = "/dashboard";
        } catch (e) {
            alert("Gagal menyimpan perubahan");
        }
    }

    /* ===============================
       UI
    =============================== */
    if (loading)
        return (
            <ProtectedLayout allowedRoles={["teacher"]}>
                <div className="p-6">Loading...</div>
            </ProtectedLayout>
        );

    if (error)
        return (
            <ProtectedLayout allowedRoles={["teacher"]}>
                <div className="p-6 text-red-600">{error}</div>
            </ProtectedLayout>
        );

    return (
        <ProtectedLayout allowedRoles={["teacher"]}>
            <div className="max-w-4xl mx-auto space-y-8">

                {/* HEADER */}
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
                        Simpan Perubahan
                    </button>
                </div>

                {/* PENGATURAN KUIS */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="font-semibold text-lg mb-3">Pengaturan Kuis</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-600">Judul Kuis</label>
                            <input
                                className="w-full border p-2 rounded mt-1"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-600">
                                Total Waktu Kuis (detik)
                            </label>
                            <input
                                type="number"
                                className="w-full border p-2 rounded mt-1"
                                value={duration}
                                onChange={e => setDuration(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-6 mt-4">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={showAnswers}
                                    onChange={e => setShowAnswers(e.target.checked)}
                                />
                                Tunjukkan Jawaban Benar
                            </label>

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={showLeaderboard}
                                    onChange={e => setShowLeaderboard(e.target.checked)}
                                />
                                Tunjukkan Peringkat
                            </label>
                        </div>
                    </div>
                </div>

                {/* TAMBAH PERTANYAAN */}
                <div ref={editFormRef} className="bg-white p-6 rounded-lg shadow">
                    <h2 className="font-semibold text-lg mb-3">Pertanyaan</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-600">Pertanyaan</label>
                            <textarea
                                className="w-full border p-2 rounded mt-1"
                                placeholder="Masukkan pertanyaan kuis"
                                value={qText}
                                onChange={(e) => setQText(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-600">URL Gambar (opsional)</label>
                            <input
                                type="text"
                                className="w-full border p-2 rounded mt-1"
                                placeholder="https://..."
                                value={qImage}
                                onChange={e => setQImage(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-600">Persamaan Matematika</label>
                            <input
                                type="text"
                                className="w-full border p-2 rounded mt-1"
                                placeholder="x^2 + y^2 = z^2"
                                value={qMath}
                                onChange={e => setQMath(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-600">Pilihan Jawaban</label>
                            <div className="grid grid-cols-2 gap-3 mt-1">
                                <input placeholder="Masukkan pilihan a" className="border p-2 rounded" value={optA} onChange={e => setOptA(e.target.value)} />
                                <input placeholder="Masukkan pilihan b" className="border p-2 rounded" value={optB} onChange={e => setOptB(e.target.value)} />
                                <input placeholder="Masukkan pilihan c" className="border p-2 rounded" value={optC} onChange={e => setOptC(e.target.value)} />
                                <input placeholder="Masukkan pilihan d" className="border p-2 rounded" value={optD} onChange={e => setOptD(e.target.value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium text-gray-600">Kunci Jawaban</label>
                                <select
                                    className="border p-2 rounded w-full mt-1"
                                    value={correct}
                                    onChange={e => setCorrect(e.target.value)}
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
                                    onChange={e => setQTimer(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={submitQuestion}
                            className="bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
                        >
                            {editingId ? "Edit Soal" : <><FaPlus /> Tambahkan Soal</>}
                        </button>

                    </div>

                </div>

                {/* LIST PERTANYAAN */}
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

                                    <div className="flex gap-3 items-center">
                                        <button
                                            type="button"
                                            onClick={() => startEdit(q)}
                                            className="text-blue-600 text-sm font-medium"
                                        >
                                            Edit
                                        </button>


                                        <button
                                            onClick={() => deleteQuestion(q.id)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <FaTrash />
                                        </button>

                                    </div>

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
