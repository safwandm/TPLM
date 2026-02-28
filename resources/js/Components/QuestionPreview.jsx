import { FaTrash } from "react-icons/fa";
import { useState } from "react";

export default function QuestionPreview({ q, index, onEdit, onDelete }) {

  const [imgError, setImgError] = useState(false);
  const imageSrc = q.image_url || q.url_gambar || null;

  return (
    <div className="relative border border-gray-200 rounded-2xl p-6 shadow-sm bg-white">
      {/* Actions */}
      <div className="absolute top-4 right-4 flex gap-3">
        <button
          className="text-blue-500 hover:text-blue-600 font-semibold"
          onClick={onEdit}
        >
          Edit
        </button>

        <button
          className="text-red-500 hover:text-red-600"
          onClick={onDelete}
        >
          <FaTrash />
        </button>
      </div>

      {/* Question Body */}
      <div className="space-y-3 w-full">
        <div className="font-semibold text-lg">
          {index + 1}. {q.pertanyaan}
        </div>

        {/* Image */}
        {imageSrc && (
          <div className="space-y-2">
            {!imgError ? (
              <img
                src={imageSrc} alt="question"
                className="w-56 h-36 object-cover rounded-lg border"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-56 h-36 flex items-center justify-center rounded-lg border border-red-400 bg-red-50 text-red-600 text-sm text-center px-3">
                Gambar gagal dimuat. Link mungkin tidak valid.
              </div>
            )}
          </div>
        )}

        {/* Math Equation */}
        {q.persamaan && (
          <div className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm">
            Persamaan: {q.persamaan}
          </div>
        )}

        {/* ORDERING */}
        {q.tipe_pertanyaan === "ordering" && Array.isArray(q.opsi) && (
          <div className="mt-3 w-full max-w-md space-y-1">
            {q.opsi.map((o, idx) => (
              <div key={idx} className="flex items-center gap-2 py-1">
                <span className="font-semibold text-gray-500 w-6">
                  {idx + 1}.
                </span>
                <span className="text-gray-800">{o}</span>
              </div>
            ))}
          </div>
        )}

        {/* MATCHING */}
        {q.tipe_pertanyaan === "matching" && q.opsi?.kiri && (
          <div className="mt-3 w-full max-w-md border rounded-xl overflow-hidden">
            <div className="grid grid-cols-2 bg-gray-100 text-sm font-semibold text-gray-600">
              <div className="p-2 border-r">Kiri</div>
              <div className="p-2">Kanan</div>
            </div>

            {q.opsi.kiri.map((left, idx) => (
              <div key={idx} className="grid grid-cols-2 border-t">
                <div className="p-3 border-r bg-gray-50">{left}</div>
                <div className="p-3">{q.opsi.kanan[idx] ?? "—"}</div>
              </div>
            ))}
          </div>
        )}

        {/* MULTIPLE CHOICE */}
        {Array.isArray(q.opsi) &&
          q.tipe_pertanyaan !== "ordering" &&
          q.tipe_pertanyaan !== "matching" && (
            <div className="grid grid-cols-2 gap-3 mt-3 w-full">
              {q.opsi.map((o, idx) => {
                const isCorrect = Array.isArray(q.jawaban_benar)
                  ? q.jawaban_benar.includes(idx)
                  : q.jawaban_benar === idx;

                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-center h-12 w-full text-sm font-semibold border rounded-lg
                      ${isCorrect
                        ? "bg-green-100 border-green-400 text-gray-900"
                        : "bg-gray-100 border-gray-200 text-gray-700"}`}
                  >
                    {o}
                  </div>
                );
              })}
            </div>
          )}

        {/* TRUE / FALSE */}
        {!q.opsi && q.tipe_pertanyaan === "true_false" && (
          <div className="grid grid-cols-2 gap-3 mt-3 w-full">
            {["Benar", "Salah"].map((label, idx) => {
              const isCorrect = q.jawaban_benar === true ? idx === 0 : idx === 1;

              return (
                <div
                  key={idx}
                  className={`flex items-center justify-center h-12 w-full text-sm font-semibold border rounded-lg
                    ${isCorrect
                      ? "bg-green-100 border-green-400 text-gray-900"
                      : "bg-gray-100 border-gray-200 text-gray-700"}`}
                >
                  {label}
                </div>
              );
            })}
          </div>
        )}

        {/* Time + Score Info */}
        <div className="text-sm text-gray-400 mt-2 flex gap-4 flex-wrap">
          {q.batas_waktu && (
            <span>Batas waktu: {q.batas_waktu} detik</span>
          )}
          <span>Skor: {q.skor ?? 5}</span>
          <span>Bonus waktu: {q.skor_bonus_waktu ?? 5}</span>
        </div>
      </div>
    </div>
  );
}
