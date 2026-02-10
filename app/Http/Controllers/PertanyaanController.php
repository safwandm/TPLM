<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Kuis;
use App\Models\Pertanyaan;

class PertanyaanController extends Controller
{
    /* ================= CREATE QUESTION ================= */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'kuis_id' => 'required|exists:kuis,id',
            'tipe_pertanyaan' => 'required|string',
            'pertanyaan' => 'required|string',
            'opsi' => 'nullable',
            'jawaban_benar' => 'required',

            'url_gambar' => 'nullable|string',
            'url_video' => 'nullable|string',
            'url_audio' => 'nullable|string',
            'persamaan_matematika' => 'nullable|string',
            'batas_waktu' => 'nullable|integer',

            'skor' => 'nullable|integer|min:1',
            'skor_bonus_waktu' => 'nullable|integer|min:1',
        ]);

        /* ================= SAFETY: ANSWER RULES ================= */

        // enforce single answer for certain types
        if (
            in_array($validated['tipe_pertanyaan'], ['multiple_choice_single', 'true_false']) &&
            is_array($validated['jawaban_benar']) &&
            count($validated['jawaban_benar']) !== 1
        ) {
            return response()->json([
                'message' => 'Tipe ini hanya boleh satu jawaban benar'
            ], 422);
        }

        // prevent correct answer pointing to empty option (ONLY for list-based opsi)
        if (
            !empty($validated['opsi']) &&
            is_array($validated['opsi']) &&
            array_is_list($validated['opsi']) && // <-- ensures this is NOT matching
            is_array($validated['jawaban_benar'])
        ) {

            foreach ($validated['jawaban_benar'] as $idx) {

                if (!isset($validated['opsi'][$idx]) || trim((string)$validated['opsi'][$idx]) === '') {

                    return response()->json([
                        'message' => "Jawaban menunjuk ke opsi kosong"
                    ], 422);
                }
            }
        }

        // auto order
        $nextOrder = Pertanyaan::where('kuis_id', $validated['kuis_id'])
            ->max('urutan');

        $validated['urutan'] = ($nextOrder ?? 0) + 1;

        $pertanyaan = Pertanyaan::createValidated($validated);

        return response()->json($pertanyaan, 201);
    }

    /* ================= UPDATE ================= */
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

            'skor' => 'nullable|integer|min:1',
            'skor_bonus_waktu' => 'nullable|integer|min:1',
        ]);


        /* ================= SAFETY: ANSWER RULES ================= */

        if (
            isset($validated['tipe_pertanyaan']) &&
            in_array($validated['tipe_pertanyaan'], ['multiple_choice_single', 'true_false']) &&
            isset($validated['jawaban_benar']) &&
            is_array($validated['jawaban_benar']) &&
            count($validated['jawaban_benar']) !== 1
        ) {
            return response()->json([
                'message' => 'Tipe ini hanya boleh satu jawaban benar'
            ], 422);
        }

        if (
            isset($validated['opsi']) &&
            is_array($validated['opsi']) &&
            array_is_list($validated['opsi']) && // ensures this is NOT matching
            isset($validated['jawaban_benar']) &&
            is_array($validated['jawaban_benar'])
        ) {

            foreach ($validated['jawaban_benar'] as $idx) {

                if (!isset($validated['opsi'][$idx]) || trim((string)$validated['opsi'][$idx]) === '') {
                    return response()->json([
                        'message' => "Jawaban menunjuk ke opsi kosong"
                    ], 422);
                }
            }
        }

        /* ================= OPTIONAL: ORDER SWAP ================= */

        if ($request->has('urutan')) {

            $newOrder = $request->urutan;
            $oldOrder = $pertanyaan->urutan;
            $kuisId   = $pertanyaan->kuis_id;

            if ($newOrder !== $oldOrder) {

                $other = Pertanyaan::where('kuis_id', $kuisId)
                    ->where('urutan', $newOrder)
                    ->first();

                if ($other) {
                    $other->update(['urutan' => $oldOrder]);
                }

                $validated['urutan'] = $newOrder;
            }
        }

        $pertanyaan->updateValidated($validated);

        return response()->json($pertanyaan);
    }

    /* ================= DELETE ================= */
    public function destroy($id)
    {
        $pertanyaan = Pertanyaan::findOrFail($id);
        $kuisId = $pertanyaan->kuis_id;

        $pertanyaan->delete();

        // re-order questions
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
