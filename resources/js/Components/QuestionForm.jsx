import { FaPlus } from "react-icons/fa";
import { useState, useEffect } from "react";

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
  skor,
  setSkor,
  skorBonusWaktu,
  setSkorBonusWaktu,
  editingIndex,
  addQuestion,
}) {

  const [imageError, setImageError] = useState(false);
  const [showScoreInfo, setShowScoreInfo] = useState(false);

  function validateImage(url) {
    if (!url) {
      setImageError(false);
      return;
    }

    const img = new Image();
    img.onload = () => setImageError(false);
    img.onerror = () => setImageError(true);
    img.src = url;
  }

  useEffect(() => {
    validateImage(imageUrl);
  }, [imageUrl]);

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
    setSkor(null);
    setSkorBonusWaktu(null);
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
      <h3 className="font-semibold">Pertanyaan</h3>
      <textarea
        className="border p-3 w-full rounded"
        placeholder="Masukkan pertanyaan kuis"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      {/* MEDIA */}
      <h3 className="font-semibold">Media (opsional)</h3>
      <div className="grid grid-cols-2 gap-4">

        <input
          className={`border p-3 rounded w-full ${imageError ? "border-red-500" : ""}`}
          placeholder="URL Gambar (opsional)"
          value={imageUrl}
          onChange={(e) => {
            const url = e.target.value;
            setImageUrl(url);
            validateImage(url);
          }} />

        {imageError && (
          <div className="text-red-500 text-sm col-span-2">
            URL gambar tidak valid atau tidak dapat dimuat.
          </div>
        )}

        <input
          className="border p-3 rounded w-full"
          placeholder="Persamaan matematika (opsional)"
          value={mathEq}
          onChange={(e) => setMathEq(e.target.value)}
        />
      </div>

      {/* MULTIPLE CHOICE */}
      {(tipe === "multiple_choice_single" || tipe === "multiple_choice_multi") && (
        <h3 className="font-semibold">Pilihan Jawaban</h3>
      )}
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
      {tipe === "ordering" && <h3 className="font-semibold">Urutan Jawaban</h3>}
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
      {tipe === "matching" && <h3 className="font-semibold">Pasangan Matching</h3>}
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
      {tipe === "true_false" && <h3 className="font-semibold">Jawaban Benar</h3>}
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
      <h3 className="font-semibold">Batas Waktu (detik)</h3>
      <input
        type="number"
        className="border p-3 w-full rounded"
        placeholder="Masukkan batas waktu soal (detik)"
        value={batasWaktu}
        min={3}
        onChange={(e) => setBatasWaktu(e.target.value)}
      />

      {/* SCORING */}
      <h3 className="font-semibold">Pengaturan Skor</h3>
      <button
        type="button"
        onClick={() => setShowScoreInfo((v) => !v)}
        className="flex items-center justify-between w-full bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm font-medium text-blue-900 hover:bg-blue-100 transition"
      >
        <span>Cara perhitungan skor</span>
        <span className="text-lg">{showScoreInfo ? "−" : "+"}</span>
      </button>

      {showScoreInfo && (
        <div className="bg-blue-50 border border-blue-200 border-t-0 rounded-b-lg p-4 text-sm text-gray-700 space-y-2">
          <p>
            Skor akhir dihitung berdasarkan <strong>jawaban benar</strong> dan <strong>kecepatan menjawab</strong>.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Jika siswa menjawab sangat cepat → mendapatkan <strong>Skor Dasar + Bonus Waktu</strong> (poin maksimal).</li>
            <li>Jika menjawab di tengah waktu → mendapatkan sebagian bonus.</li>
            <li>Jika menjawab sangat lambat atau auto-submit saat waktu habis → hanya mendapatkan <strong>Skor Dasar</strong>.</li>
          </ul>
          <p className="text-gray-600">
            Rumus sederhana:<br />
            <span className="font-mono">Skor = (Skor Dasar + (Bonus Waktu × Faktor Kecepatan))</span>
          </p>
          <p className="text-gray-600">
            Faktor Kecepatan bernilai antara 0–1 (semakin cepat menjawab, semakin mendekati 1).
          </p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Skor Dasar</label>
          <input
            type="number"
            min={1}
            className="border p-3 rounded w-full"
            placeholder="Masukkan Skor dasar"
            value={skor ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setSkor(v === "" ? null : Number(v));
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Bonus Waktu</label>
          <input
            type="number"
            min={0}
            className="border p-3 rounded w-full"
            placeholder="Masukkan Bonus waktu"
            value={skorBonusWaktu ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setSkorBonusWaktu(v === "" ? null : Number(v));
            }}
          />
        </div>
      </div>

      {/* SUBMIT */}
      <div className="flex gap-3 mt-2">
        <button
          type="button"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition"
          onClick={() => {
            if (imageError) {
              alert("URL gambar tidak valid. Periksa kembali sebelum menyimpan.");
              return;
            }
            addQuestion(resetForm);
          }}
        >
          <FaPlus />
          {editingIndex !== null ? "Update Soal" : "Tambahkan Soal"}
        </button>

        {editingIndex !== null && (
          <button
            type="button"
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 font-semibold"
            onClick={resetForm}
          >
            Batal Edit
          </button>
        )}
      </div>
    </div>
  );
}
