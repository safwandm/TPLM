<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Kuis;
use App\Models\Pertanyaan;

class KuisController extends Controller
{
    public function index(Request $request)
    {
        $kuis = Kuis::where('creator_id', $request->user()->id)
            ->withCount('pertanyaan')
            ->with('kuisAktif')
            ->get();

        return response()->json($kuis);
    }

    public function show(Request $request, $id)
    {
        $kuis = Kuis::with('pertanyaan')
            ->where('id', $id)
            ->where('creator_id', $request->user()->id)
            ->firstOrFail();

        return response()->json($kuis);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'judul' => 'required|string|max:255',
            'total_waktu' => 'nullable|integer|min:1',
            'tampilkan_jawaban_benar' => 'sometimes|boolean',
            'tampilkan_peringkat' => 'sometimes|boolean',
        ]);

        $kuis = Kuis::create([
            'creator_id' => $request->user()->id,
            'judul' => $validated['judul'],
            'total_waktu' => $validated['total_waktu'] ?? null,
            'tampilkan_jawaban_benar' => $validated['tampilkan_jawaban_benar'] ?? false,
            'tampilkan_peringkat' => $validated['tampilkan_peringkat'] ?? false,
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

            'pertanyaan' => 'required|array|min:1',

            'pertanyaan.*.pertanyaan' => 'required|string',
            'pertanyaan.*.mode' => 'required|in:single,multiple,true_false',

            // ✅ FIXED: use fixed option keys
            'pertanyaan.*.opsi_a' => 'required|string',
            'pertanyaan.*.opsi_b' => 'required|string',
            'pertanyaan.*.opsi_c' => 'nullable|string',
            'pertanyaan.*.opsi_d' => 'nullable|string',

            // JSONB answers
            'pertanyaan.*.jawaban_benar' => 'required|array|min:1',
            'pertanyaan.*.jawaban_benar.*' => 'in:a,b,c,d',

            'pertanyaan.*.url_gambar' => 'nullable|string',
            'pertanyaan.*.persamaan_matematika' => 'nullable|string',
            'pertanyaan.*.batas_waktu' => 'nullable|integer|min:1',
        ]);

        /** ================= CREATE QUIZ ================= */
        $kuis = Kuis::create([
            'creator_id' => $request->user()->id,
            'judul' => $validated['judul'],
            'tampilkan_jawaban_benar' => $validated['tampilkan_jawaban_benar'] ?? false,
            'tampilkan_peringkat' => $validated['tampilkan_peringkat'] ?? false,
        ]);

        /** ================= CREATE QUESTIONS ================= */
        foreach ($validated['pertanyaan'] as $index => $q) {

            // 🔐 mode rules
            if (
                in_array($q['mode'], ['single', 'true_false']) &&
                count($q['jawaban_benar']) !== 1
            ) {
                abort(422, "Soal ke-" . ($index + 1) . " hanya boleh satu jawaban benar");
            }

            // 🔐 prevent pointing to empty options
            foreach ($q['jawaban_benar'] as $ans) {
                if (empty($q["opsi_$ans"])) {
                    abort(422, "Jawaban benar menunjuk ke opsi kosong (soal ke-" . ($index + 1) . ")");
                }
            }

            Pertanyaan::create([
                'kuis_id' => $kuis->id,
                'urutan' => $index + 1,

                'pertanyaan' => $q['pertanyaan'],
                'mode' => $q['mode'],
                'jawaban_benar' => array_values($q['jawaban_benar']),

                'opsi_a' => $q['opsi_a'],
                'opsi_b' => $q['opsi_b'],
                'opsi_c' => $q['opsi_c'] ?? null,
                'opsi_d' => $q['opsi_d'] ?? null,

                'url_gambar' => $q['url_gambar'] ?? null,
                'persamaan_matematika' => $q['persamaan_matematika'] ?? null,
                'batas_waktu' => $q['batas_waktu'] ?? null,
            ]);
        }

        return response()->json([
            'message' => 'Kuis dan pertanyaan berhasil dibuat',
            'kuis' => $kuis->load('pertanyaan'),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $kuis = Kuis::findOrFail($id);

        unset($request['total_waktu']);

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
