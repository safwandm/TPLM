import { useState } from "react";

export default function QuizSettingsCard({
  title, setTitle,
  duration, setDuration,
  showAnswers, setShowAnswers,
  showLeaderboard, setShowLeaderboard,
  onBack,
  onSave,
  saveLabel = "Simpan"
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between mb-6">
        <button onClick={onBack} className="text-blue-700">← Kembali</button>
        <button onClick={onSave} className="bg-green-600 text-white px-4 py-2 rounded">
          {saveLabel}
        </button>
      </div>

      <h2 className="font-semibold text-lg mb-3">Pengaturan Kuis</h2>

      <div className="space-y-4">
        <input
          className="w-full border p-2 rounded"
          placeholder="Judul Kuis"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />

        <input
          type="number"
          className="w-full border p-2 rounded"
          placeholder="Durasi (detik)"
          value={duration}
          onChange={e => setDuration(e.target.value)}
        />

        <div className="flex gap-6">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showAnswers} onChange={e => setShowAnswers(e.target.checked)} />
            Tampilkan Jawaban
          </label>

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showLeaderboard} onChange={e => setShowLeaderboard(e.target.checked)} />
            Tampilkan Peringkat
          </label>
        </div>
      </div>
    </div>
  );
}
