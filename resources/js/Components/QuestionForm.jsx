import { FaPlus } from "react-icons/fa";

export default function QuestionForm({
  setEditingIndex,
  tipe,
  setTipe,
  text,
  setText,
  imageUrl,
  setImageUrl,
  mathEq,
  setMathEq,
  opsi,
  setOpsi,
  matchingPairs,
  setMatchingPairs,
  jawabanSingle,
  setJawabanSingle,
  jawabanMulti,
  setJawabanMulti,
  batasWaktu,
  setBatasWaktu,
  editingIndex,
  addQuestion,
}) {

  function resetForm() {
    setEditingIndex(null);
    setTipe("multiple_choice_single");
    setText("");
    setImageUrl("");
    setMathEq("");
    setOpsi(["", "", "", ""]);
    setJawabanSingle(0);
    setJawabanMulti([]);
    setBatasWaktu("");
    setMatchingPairs([
      { kiri: "", kanan: "" },
      { kiri: "", kanan: "" },
    ]);
  }


  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-4">
      <h2 className="font-semibold text-lg">Tambah Pertanyaan</h2>

      {/* TYPE */}
      <select
        className="border p-3 w-full rounded"
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
        <option value="ordering">Ordering (Susun Urutan)</option>
        <option value="matching">Matching (Menjodohkan)</option>
      </select>

      {/* QUESTION TEXT */}
      <textarea
        className="border p-3 w-full rounded"
        placeholder="Masukkan pertanyaan kuis"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      {/* MEDIA */}
      <div className="grid grid-cols-2 gap-4">
        <input
          className="border p-3 rounded w-full"
          placeholder="URL Gambar (opsional)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />

        <input
          className="border p-3 rounded w-full"
          placeholder="Persamaan matematika (opsional)"
          value={mathEq}
          onChange={(e) => setMathEq(e.target.value)}
        />
      </div>

      {/* MULTIPLE CHOICE */}
      {(tipe === "multiple_choice_single" ||
        tipe === "multiple_choice_multi") && (
          <div className="grid grid-cols-2 gap-6 mt-4 max-w-md">
            {opsi.map((o, i) => (
              <div key={i} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={
                    tipe === "multiple_choice_single"
                      ? jawabanSingle === i
                      : jawabanMulti.includes(i)
                  }
                  onChange={(e) => {
                    if (tipe === "multiple_choice_single") {
                      setJawabanSingle(i);
                    } else {
                      if (e.target.checked) {
                        setJawabanMulti((prev) => [...prev, i]);
                      } else {
                        setJawabanMulti((prev) => prev.filter((x) => x !== i));
                      }
                    }
                  }}
                />

                <input
                  className="border p-3 rounded w-full"
                  placeholder={`Masukkan pilihan ${String.fromCharCode(
                    97 + i
                  )}`}
                  value={o}
                  onChange={(e) => {
                    const copy = [...opsi];
                    copy[i] = e.target.value;
                    setOpsi(copy);
                  }}
                />
              </div>
            ))}
          </div>
        )}

      {/* ORDERING */}
      {tipe === "ordering" && (
        <div className="space-y-3 mt-4 max-w-md">
          {opsi.map((o, i) => (
            <div
              key={i}
              className="flex items-center gap-3 border rounded-xl p-3 bg-gray-50"
            >
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white font-semibold">
                {i + 1}
              </div>

              <input
                className="border p-2 rounded w-full"
                placeholder={`Langkah ${i + 1}`}
                value={o}
                onChange={(e) => {
                  const copy = [...opsi];
                  copy[i] = e.target.value;
                  setOpsi(copy);
                }}
              />

              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                  disabled={i === 0}
                  onClick={() => {
                    if (i === 0) return;
                    const copy = [...opsi];
                    [copy[i - 1], copy[i]] = [copy[i], copy[i - 1]];
                    setOpsi(copy);
                  }}
                >
                  ↑
                </button>

                <button
                  type="button"
                  className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                  disabled={i === opsi.length - 1}
                  onClick={() => {
                    if (i === opsi.length - 1) return;
                    const copy = [...opsi];
                    [copy[i + 1], copy[i]] = [copy[i], copy[i + 1]];
                    setOpsi(copy);
                  }}
                >
                  ↓
                </button>
              </div>
            </div>
          ))}

          <p className="text-sm text-gray-500">
            Susun dari atas ke bawah. Gunakan tombol ↑ ↓ untuk mengubah urutan.
          </p>
        </div>
      )}

      {/* MATCHING */}
      {tipe === "matching" && (
        <div className="space-y-4 mt-4 max-w-xl">
          {matchingPairs.map((pair, i) => (
            <div key={i} className="flex items-center gap-3">
              <input
                className="border p-3 rounded w-full"
                placeholder={`Item kiri ${i + 1}`}
                value={pair.kiri}
                onChange={(e) => {
                  const copy = [...matchingPairs];
                  copy[i].kiri = e.target.value;
                  setMatchingPairs(copy);
                }}
              />

              <span className="text-gray-400">↔</span>

              <input
                className="border p-3 rounded w-full"
                placeholder={`Item kanan ${i + 1}`}
                value={pair.kanan}
                onChange={(e) => {
                  const copy = [...matchingPairs];
                  copy[i].kanan = e.target.value;
                  setMatchingPairs(copy);
                }}
              />

              {matchingPairs.length > 2 && (
                <button
                  type="button"
                  className="text-red-500 hover:text-red-600 font-bold"
                  onClick={() => {
                    setMatchingPairs((prev) =>
                      prev.filter((_, idx) => idx !== i)
                    );
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          {matchingPairs.length < 4 && (
            <button
              type="button"
              className="text-blue-600 font-semibold hover:text-blue-700"
              onClick={() => {
                setMatchingPairs((prev) => [
                  ...prev,
                  { kiri: "", kanan: "" },
                ]);
              }}
            >
              + Tambah pasangan
            </button>
          )}

          <p className="text-sm text-gray-500">
            Minimal 2 pasangan, maksimal 4.
          </p>
        </div>
      )}

      {/* TRUE FALSE */}
      {tipe === "true_false" && (
        <select
          className="border p-3 w-full rounded"
          value={jawabanSingle}
          onChange={(e) => setJawabanSingle(Number(e.target.value))}
        >
          <option value={1}>Benar</option>
          <option value={0}>Salah</option>
        </select>
      )}

      {/* TIME LIMIT */}
      <input
        type="number"
        className="border p-3 w-full rounded"
        placeholder="Masukkan batas waktu soal (detik)"
        value={batasWaktu}
        min={3}
        onChange={(e) => setBatasWaktu(e.target.value)}
      />

      {/* SUBMIT */}
      <button
        onClick={() => {
          addQuestion(resetForm);
        }}
        className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded flex items-center gap-2"
      >
        <FaPlus /> {editingIndex !== null ? "Update Soal" : "Tambahkan Soal"}
      </button>
    </div>
  );
}
