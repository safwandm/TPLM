import { useState, useEffect } from "react";

export default function QuestionForm({
  onSubmit,
  editingQuestion,
  onCancel
}) {

  const [id] = useState(editingQuestion?.id ?? null);
  const [text, setText] = useState(editingQuestion?.text ?? "");
  const [image, setImage] = useState(editingQuestion?.image ?? "");
  const [math, setMath] = useState(editingQuestion?.math ?? "");
  const [options, setOptions] = useState(editingQuestion?.options ?? { a: "", b: "", c: "", d: "" });
  const [correct, setCorrect] = useState(editingQuestion?.correct ?? "a");
  const [timer, setTimer] = useState(editingQuestion?.timer ?? "");

  function submit() {
    if (!text.trim()) return alert("Pertanyaan kosong");

    onSubmit({
      id,
      text,
      image,
      math,
      options,
      correct,
      timer
    });

    if (!editingQuestion) {
      setText(""); setImage(""); setMath("");
      setOptions({ a: "", b: "", c: "", d: "" });
      setCorrect("a"); setTimer("");
    }
  }

  useEffect(() => {
    if (!editingQuestion) return;

    setText(editingQuestion.text);
    setImage(editingQuestion.image ?? "");
    setMath(editingQuestion.math ?? "");
    setOptions(editingQuestion.options);
    setCorrect(editingQuestion.correct);
    setTimer(editingQuestion.timer ?? "");
  }, [editingQuestion]);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="font-semibold text-lg mb-3">
        {editingQuestion ? "Edit Pertanyaan" : "Tambah Pertanyaan"}
      </h2>

      <textarea className="w-full border p-2 rounded mb-2" value={text} onChange={e => setText(e.target.value)} />

      <input className="w-full border p-2 rounded mb-2" placeholder="URL Gambar" value={image} onChange={e => setImage(e.target.value)} />
      <input className="w-full border p-2 rounded mb-2" placeholder="Persamaan" value={math} onChange={e => setMath(e.target.value)} />

      <div className="grid grid-cols-2 gap-2 mb-2">
        {["a", "b", "c", "d"].map(k => (
          <input
            key={k}
            className="border p-2 rounded"
            placeholder={k.toUpperCase()}
            value={options[k]}
            onChange={e => setOptions(o => ({ ...o, [k]: e.target.value }))}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <select className="border p-2 rounded" value={correct} onChange={e => setCorrect(e.target.value)}>
          {["a", "b", "c", "d"].map(k => <option key={k} value={k}>Jawaban {k.toUpperCase()}</option>)}
        </select>

        <input type="number" className="border p-2 rounded" placeholder="Timer" value={timer} onChange={e => setTimer(e.target.value)} />
      </div>

      <div className="flex gap-3">
        <button onClick={submit} className="bg-blue-700 text-white px-4 py-2 rounded">
          {editingQuestion ? "Simpan Perubahan" : "Tambah Soal"}
        </button>

        {editingQuestion && (
          <button onClick={onCancel} className="text-gray-500">Batal</button>
        )}
      </div>
    </div>
  );
}
