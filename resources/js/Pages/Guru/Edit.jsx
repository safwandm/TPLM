import { useEffect, useRef, useState } from "react";
import ProtectedLayout from "@/Layouts/ProtectedLayout";
import webFetch from "@/lib/webFetch";
import { WebAPI } from "@/lib/api.web";
import QuestionForm from "@/Components/QuestionForm";
import QuestionList from "@/Components/QuestionList";
import QuizSettings from "@/Components/QuizSettings";

export default function EditQuiz({ quizId }) {
  const editRef = useRef(null);

  /* ================= TRACKING ================= */
  const addedRef = useRef([]);
  const updatedRef = useRef(new Map());
  const deletedRef = useRef(new Set());

  /* ================= QUIZ ================= */
  const [judul, setJudul] = useState("");
  const [totalWaktu, setTotalWaktu] = useState("");
  const [showAnswer, setShowAnswer] = useState(true);
  const [showRank, setShowRank] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [waitingText, setWaitingText] = useState("");


  /* ================= FORM ================= */
  const [editingId, setEditingId] = useState(null);
  const [tipe, setTipe] = useState("multiple_choice_single");
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [mathEq, setMathEq] = useState("");
  const [opsi, setOpsi] = useState(["", "", "", ""]);
  const [matchingPairs, setMatchingPairs] = useState([
    { kiri: "", kanan: "" },
    { kiri: "", kanan: "" },
  ]);
  const [jawabanSingle, setJawabanSingle] = useState(0);
  const [jawabanMulti, setJawabanMulti] = useState([]);
  const [batasWaktu, setBatasWaktu] = useState("");
  const [skor, setSkor] = useState(null);
  const [skorBonusWaktu, setSkorBonusWaktu] = useState(null);

  /* ================= FETCH ================= */
  useEffect(() => {
    webFetch(WebAPI.teacher.quiz(quizId))
      .then((r) => r.json())
      .then((data) => {

        console.log("Fetched Quiz Data:", data);

        setJudul(data.judul);
        setTotalWaktu(data.total_waktu ?? "");
        setShowAnswer(data.tampilkan_jawaban_benar);
        setShowRank(data.tampilkan_peringkat);
        setWaitingText(data.teks_waiting_room || "");


        setQuestions(
          data.pertanyaan.map((p) => ({
            id: p.id,
            tipe_pertanyaan: p.tipe_pertanyaan,
            pertanyaan: p.pertanyaan,
            opsi: p.opsi,
            // Backend sends true_false as [true]/[false] → normalize to boolean
            jawaban_benar: p.tipe_pertanyaan === "true_false"
              ? (Array.isArray(p.jawaban_benar) ? p.jawaban_benar[0] : p.jawaban_benar)
              : p.jawaban_benar,
            batas_waktu: p.batas_waktu,
            url_gambar: p.url_gambar,
            persamaan_matematika: p.persamaan_matematika,
            skor: p.skor,
            skor_bonus_waktu: p.skor_bonus_waktu,
          }))
        );
      });
  }, [quizId]);

  /* ================= SUBMIT ================= */
  function submitQuestion(resetForm) {
    console.log("SUBMIT editingId:", editingId);
    if (!text.trim()) return alert("Pertanyaan wajib diisi");

    let payload = {
      tipe_pertanyaan: tipe,
      pertanyaan: text,
      url_gambar: imageUrl || null,
      persamaan_matematika: mathEq || null,
      batas_waktu: batasWaktu ? Number(batasWaktu) : null,
      skor: skor ?? null,
      skor_bonus_waktu: skorBonusWaktu ?? null,
    };

    if (tipe === "true_false") {
      payload.opsi = null;
      payload.jawaban_benar = Boolean(jawabanSingle);
    }
    else if (tipe === "multiple_choice_multi") {
      payload.opsi = opsi.filter(o => o.trim());
      payload.jawaban_benar = jawabanMulti;
    }
    else if (tipe === "ordering") {
      const cleaned = opsi.filter(o => o.trim());
      payload.opsi = cleaned;
      payload.jawaban_benar = cleaned.map((_, i) => i);
    }
    else if (tipe === "matching") {
      const kiri = matchingPairs.map(p => p.kiri).filter(Boolean);
      const kanan = matchingPairs.map(p => p.kanan).filter(Boolean);

      payload.opsi = { kiri, kanan };

      payload.jawaban_benar = kiri.map((_, i) => i);
    }
    else {
      payload.opsi = opsi.filter(o => o.trim());
      payload.jawaban_benar = jawabanSingle;
    }

    const isEditing = editingId !== null && editingId !== undefined;

    if (isEditing) {
      const realId = questions[editingId].id;

      // If it's a temp question, just update it in addedRef instead of moving to updatedRef
      if (String(realId).startsWith("temp-")) {
        addedRef.current = addedRef.current.map(q =>
          q.id === realId ? { ...q, ...payload } : q
        );
      } else {
        updatedRef.current.set(realId, payload);
      }

      setQuestions(prev => {
        const copy = [...prev];
        copy[editingId] = { ...payload, id: realId };
        return copy;
      });
    } else {
      const tempId = `temp-${Date.now()}`;
      addedRef.current.push({ id: tempId, ...payload, kuis_id: quizId });

      setQuestions(qs => [...qs, { id: tempId, ...payload }]);
    }

    resetForm();
  }

  /* ================= DELETE ================= */
  function deleteQuestion(index) {
    const id = questions[index].id;
    if (String(id).startsWith("temp-")) {
      addedRef.current = addedRef.current.filter(q => q.id !== id);
    } else {
      deletedRef.current.add(id);
      updatedRef.current.delete(id);
    }

    setQuestions(qs => qs.filter(q => q.id !== id));
  }

  /* ================= SAVE ================= */
  async function saveQuiz() {
    try {

      console.log("Quiz Id:", quizId);
      console.log("Questions to add:", addedRef.current);
      console.log("Questions to update:", Array.from(updatedRef.current.entries()));
      console.log("Questions to delete:", Array.from(deletedRef.current.values()));

      /* QUIZ */
      await webFetch(WebAPI.teacher.quiz(quizId), {
        method: "PUT",
        body: JSON.stringify({
          judul,
          total_waktu: totalWaktu,
          tampilkan_jawaban_benar: showAnswer,
          tampilkan_peringkat: showRank,
          teks_waiting_room: waitingText,
        }),
      });

      /* DELETE */
      for (const id of deletedRef.current) {
        const res = await webFetch(WebAPI.teacher.question(id), {
          method: "DELETE",
        });
        if (!res.ok) {
          console.error(await res.text());
          console.log("Failed to delete question ID:", id);
          throw new Error("Failed to delete question");
        }
      }

      /* UPDATE */
      for (const [id, payload] of updatedRef.current.entries()) {
        const res = await webFetch(WebAPI.teacher.question(id), {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        console.log(WebAPI.teacher.question(id));
        if (!res.ok) {
          console.error(await res.text());
          console.log("Failed to update question ID:", id);
          throw new Error("Failed to update question");
        }
      }

      /* ADD */
      for (const q of addedRef.current) {
        const res = await webFetch(WebAPI.teacher.createQuestion, {
          method: "POST",
          body: JSON.stringify(q),
        });
        if (!res.ok) {
          console.error(await res.text());
          console.log("Failed to create question:", q);
          throw new Error("Failed to create question");
        }
      }

      // alert("Perubahan disimpan");
      // window.location.href = "/dashboard";
    } catch (e) {
      console.error(e);
      alert("Gagal menyimpan perubahan");
    }
  }

  /* ================= UI ================= */
  return (
    <ProtectedLayout allowedRoles={["teacher"]}>
      <div className="max-w-5xl mx-auto space-y-6">

        <div className="flex justify-between">
          <button
            onClick={() => {
              window.location.href = "/dashboard";
            }}
          >
            ← Kembali
          </button>
          <button onClick={saveQuiz} className="bg-green-600 text-white px-4 py-2 rounded">
            Simpan
          </button>
        </div>

        {/* QUIZ */}
        <QuizSettings
          judul={judul}
          setJudul={setJudul}
          totalWaktu={totalWaktu}
          setTotalWaktu={setTotalWaktu}
          showAnswer={showAnswer}
          setShowAnswer={setShowAnswer}
          showRank={showRank}
          setShowRank={setShowRank}
        />

        {/* FORM */}
        <div ref={editRef}>
          <QuestionForm
            setEditingIndex={setEditingId}
            tipe={tipe}
            setTipe={setTipe}
            text={text}
            setText={setText}
            imageUrl={imageUrl}
            setImageUrl={setImageUrl}
            mathEq={mathEq}
            setMathEq={setMathEq}
            opsi={opsi}
            setOpsi={setOpsi}
            matchingPairs={matchingPairs}
            setMatchingPairs={setMatchingPairs}
            jawabanSingle={jawabanSingle}
            setJawabanSingle={setJawabanSingle}
            jawabanMulti={jawabanMulti}
            setJawabanMulti={setJawabanMulti}
            batasWaktu={batasWaktu}
            setBatasWaktu={setBatasWaktu}
            skor={skor}
            setSkor={setSkor}
            skorBonusWaktu={skorBonusWaktu}
            setSkorBonusWaktu={setSkorBonusWaktu}
            editingIndex={editingId}
            addQuestion={submitQuestion}
          />
        </div>

        {/* LIST */}
        <QuestionList
          questions={questions}
          setQuestions={setQuestions}
          setMatchingPairs={setMatchingPairs}
          setEditingIndex={setEditingId}
          setTipe={setTipe}
          setText={setText}
          setImageUrl={setImageUrl}
          setMathEq={setMathEq}
          setBatasWaktu={setBatasWaktu}
          setJawabanSingle={setJawabanSingle}
          setJawabanMulti={setJawabanMulti}
          setOpsi={setOpsi}
          onDelete={deleteQuestion}
          editRef={editRef}
          setSkor={setSkor}
          setSkorBonusWaktu={setSkorBonusWaktu}
        />
      </div>
    </ProtectedLayout>
  );
}