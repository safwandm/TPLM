import { useEffect, useRef, useState } from "react";
import ProtectedLayout from "@/Layouts/ProtectedLayout";
import webFetch from "@/lib/webFetch";
import { WebAPI } from "@/lib/api.web";
import { FaPlus, FaTrash } from "react-icons/fa";

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

  /* ================= FORM ================= */
  const [editingId, setEditingId] = useState(null);
  const [tipe, setTipe] = useState("multiple_choice_single");
  const [text, setText] = useState("");
  const [opsi, setOpsi] = useState(["", "", "", ""]);
  const [jawabanSingle, setJawabanSingle] = useState(0);
  const [jawabanMulti, setJawabanMulti] = useState([]);
  const [batasWaktu, setBatasWaktu] = useState("");

  /* ================= CSRF ================= */
  function getCsrfToken() {
    return decodeURIComponent(
      document.cookie
        .split("; ")
        .find((r) => r.startsWith("XSRF-TOKEN="))
        ?.split("=")[1] ?? ""
    );
  }

  /* ================= FETCH ================= */
  useEffect(() => {
    webFetch(WebAPI.teacher.quiz(quizId))
      .then((r) => r.json())
      .then((data) => {
        setJudul(data.judul);
        setTotalWaktu(data.total_waktu ?? "");
        setShowAnswer(data.tampilkan_jawaban_benar);
        setShowRank(data.tampilkan_peringkat);

        setQuestions(
          data.pertanyaan.map((p) => ({
            id: p.id,
            tipe_pertanyaan: p.tipe_pertanyaan,
            pertanyaan: p.pertanyaan,
            opsi: p.opsi,
            jawaban_benar: p.jawaban_benar,
            batas_waktu: p.batas_waktu,
          }))
        );
      });
  }, [quizId]);

  /* ================= HELPERS ================= */
  function resetForm() {
    setEditingId(null);
    setTipe("multiple_choice_single");
    setText("");
    setOpsi(["", "", "", ""]);
    setJawabanSingle(0);
    setJawabanMulti([]);
    setBatasWaktu("");
  }

  function startEdit(q) {
    setEditingId(q.id);
    setTipe(q.tipe_pertanyaan);
    setText(q.pertanyaan);
    setBatasWaktu(q.batas_waktu ?? "");

    if (q.tipe_pertanyaan === "true_false") {
      setJawabanSingle(q.jawaban_benar[0] ? 1 : 0);
      setOpsi(["", "", "", ""]);
      setJawabanMulti([]);
    } 
    else if (q.tipe_pertanyaan === "multiple_choice_multi") {
      setOpsi(q.opsi);
      setJawabanMulti(q.jawaban_benar);
    } 
    else {
      setOpsi(q.opsi);
      setJawabanSingle(q.jawaban_benar[0]);
      setJawabanMulti([]);
    }

    editRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  /* ================= SUBMIT ================= */
  function submitQuestion() {
    if (!text.trim()) return alert("Pertanyaan wajib diisi");

    let payload = {
      tipe_pertanyaan: tipe,
      pertanyaan: text,
      batas_waktu: batasWaktu ? Number(batasWaktu) : null,
    };

    if (tipe === "true_false") {
      payload.opsi = null;
      payload.jawaban_benar = Boolean(jawabanSingle);
    } 
    else if (tipe === "multiple_choice_multi") {
      payload.opsi = opsi.filter(o => o.trim());
      payload.jawaban_benar = jawabanMulti;
    } 
    else {
      payload.opsi = opsi.filter(o => o.trim());
      payload.jawaban_benar = jawabanSingle;
    }

    if (editingId) {
      updatedRef.current.set(editingId, payload);
      setQuestions(qs =>
        qs.map(q => q.id === editingId ? { ...q, ...payload } : q)
      );
    } else {
      const tempId = `temp-${Date.now()}`;
      addedRef.current.push({ ...payload, kuis_id: quizId });

      setQuestions(qs => [...qs, { id: tempId, ...payload }]);
    }

    resetForm();
  }

  /* ================= DELETE ================= */
  function deleteQuestion(id) {
    if (!confirm("Hapus soal?")) return;

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
      /* QUIZ */
      await webFetch(WebAPI.teacher.quiz(quizId), {
        method: "PUT",
        headers: { "X-XSRF-TOKEN": getCsrfToken() },
        body: JSON.stringify({
          judul,
          total_waktu: totalWaktu,
          tampilkan_jawaban_benar: showAnswer,
          tampilkan_peringkat: showRank,
        }),
      });

      /* DELETE */
      for (const id of deletedRef.current) {
        await webFetch(WebAPI.teacher.question(id), {
          method: "DELETE",
          headers: { "X-XSRF-TOKEN": getCsrfToken() },
        });
      }

      /* UPDATE */
      for (const [id, payload] of updatedRef.current.entries()) {
        await webFetch(WebAPI.teacher.question(id), {
          method: "PUT",
          headers: { "X-XSRF-TOKEN": getCsrfToken() },
          body: JSON.stringify(payload),
        });
      }

      /* ADD */
      for (const q of addedRef.current) {
        await webFetch(WebAPI.teacher.createQuestion, {
          method: "POST",
          headers: { "X-XSRF-TOKEN": getCsrfToken() },
          body: JSON.stringify(q),
        });
      }

      alert("Perubahan disimpan");
      window.location.href = "/dashboard";
    } catch (e) {
      console.error(e);
      alert("Gagal menyimpan perubahan");
    }
  }

  /* ================= UI ================= */
  return (
    <ProtectedLayout allowedRoles={["teacher"]}>
      <div className="max-w-4xl mx-auto space-y-6">

        <div className="flex justify-between">
          <button onClick={() => window.history.back()}>← Kembali</button>
          <button onClick={saveQuiz} className="bg-green-600 text-white px-4 py-2 rounded">
            Simpan
          </button>
        </div>

        {/* QUIZ */}
        <div className="bg-white p-4 rounded shadow space-y-3">
          <input className="border p-2 w-full" value={judul} onChange={e => setJudul(e.target.value)} />
          <input type="number" className="border p-2 w-full" value={totalWaktu} onChange={e => setTotalWaktu(e.target.value)} />
        </div>

        {/* FORM */}
        <div ref={editRef} className="bg-white p-4 rounded shadow space-y-3">
          <select value={tipe} onChange={e => setTipe(e.target.value)} className="border p-2 w-full">
            <option value="multiple_choice_single">Single</option>
            <option value="multiple_choice_multi">Multi</option>
            <option value="true_false">True / False</option>
          </select>

          <textarea className="border p-2 w-full" value={text} onChange={e => setText(e.target.value)} />

          {tipe !== "true_false" &&
            opsi.map((o, i) => (
              <input key={i} className="border p-2 w-full" value={o}
                onChange={e => {
                  const c = [...opsi];
                  c[i] = e.target.value;
                  setOpsi(c);
                }} />
            ))}

          {tipe === "multiple_choice_single" && (
            <select className="border p-2 w-full" value={jawabanSingle} onChange={e => setJawabanSingle(Number(e.target.value))}>
              {opsi.map((_, i) => <option key={i} value={i}>Jawaban {i + 1}</option>)}
            </select>
          )}

          {tipe === "multiple_choice_multi" &&
            opsi.map((o, i) => o.trim() && (
              <label key={i} className="flex gap-2">
                <input type="checkbox"
                  checked={jawabanMulti.includes(i)}
                  onChange={() =>
                    setJawabanMulti(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i])
                  }
                />
                {o}
              </label>
            ))}

          {tipe === "true_false" && (
            <select className="border p-2 w-full" value={jawabanSingle} onChange={e => setJawabanSingle(Number(e.target.value))}>
              <option value={1}>Benar</option>
              <option value={0}>Salah</option>
            </select>
          )}

          <button onClick={submitQuestion} className="bg-blue-700 text-white px-4 py-2 rounded flex gap-2">
            <FaPlus /> {editingId ? "Update Soal" : "Tambah Soal"}
          </button>
        </div>

        {/* LIST */}
        {questions.map((q, i) => (
          <div key={q.id} className="border p-3 rounded flex justify-between">
            <div>{i + 1}. {q.pertanyaan} ({q.tipe_pertanyaan})</div>
            <div className="flex gap-3">
              <button onClick={() => startEdit(q)}>Edit</button>
              <button onClick={() => deleteQuestion(q.id)} className="text-red-600">
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ProtectedLayout>
  );
}
