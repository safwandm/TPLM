<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Pertanyaan;

class PertanyaanController extends Controller
{

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kuis_id' => 'required|exists:kuis,id',

            'tipe_pertanyaan' => 'required|string',
            'pertanyaan' => 'required|string',
            'opsi' => 'nullable',
            'jawaban_benar' => 'required',

            'url_gambar' => 'nullable|string',
            'persamaan_matematika' => 'nullable|string',
            'batas_waktu' => 'nullable|integer',

            'skor' => 'nullable|integer|min:1',
            'skor_bonus_waktu' => 'nullable|integer|min:1',
        ]);

        $urutan = (Pertanyaan::where('kuis_id', $validated['kuis_id'])->max('urutan') ?? 0) + 1;

        $pertanyaan = Pertanyaan::createValidated([
            'kuis_id' => $validated['kuis_id'],
            'urutan' => $urutan,

            'tipe_pertanyaan' => $validated['tipe_pertanyaan'],
            'pertanyaan' => $validated['pertanyaan'],
            'opsi' => $validated['opsi'],
            'jawaban_benar' => $validated['jawaban_benar'],

            'url_gambar' => $validated['url_gambar'] ?? null,
            'persamaan_matematika' => $validated['persamaan_matematika'] ?? null,
            'batas_waktu' => $validated['batas_waktu'] ?? null,

            'skor' => $validated['skor'] ?? config('quiz.base_score'),
            'skor_bonus_waktu' => $validated['skor_bonus_waktu'] ?? config('quiz.time_bonus_score'),
        ]);

        return response()->json($pertanyaan, 201);
    }

    public function update(Request $request, $id)
    {
        $pertanyaan = Pertanyaan::findOrFail($id);

        $validated = $request->validate([
            'tipe_pertanyaan' => 'sometimes|string',
            'pertanyaan' => 'sometimes|string',
            'opsi' => 'nullable',
            'jawaban_benar' => 'sometimes',

            'url_gambar' => 'nullable|string',
            'url_video' => 'nullable|string',
            'url_audio' => 'nullable|string',
            'persamaan_matematika' => 'nullable|string',
            'batas_waktu' => 'nullable|integer',
            'urutan' => 'nullable|integer',

            'skor' => 'nullable|integer|min:1',
            'skor_bonus_waktu' => 'nullable|integer|min:1',
        ]);

        if (isset($validated['urutan']) && $validated['urutan'] !== $pertanyaan->urutan) {
            $other = Pertanyaan::where('kuis_id', $pertanyaan->kuis_id)
                ->where('urutan', $validated['urutan'])
                ->first();

            if ($other) {
                $other->update(['urutan' => $pertanyaan->urutan]);
            }
        }

        $pertanyaan->updateValidated($validated);

        return response()->json($pertanyaan);
    }

    public function destroy($id)
    {
        $pertanyaan = Pertanyaan::findOrFail($id);
        $kuisId = $pertanyaan->kuis_id;

        $pertanyaan->delete();

        $pertanyaans = Pertanyaan::where('kuis_id', $kuisId)
            ->orderBy('urutan')
            ->get();

        $urut = 1;
        foreach ($pertanyaans as $p) {
            if ($p->urutan != $urut) {
                $p->update(['urutan' => $urut]);
            }
            $urut++;
        }

        return response()->json(['message' => 'Pertanyaan dihapus & urutan diperbarui']);
    }
}
