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
            'mode' => 'required|in:single,multiple,true_false',

            'pertanyaan' => 'required|string',
            'opsi_a' => 'required|string',
            'opsi_b' => 'required|string',
            'opsi_c' => 'nullable|string',
            'opsi_d' => 'nullable|string',

            'jawaban_benar' => 'required|array|min:1',
            'jawaban_benar.*' => 'in:a,b,c,d',

            'url_gambar' => 'nullable|string',
            'persamaan_matematika' => 'nullable|string',
            'batas_waktu' => 'nullable|integer',
        ]);

        // 🔐 Enforce mode rules
        if (
            in_array($validated['mode'], ['single', 'true_false']) &&
            count($validated['jawaban_benar']) !== 1
        ) {
            return response()->json([
                'message' => 'Mode ini hanya boleh satu jawaban benar'
            ], 422);
        }

        // 🔐 Prevent pointing to empty options
        foreach ($validated['jawaban_benar'] as $ans) {
            if (empty($validated["opsi_$ans"])) {
                return response()->json([
                    'message' => "Jawaban benar menunjuk ke opsi kosong ($ans)"
                ], 422);
            }
        }

        // 📊 Auto-order
        $nextOrder = Pertanyaan::where('kuis_id', $validated['kuis_id'])
            ->max('urutan');

        $validated['urutan'] = ($nextOrder ?? 0) + 1;

        $pertanyaan = Pertanyaan::create($validated);

        return response()->json($pertanyaan, 201);
    }

    public function update(Request $request, $id)
    {
        $pertanyaan = Pertanyaan::findOrFail($id);

        $validated = $request->validate([
            'pertanyaan' => 'sometimes|string',

            'opsi_a' => 'sometimes|string',
            'opsi_b' => 'sometimes|string',
            'opsi_c' => 'nullable|string',
            'opsi_d' => 'nullable|string',

            'jawaban_benar' => 'sometimes|array|min:1',
            'jawaban_benar.*' => 'in:a,b,c,d',

            'mode' => 'sometimes|in:single,multiple,true_false',

            'url_gambar' => 'nullable|string',
            'persamaan_matematika' => 'nullable|string',
            'batas_waktu' => 'nullable|integer',
            'urutan' => 'nullable|integer',
        ]);

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

        $pertanyaan->update($validated);

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
