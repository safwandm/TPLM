import { useEffect, useState, useRef } from "react";
import ProtectedLayout from "@/Layouts/ProtectedLayout";
import { FaTrash, FaPlus } from "react-icons/fa";
import { WebAPI } from "@/lib/api.web";
import { webFetch } from "@/lib/webFetch";

export default function EditQuiz({ quizId }) {
    const editFormRef = useRef(null);

    function resetOptionsForMode(mode) {
        if (mode === "true_false") {
            setOptions([
                { id: "true", text: "Benar", correct: true },
                { id: "false", text: "Salah", correct: false },
            ]);
            return;
        }

        setOptions([
            { id: "a", text: "", correct: true },
            { id: "b", text: "", correct: false },
        ]);
    }

    function toggleCorrect(index) {
        setOptions((prev) => {
            const next = [...prev];

            if (questionMode !== "multiple") {
                next.forEach((o, i) => (o.correct = i === index));
                return next;
            }

            const checkedCount = prev.filter((o) => o.correct).length;
            if (checkedCount === 1 && prev[index].correct) return prev;

            next[index].correct = !next[index].correct;
            return next;
        });
    }

    function updateOptionText(index, value) {
        setOptions((prev) => {
            const next = [...prev];
            next[index].text = value;
            return next;
        });
    }

    function addOption() {
        if (options.length >= 4) return;

        const nextId = ["a", "b", "c", "d"][options.length];

        setOptions((prev) => [
            ...prev,
            { id: nextId, text: "", correct: false },
        ]);
    }

    function removeOption(index) {
        setOptions((prev) => {
            const next = prev.filter((_, i) => i !== index);
            if (!next.some((o) => o.correct)) {
                next[0].correct = true;
            }
            return next;
        });
    }

    const [options, setOptions] = useState([
        { id: "a", text: "", correct: true },
        { id: "b", text: "", correct: false },
    ]);
    const [questionMode, setQuestionMode] = useState("single");

    /* ===============================
       CHANGE TRACKING (PERSISTENT)
    =============================== */
    const addedQuestionsRef = useRef([]);
    const updatedQuestionsRef = useRef(new Map());
    const deletedQuestionIdsRef = useRef(new Set());

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
    // Option state now handled by `options` array
    const [qTimer, setQTimer] = useState("");

    /* ===============================
       FETCH QUIZ
    =============================== */
    useEffect(() => {
        webFetch(WebAPI.teacher.quiz(quizId))
            .then((r) => r.json())
            .then((data) => {

                console.log("Fetched quiz data:", data);

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
                        a: q.opsi_a,
                        b: q.opsi_b,
                        c: q.opsi_c,
                        d: q.opsi_d,
                        correct: q.jawaban_benar,
                        mode: q.mode ?? "single",
                    }))
                );
            })
            .catch((err) => {
                console.error("Fetch error:", err);
                setError("Gagal memuat kuis. Silakan coba lagi.");
            })
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
        setQuestionMode("single");
        setQTimer("");
        resetOptionsForMode("single");
    }

    function startEdit(q) {
        setEditingId(q.id);
        setQText(q.text);
        setQImage(q.image ?? "");
        setQMath(q.math ?? "");
        setQuestionMode(q.mode ?? "single");
        setQTimer(q.timer ?? "");

        if (q.mode === "true_false") {
            setOptions([
                { id: "true", text: "Benar", correct: q.correct?.includes("true") },
                { id: "false", text: "Salah", correct: q.correct?.includes("false") },
            ]);
            editFormRef.current?.scrollIntoView({ behavior: "smooth" });
            return;
        }

        const opts = [
            { id: "a", text: q.a, correct: q.correct?.includes("a") },
            { id: "b", text: q.b, correct: q.correct?.includes("b") },
            { id: "c", text: q.c, correct: q.correct?.includes("c") },
            { id: "d", text: q.d, correct: q.correct?.includes("d") },
        ].filter(o => o.text);
        setOptions(opts.length >= 2 ? opts : [
            { id: "a", text: "", correct: true },
            { id: "b", text: "", correct: false },
        ]);
        editFormRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    function getCsrfToken() {
        return decodeURIComponent(
            document.cookie
                .split("; ")
                .find(row => row.startsWith("XSRF-TOKEN="))
                ?.split("=")[1] ?? ""
        );
    }

    /* ===============================
       ADD / UPDATE QUESTION
    =============================== */
    function submitQuestion() {
        if (!qText.trim()) return alert("Pertanyaan wajib diisi");

        // Validate empty answers
        const hasEmptyAnswer = options.some(o => !o.text || !o.text.trim());
        if (hasEmptyAnswer) {
            return alert("Semua pilihan jawaban wajib diisi");
        }

        // Validate correct answer(s)
        const correctCount = options.filter(o => o.correct).length;
        if (
            (questionMode === "single" || questionMode === "true_false") &&
            correctCount !== 1
        ) {
            return alert("Mode ini hanya boleh satu jawaban benar");
        }
        if (correctCount === 0) {
            return alert("Minimal satu jawaban benar");
        }

        const opsiMap = { a: null, b: null, c: null, d: null };

        options.forEach((opt, i) => {
            const key = ["a", "b", "c", "d"][i];
            if (key) opsiMap[key] = opt.text || null;
        });

        const jawabanBenar = options
            .filter(o => o.correct)
            .map(o => o.id);

        const payload = {
            pertanyaan: qText,
            mode: questionMode,
            opsi_a: opsiMap.a,
            opsi_b: opsiMap.b,
            opsi_c: opsiMap.c,
            opsi_d: opsiMap.d,
            jawaban_benar: jawabanBenar,
            url_gambar: qImage || null,
            persamaan_matematika: qMath || null,
            batas_waktu: qTimer ? Number(qTimer) : null,
        };

        if (editingId) {
            updatedQuestionsRef.current.set(editingId, payload);
            setQuestions((qs) =>
                qs.map((q) =>
                    q.id === editingId ? {
                        ...q,
                        text: qText,
                        mode: questionMode,
                        a: opsiMap.a,
                        b: opsiMap.b,
                        c: opsiMap.c,
                        d: opsiMap.d,
                        correct: jawabanBenar,
                        image: qImage,
                        math: qMath,
                        timer: qTimer
                    } : q
                )
            );
        } else {
            const tempId = `temp-${Date.now()}`;
            addedQuestionsRef.current.push({ ...payload, kuis_id: quizId });

            const newQuestionState = {
                id: tempId,
                text: qText,
                mode: questionMode,
                a: opsiMap.a,
                b: opsiMap.b,
                c: opsiMap.c,
                d: opsiMap.d,
                correct: jawabanBenar,
                image: qImage,
                math: qMath,
                timer: qTimer
            };

            setQuestions((qs) => [...qs, newQuestionState]);
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
            await webFetch(WebAPI.teacher.quiz(quizId), {
                method: "PUT",
                headers: {
                    "X-XSRF-TOKEN": getCsrfToken(),
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
                console.log("Deleting question:", id);
                await webFetch(WebAPI.teacher.question(id), {
                    method: "DELETE",
                    headers: {
                        "X-XSRF-TOKEN": getCsrfToken(),
                    },
                });
            }

            /* 3️⃣ UPDATE */
            for (const [id, payload] of updatedQuestionsRef.current.entries()) {
                console.log("Updating question:", id, payload);
                const res = await webFetch(WebAPI.teacher.question(id), {
                    method: "PUT",
                    headers: {
                        "X-XSRF-TOKEN": getCsrfToken(),
                    },
                    body: JSON.stringify(payload),
                });
                console.log("Update response:", res);
                console.log("Update response JSON:", await res.json());
            }

            /* 4️⃣ ADD */
            for (const q of addedQuestionsRef.current) {
                console.log("Adding question:", q);
                const res = await webFetch(WebAPI.teacher.createQuestion, {
                    method: "POST",
                    headers: {
                        "X-XSRF-TOKEN": getCsrfToken(),
                    },
                    body: JSON.stringify(q),
                });
                console.log("Add response:", res);
                console.log("Add response JSON:", await res.json());
            }


            alert("Perubahan disimpan");
            // window.location.href = "/dashboard";
        } catch (e) {
            console.error("Save error:", e);
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
                            <label className="text-sm font-medium text-gray-600">Tipe Pertanyaan</label>
                            <select
                                className="border p-2 rounded w-full mt-1"
                                value={questionMode}
                                onChange={(e) => {
                                    const mode = e.target.value;
                                    setQuestionMode(mode);
                                    resetOptionsForMode(mode);
                                }}
                            >
                                <option value="single">Satu Jawaban Benar</option>
                                <option value="multiple">Banyak Jawaban Benar</option>
                                <option value="true_false">Benar / Salah</option>
                            </select>
                        </div>

                        <div className="space-y-1 mt-2">
                            <label className="block mt-4 text-sm font-medium text-gray-600">Pilihan Jawaban</label>
                            {options.map((opt, idx) => (
                                <div key={opt.id} className="flex gap-2 items-center">
                                    <input
                                        type="checkbox"
                                        checked={opt.correct}
                                        onChange={() => toggleCorrect(idx)}
                                    />
                                    <input
                                        className="flex-1 border p-2 rounded"
                                        disabled={questionMode === "true_false"}
                                        value={opt.text}
                                        placeholder="Masukkan jawaban"
                                        onChange={(e) => updateOptionText(idx, e.target.value)}
                                    />
                                    {questionMode !== "true_false" && options.length > 2 && (
                                        <button onClick={() => removeOption(idx)} className="text-red-600">
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {questionMode !== "true_false" && options.length < 4 && (
                            <button onClick={addOption} className="text-blue-600 text-sm mt-3">
                                + Tambah Jawaban
                            </button>
                        )}

                        <div className="grid grid-cols-2 gap-3">
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

                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    {[
                                        { key: "a", text: q.a },
                                        { key: "b", text: q.b },
                                        { key: "c", text: q.c },
                                        { key: "d", text: q.d },
                                    ]
                                        .filter(o => o.text)
                                        .map(o => (
                                            <div
                                                key={o.key}
                                                className={`border p-2 rounded ${q.correct.includes(o.key)
                                                    ? "bg-green-100 border-green-600"
                                                    : "bg-white"
                                                    }`}
                                            >
                                                {o.text}
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
        </ProtectedLayout >
    );
}
