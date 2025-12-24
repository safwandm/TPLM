<?php

namespace App\Http\Controllers\Api;

use App\Events\UpdateLeaderboard;
use App\Models\JawabanPeserta;
use Illuminate\Http\Request;
use App\Models\Pertanyaan;
use App\Models\SesiKuis;
use App\Models\SesiPeserta;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class PertanyaanController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'kuis_id' => 'required|exists:kuis,id',
            'pertanyaan' => 'required|string',
            'opsi_a' => 'required|string',
            'opsi_b' => 'required|string',
            'opsi_c' => 'required|string',
            'opsi_d' => 'required|string',
            'jawaban_benar' => 'required|in:a,b,c,d',
            'url_gambar' => 'nullable|string',
            'persamaan_matematika' => 'nullable|string',
            'batas_waktu' => 'nullable|integer',
        ]);

        // Ambil urutan terbesar untuk kuis ini
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
            'opsi_c' => 'sometimes|string',
            'opsi_d' => 'sometimes|string',
            'jawaban_benar' => 'sometimes|in:a,b,c,d',
            'url_gambar' => 'nullable|string',
            'persamaan_matematika' => 'nullable|string',
            'batas_waktu' => 'nullable|integer',
            'urutan' => 'nullable|integer'
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
