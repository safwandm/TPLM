import QuestionPreview from "@/Components/QuestionPreview";

export default function QuestionList({
    questions,
    setQuestions,
    setEditingIndex,
    setTipe,
    setText,
    setImageUrl,
    setMathEq,
    setBatasWaktu,
    setSkor,
    setSkorBonusWaktu,
    setJawabanSingle,
    setJawabanMulti,
    setOpsi,
    setMatchingPairs,
    onDelete,
    editRef
}) {
    // ===== Quiz duration estimator (matches backend scheduler) =====
    const START_DELAY = 5; // config('quiz.start_delay')
    const BREAK_TIME = 5; // config('quiz.question_break_time')
    const DEFAULT_Q_TIME = 30; // fallback when batas_waktu is null

    const questionCount = questions?.length ?? 0;
    const totalQuestionTime = (questions ?? []).reduce((sum, q) => {
        const t = q?.batas_waktu ?? DEFAULT_Q_TIME;
        return sum + (Number(t) || 0);
    }, 0);

    const totalBreakTime = questionCount > 1 ? BREAK_TIME * (questionCount - 1) : 0;
    const totalSeconds = questionCount
        ? START_DELAY + totalQuestionTime + totalBreakTime
        : 0;

    function formatDuration(sec) {
        if (!sec) return "0 detik";
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        if (m === 0) return `${s} detik`;
        if (s === 0) return `${m} menit`;
        return `${m} menit ${s} detik`;
    }
    function handleEdit(index) {
        const qEdit = questions[index];

        console.log("Editing question:", qEdit);
        console.log("ID of question being edited:", qEdit.id);

        setEditingIndex(index);
        setTipe(qEdit.tipe_pertanyaan);
        setText(qEdit.pertanyaan);
        setImageUrl(qEdit.url_gambar ?? qEdit.image_url ?? "");
        setMathEq(qEdit.persamaan_matematika ?? "");
        setBatasWaktu(qEdit.batas_waktu ?? "");

        // hydrate scoring fields
        if (typeof setSkor === 'function') {
            setSkor(qEdit.skor ?? null);
        }
        if (typeof setSkorBonusWaktu === 'function') {
            setSkorBonusWaktu(qEdit.skor_bonus_waktu ?? null);
        }

        if (qEdit.tipe_pertanyaan === "true_false") {
            const boolAnswer = Array.isArray(qEdit.jawaban_benar)
                ? qEdit.jawaban_benar[0]
                : qEdit.jawaban_benar;
            setJawabanSingle(boolAnswer ? 1 : 0);
            setOpsi(["", "", "", ""]);
            setJawabanMulti([]);
        }
        else if (qEdit.tipe_pertanyaan === "matching") {

            const kiri = qEdit.opsi?.kiri ?? [];
            const kanan = qEdit.opsi?.kanan ?? [];

            const pairs = kiri.map((k, i) => ({
                kiri: k,
                kanan: kanan[i] ?? ""
            }));

            setMatchingPairs(
                pairs.length
                    ? pairs
                    : [
                        { kiri: "", kanan: "" },
                        { kiri: "", kanan: "" }
                    ]
            );

            setOpsi(["", "", "", ""]);
            setJawabanSingle(0);
            setJawabanMulti([]);
        }
        else if (Array.isArray(qEdit.jawaban_benar)) {
            setJawabanMulti(qEdit.jawaban_benar);
            setJawabanSingle(0);
            setOpsi([
                qEdit.opsi?.[0] ?? "",
                qEdit.opsi?.[1] ?? "",
                qEdit.opsi?.[2] ?? "",
                qEdit.opsi?.[3] ?? "",
            ]);
        }
        else {
            setJawabanSingle(qEdit.jawaban_benar);
            setJawabanMulti([]);
            setOpsi([
                qEdit.opsi?.[0] ?? "",
                qEdit.opsi?.[1] ?? "",
                qEdit.opsi?.[2] ?? "",
                qEdit.opsi?.[3] ?? "",
            ]);
        }

        if (editRef?.current) {
            editRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    function handleDelete(index) {
        setQuestions(prev => prev.filter((_, i) => i !== index));
    }

    if (onDelete == undefined || onDelete == null) {
        onDelete = handleDelete;
    }

    if (!questions.length) {
        return (
            <div className="bg-white rounded-xl shadow p-6 text-gray-500">
                Belum ada pertanyaan. Tambahkan soal pertama 👍
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
            <h2 className="font-semibold text-lg">Pertanyaan</h2>

            {questionCount > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-700">
                    <div className="font-medium mb-1">Estimasi durasi kuis</div>
                    <div>• Countdown awal: {START_DELAY} detik</div>
                    <div>• Total waktu semua soal: {totalQuestionTime} detik</div>
                    <div>• Total jeda antar soal: {totalBreakTime} detik</div>
                    <div className="mt-1 font-semibold">
                        ≈ Total: {totalSeconds} detik ({formatDuration(totalSeconds)})
                    </div>
                </div>
            )}

            {questions.map((q, i) => (
                <QuestionPreview
                    key={q.id}
                    q={q}
                    index={i}
                    onEdit={() => handleEdit(i)}
                    onDelete={() => onDelete(i)}
                />
            ))}
        </div>
    );
}