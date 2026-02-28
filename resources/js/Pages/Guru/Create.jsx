import { useState, useRef } from "react";
import ProtectedLayout from "@/Layouts/ProtectedLayout";
import webFetch from "@/lib/webFetch";
import { WebAPI } from "@/lib/api.web";
import QuizSettings from "@/Components/QuizSettings";
import QuestionList from "@/Components/QuestionList";
import QuestionForm from "@/Components/QuestionForm";

export default function CreateQuiz() {
  const editRef = useRef(null);
  /* ================= QUIZ ================= */
  const [judul, setJudul] = useState("");
  const [totalWaktu, setTotalWaktu] = useState("");
  const [showAnswer, setShowAnswer] = useState(true);
  const [showRank, setShowRank] = useState(true);
  const [waitingText, setWaitingText] = useState("");


  /* ================= QUESTIONS ================= */
  const [questions, setQuestions] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  /* ================= FORM ================= */
  const [tipe, setTipe] = useState("multiple_choice_single");
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [mathEq, setMathEq] = useState("");
  const [opsi, setOpsi] = useState(["", "", "", ""]); // used for MC + ordering
  const [matchingPairs, setMatchingPairs] = useState([
    { kiri: "", kanan: "" },
    { kiri: "", kanan: "" },
  ]);
  const [jawabanSingle, setJawabanSingle] = useState(0);
  const [jawabanMulti, setJawabanMulti] = useState([]);
  const [batasWaktu, setBatasWaktu] = useState("");
  const [skor, setSkor] = useState(null);
  const [skorBonusWaktu, setSkorBonusWaktu] = useState(null);

  function addQuestion( resetForm ) {
    if (!text.trim()) return alert("Pertanyaan wajib diisi");

    const opsiBersih = opsi.filter((o) => o.trim() !== "");

    // Only validate opsi for question types that actually use it
    if (
      ["multiple_choice_single", "multiple_choice_multi", "ordering"].includes(tipe) &&
      opsiBersih.length < 2
    ) {
      return alert("Minimal 2 opsi");
    }

    if (tipe === "multiple_choice_multi" && jawabanMulti.length === 0) {
      return alert("Pilih minimal 1 jawaban benar");
    }

    const payload = {
      id: Date.now(),
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
      payload.jawaban_benar = jawabanSingle === 1;
    }
    else if (tipe === "multiple_choice_multi") {
      payload.opsi = opsiBersih;
      payload.jawaban_benar = [...jawabanMulti];
    }
    else if (tipe === "ordering") {
      payload.opsi = opsiBersih;
      payload.jawaban_benar = opsiBersih.map((_, i) => i);
    }
    else if (tipe === "matching") {
      if (matchingPairs.length < 2)
        return alert("Minimal 2 pasangan");

      const kiri = matchingPairs.map(p => p.kiri).filter(Boolean);
      const kanan = matchingPairs.map(p => p.kanan).filter(Boolean);

      if (kiri.length !== matchingPairs.length || kanan.length !== matchingPairs.length) {
        return alert("Semua pasangan harus diisi");
      }

      payload.opsi = { kiri, kanan };

      payload.jawaban_benar = kiri.map((_, i) => i);
    }
    else {
      payload.opsi = opsiBersih;
      payload.jawaban_benar = Number(jawabanSingle);
    }

    if (editingIndex !== null) {
      console.log("Updating question at index:", editingIndex, "with payload:", payload);
      setQuestions(prev => {
        const copy = [...prev];
        copy[editingIndex] = { ...payload, id: prev[editingIndex].id };
        return copy;
      });
    } else {
      console.log("Adding new question with payload:", payload);
      setQuestions((q) => [...q, payload]);
    }

    resetForm();

  }

  async function saveQuiz() {
    if (!judul.trim()) return alert("Judul wajib diisi");
    if (questions.length === 0) return alert("Minimal 1 soal");

    const payload = {
      judul,
      mode: "classic",
      hp_awal: null,
      total_waktu: totalWaktu ? Number(totalWaktu) : null,
      tampilkan_jawaban_benar: showAnswer,
      tampilkan_peringkat: showRank,
      teks_waiting_room: waitingText,
      pertanyaan: questions.map(q => ({
        tipe_pertanyaan: q.tipe_pertanyaan,
        pertanyaan: q.pertanyaan,
        url_gambar: q.url_gambar,
        persamaan_matematika: q.persamaan_matematika,
        opsi: q.opsi === undefined ? null : q.opsi,
        jawaban_benar: q.jawaban_benar,
        batas_waktu: q.batas_waktu ?? null,
        skor: q.skor,
        skor_bonus_waktu: q.skor_bonus_waktu
      }))
    };

    try {
      const res = await webFetch(WebAPI.teacher.createQuizFull, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error(err);
        alert("Gagal menyimpan kuis");
        return;
      }

      alert("Kuis berhasil dibuat");
      window.location.href = "/dashboard";
    } catch (e) {
      console.error(e);
      alert("Server error");
    }
  }

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

          <button
            onClick={saveQuiz}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Simpan
          </button>
        </div>

        {/* QUIZ SETTINGS */}
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

        {/* ADD QUESTION */}
        <div ref={editRef}>
        <QuestionForm
          setEditingIndex={setEditingIndex}
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
          editingIndex={editingIndex}
          addQuestion={addQuestion}
        />
        </div>

        {/* QUESTION LIST */}
        <QuestionList
          questions={questions}
          setQuestions={setQuestions}
          setMatchingPairs={setMatchingPairs}
          setEditingIndex={setEditingIndex}
          setTipe={setTipe}
          setText={setText}
          setImageUrl={setImageUrl}
          setMathEq={setMathEq}
          setBatasWaktu={setBatasWaktu}
          setJawabanSingle={setJawabanSingle}
          setJawabanMulti={setJawabanMulti}
          setOpsi={setOpsi}
          editRef={editRef}
          setSkor={setSkor}
          setSkorBonusWaktu={setSkorBonusWaktu}
        />

      </div>
    </ProtectedLayout>
  );
}
