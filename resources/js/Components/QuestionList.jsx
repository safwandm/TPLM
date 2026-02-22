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
    setJawabanSingle,
    setJawabanMulti,
    setOpsi,
    setMatchingPairs,
    onDelete,
    editRef
}) {
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