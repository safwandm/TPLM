<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Kuis;
use App\Models\Pertanyaan;

class KuisController extends Controller
{
    public function index(Request $request)
    {
        $kuis = Kuis::where('creator_id', $request->user()->user_id)->get();
        return response()->json($kuis);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'judul' => 'required|string',
            'total_waktu' => 'nullable|integer',
            'tampilkan_jawaban_benar' => 'boolean',
            'tampilkan_peringkat' => 'boolean'
        ]);

        $kuis = Kuis::create([
            'creator_id' => $request->user()->id,
            ...$validated
        ]);

        return response()->json($kuis, 201);
    }

    public function storeWithQuestions(Request $request)
    {
        $validated = $request->validate([
            'judul' => 'required|string',
            'total_waktu' => 'nullable|integer',
            'tampilkan_jawaban_benar' => 'boolean',
            'tampilkan_peringkat' => 'boolean',

            'pertanyaan' => 'required|array',
            'pertanyaan.*.pertanyaan' => 'required|string',
            'pertanyaan.*.opsi_a' => 'required|string',
            'pertanyaan.*.opsi_b' => 'required|string',
            'pertanyaan.*.opsi_c' => 'required|string',
            'pertanyaan.*.opsi_d' => 'required|string',
            'pertanyaan.*.jawaban_benar' => 'required|in:a,b,c,d',
            'pertanyaan.*.url_gambar' => 'nullable|string',
            'pertanyaan.*.persamaan_matematika' => 'nullable|string',
            'pertanyaan.*.batas_waktu' => 'nullable|integer'
        ]);

        $kuis = Kuis::create([
            'creator_id' => $request->user()->id,
            'judul' => $validated['judul'],
            'total_waktu' => $validated['total_waktu'] ?? null,
            'tampilkan_jawaban_benar' => $validated['tampilkan_jawaban_benar'] ?? false,
            'tampilkan_peringkat' => $validated['tampilkan_peringkat'] ?? false
        ]);

        foreach ($validated['pertanyaan'] as $index => $p) {
            Pertanyaan::create([
                'kuis_id' => $kuis->id,
                'urutan' => $index + 1,
                ...$p
            ]);
        }

        return response()->json([
            'message' => 'Kuis dan pertanyaan berhasil dibuat',
            'kuis' => $kuis->load('pertanyaan')
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $kuis = Kuis::findOrFail($id);

        $kuis->update($request->all());

        return response()->json($kuis);
    }

    public function destroy($id)
    {
        $kuis = Kuis::findOrFail($id);

        $kuis->delete();

        return response()->json(['message' => 'Kuis dihapus']);
    }
}
