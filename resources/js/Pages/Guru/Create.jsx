import { useState } from "react";
import ProtectedLayout from "@/Layouts/ProtectedLayout";
import webFetch from "@/lib/webFetch";
import { WebAPI } from "@/lib/api.web";
import { FaPlus, FaTrash } from "react-icons/fa";

export default function CreateQuiz() {
  /* ================= QUIZ ================= */
  const [judul, setJudul] = useState("");
  const [totalWaktu, setTotalWaktu] = useState("");
  const [showAnswer, setShowAnswer] = useState(true);
  const [showRank, setShowRank] = useState(true);

  /* ================= QUESTIONS ================= */
  const [questions, setQuestions] = useState([]);

  /* ================= FORM ================= */
  const [tipe, setTipe] = useState("multiple_choice_single");
  const [text, setText] = useState("");
  const [opsi, setOpsi] = useState(["", "", "", ""]);
  const [jawabanSingle, setJawabanSingle] = useState(0);
  const [jawabanMulti, setJawabanMulti] = useState([]);
  const [batasWaktu, setBatasWaktu] = useState("");

  /* ================= HELPERS ================= */
  function getCsrfToken() {
    return decodeURIComponent(
      document.cookie
        .split("; ")
        .find((r) => r.startsWith("XSRF-TOKEN="))
        ?.split("=")[1] ?? ""
    );
  }

  function resetForm() {
    setText("");
    setOpsi(["", "", "", ""]);
    setJawabanSingle(0);
    setJawabanMulti([]);
    setBatasWaktu("");
  }

  /* ================= ADD QUESTION ================= */
  function addQuestion() {
    if (!text.trim()) return alert("Pertanyaan wajib diisi");

    const opsiBersih = opsi.filter((o) => o.trim() !== "");

    if (tipe !== "true_false" && opsiBersih.length < 2) {
      return alert("Minimal 2 opsi");
    }

    if (tipe === "multiple_choice_multi" && jawabanMulti.length === 0) {
      return alert("Pilih minimal 1 jawaban benar");
    }

    const payload = {
      id: Date.now(),
      tipe_pertanyaan: tipe,
      pertanyaan: text,
      batas_waktu: batasWaktu ? Number(batasWaktu) : null,
    };

    if (tipe === "true_false") {
      payload.opsi = null;
      payload.jawaban_benar = jawabanSingle === 1; // BOOLEAN MURNI
    } 
    else if (tipe === "multiple_choice_multi") {
      payload.opsi = opsiBersih;
      payload.jawaban_benar = [...jawabanMulti]; // ARRAY INT
    } 
    else {
      payload.opsi = opsiBersih;
      payload.jawaban_benar = Number(jawabanSingle); // INT
    }

    setQuestions((q) => [...q, payload]);
    resetForm();
  }

  /* ================= SAVE QUIZ ================= */
  async function saveQuiz() {
    if (!judul.trim()) return alert("Judul wajib diisi");
    if (questions.length === 0) return alert("Minimal 1 soal");

    const payload = {
      judul,
      mode: "classic",       // SESUAI CHECK DB
      hp_awal: null,         // CLASSIC → NULL
      total_waktu: totalWaktu ? Number(totalWaktu) : null,
      tampilkan_jawaban_benar: showAnswer,
      tampilkan_peringkat: showRank,
      pertanyaan: questions.map(q => ({
        tipe_pertanyaan: q.tipe_pertanyaan,
        pertanyaan: q.pertanyaan,
        opsi: q.opsi === undefined ? null : q.opsi,
        jawaban_benar: q.jawaban_benar,
        batas_waktu: q.batas_waktu ?? null
      }))
    };

    console.log("PAYLOAD QUIZ:", payload);

    try {
      const res = await webFetch(WebAPI.teacher.createQuizFull, {
        method: "POST",
        headers: {
          "X-XSRF-TOKEN": getCsrfToken(),
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

  /* ================= UI ================= */
  return (
    <ProtectedLayout allowedRoles={["teacher"]}>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-xl font-bold">Buat Kuis</h1>

        {/* QUIZ SETTING */}
        <div className="bg-white p-4 rounded shadow space-y-3">
          <input
            className="border p-2 w-full"
            placeholder="Judul kuis"
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
          />

          <input
            type="number"
            className="border p-2 w-full"
            placeholder="Total waktu (detik)"
            value={totalWaktu}
            onChange={(e) => setTotalWaktu(e.target.value)}
          />

          <label className="flex gap-2">
            <input
              type="checkbox"
              checked={showAnswer}
              onChange={(e) => setShowAnswer(e.target.checked)}
            />
            Tampilkan jawaban
          </label>

          <label className="flex gap-2">
            <input
              type="checkbox"
              checked={showRank}
              onChange={(e) => setShowRank(e.target.checked)}
            />
            Tampilkan peringkat
          </label>
        </div>

        {/* ADD QUESTION */}
        <div className="bg-white p-4 rounded shadow space-y-3">
          <select
            className="border p-2 w-full"
            value={tipe}
            onChange={(e) => {
              setTipe(e.target.value);
              setJawabanSingle(0);
              setJawabanMulti([]);
            }}
          >
            <option value="multiple_choice_single">Pilihan Ganda (Single)</option>
            <option value="multiple_choice_multi">Pilihan Ganda (Multi)</option>
            <option value="true_false">True / False</option>
          </select>

          <textarea
            className="border p-2 w-full"
            placeholder="Pertanyaan"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          {tipe !== "true_false" &&
            opsi.map((o, i) => (
              <input
                key={i}
                className="border p-2 w-full"
                placeholder={`Opsi ${i + 1}`}
                value={o}
                onChange={(e) => {
                  const copy = [...opsi];
                  copy[i] = e.target.value;
                  setOpsi(copy);
                }}
              />
            ))}

          {tipe === "multiple_choice_single" && (
            <select
              className="border p-2 w-full"
              value={jawabanSingle}
              onChange={(e) => setJawabanSingle(Number(e.target.value))}
            >
              {opsi.map((_, i) => (
                <option key={i} value={i}>Jawaban {i + 1}</option>
              ))}
            </select>
          )}

          {tipe === "multiple_choice_multi" &&
            opsi.map((o, i) =>
              o.trim() ? (
                <label key={i} className="flex gap-2">
                  <input
                    type="checkbox"
                    checked={jawabanMulti.includes(i)}
                    onChange={() =>
                      setJawabanMulti(prev =>
                        prev.includes(i)
                          ? prev.filter(x => x !== i)
                          : [...prev, i]
                      )
                    }
                  />
                  {o}
                </label>
              ) : null
            )
          }

          {tipe === "true_false" && (
            <select
              className="border p-2 w-full"
              value={jawabanSingle}
              onChange={(e) => setJawabanSingle(Number(e.target.value))}
            >
              <option value={1}>Benar</option>
              <option value={0}>Salah</option>
            </select>
          )}

          <input
            type="number"
            className="border p-2 w-full"
            placeholder="Batas waktu soal (detik)"
            value={batasWaktu}
            onChange={(e) => setBatasWaktu(e.target.value)}
          />

          <button
            onClick={addQuestion}
            className="bg-blue-700 text-white px-4 py-2 rounded flex gap-2"
          >
            <FaPlus /> Tambah Soal
          </button>
        </div>

        {/* LIST */}
        <div className="space-y-2">
          {questions.map((q, i) => (
            <div key={q.id} className="border p-3 rounded flex justify-between">
              <div>
                {i + 1}. {q.pertanyaan}{" "}
                <span className="text-xs text-gray-500">
                  ({q.tipe_pertanyaan})
                </span>
              </div>
              <button
                className="text-red-600"
                onClick={() =>
                  setQuestions(x => x.filter((_, idx) => idx !== i))
                }
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={saveQuiz}
          className="bg-green-600 text-white px-6 py-3 rounded"
        >
          Simpan Kuis
        </button>
      </div>
    </ProtectedLayout>
  );
}
