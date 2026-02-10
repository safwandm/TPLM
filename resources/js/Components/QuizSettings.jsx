export default function QuizSettings({
  judul,
  setJudul,
  totalWaktu,
  setTotalWaktu,
  showAnswer,
  setShowAnswer,
  showRank,
  setShowRank,
}) {
  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-4">
      <h2 className="font-semibold text-lg">Pengaturan Kuis</h2>

      {/* Title */}
      <input
        className="border p-3 w-full rounded"
        placeholder="Masukkan judul kuis"
        value={judul}
        onChange={(e) => setJudul(e.target.value)}
      />

      {/* Settings Row */}
      <div className="flex gap-4 flex-wrap">
        <input
          type="number"
          className="border p-3 rounded w-full md:w-auto flex-1"
          placeholder="Total waktu kuis (opsional, detik)"
          value={totalWaktu}
          onChange={(e) => setTotalWaktu(e.target.value)}
        />

        <label className="flex items-center gap-2 whitespace-nowrap">
          <input
            type="checkbox"
            checked={showAnswer}
            onChange={(e) => setShowAnswer(e.target.checked)}
          />
          Tunjukkan Jawaban
        </label>

        <label className="flex items-center gap-2 whitespace-nowrap">
          <input
            type="checkbox"
            checked={showRank}
            onChange={(e) => setShowRank(e.target.checked)}
          />
          Tunjukkan Peringkat
        </label>
      </div>
    </div>
  );
}
