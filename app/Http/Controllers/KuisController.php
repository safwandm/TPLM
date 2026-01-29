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
            'judul' => 'required|string',
            'total_waktu' => 'nullable|integer',
            'tampilkan_jawaban_benar' => 'boolean',
            'tampilkan_peringkat' => 'boolean',
            'teks_waiting_room' => 'nullable|string',
            'teks_penutup' => 'nullable|string',

            'mode' => 'nullable|in:classic,game',
            'hp_awal' => 'nullable|integer|min:1',
        ]);

        unset($validated['total_waktu']);

        $mode = $validated['mode'] ?? 'classic';
        $hp_awal = $validated['hp_awal'] ?? config('quiz.starting_hp');

        if ($mode === 'game' && empty($validated['hp_awal'])) {
            $validated['hp_awal'] = $hp_awal;
        }

        if ($mode === 'classic') {
            $validated['hp_awal'] = null;
        }

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
            'teks_waiting_room' => 'nullable|string',
            'teks_penutup' => 'nullable|string',

            'mode' => 'nullable|in:classic,game',
            'hp_awal' => 'nullable|integer|min:1',

            'pertanyaan' => 'required|array',

            'pertanyaan.*.tipe_pertanyaan' => 'required|string',
            'pertanyaan.*.pertanyaan' => 'required|string',
            'pertanyaan.*.opsi' => 'required|array',
            'pertanyaan.*.jawaban_benar' => 'required',

            'pertanyaan.*.url_gambar' => 'nullable|string',
            'pertanyaan.*.url_video' => 'nullable|string',
            'pertanyaan.*.url_audio' => 'nullable|string',
            'pertanyaan.*.persamaan_matematika' => 'nullable|string',
            'pertanyaan.*.batas_waktu' => 'nullable|integer',

            'pertanyaan.*.skor' => 'nullable|integer|min:1',
            'pertanyaan.*.skor_bonus_waktu' => 'nullable|integer|min:1',
        ]);

        $mode = $validated['mode'] ?? 'classic';
        $hp_awal = $validated['hp_awal'] ?? config('quiz.starting_hp');

        $kuis = Kuis::create([
            'creator_id' => $request->user()->id,
            'judul' => $validated['judul'],
            'mode' => $mode['mode'],
            'hp_awal' => $mode === 'game'
                ? $hp_awal
                : null,
            'tampilkan_jawaban_benar' => $validated['tampilkan_jawaban_benar'] ?? false,
            'tampilkan_peringkat' => $validated['tampilkan_peringkat'] ?? false,
            'teks_waiting_room' => $validated['teks_waiting_room'] ?? false,
            'teks_penutup' => $validated['teks_penutup'] ?? false,
        ]);

        foreach ($validated['pertanyaan'] as $index => $p) {
            Pertanyaan::createValidated([
                'kuis_id' => $kuis->id,
                'urutan' => $index + 1,

                'tipe_pertanyaan' => $p['tipe_pertanyaan'],
                'pertanyaan' => $p['pertanyaan'],
                'opsi' => $p['opsi'],
                'jawaban_benar' => $p['jawaban_benar'],

                'url_gambar' => $p['url_gambar'] ?? null,
                'url_video' => $p['url_video'] ?? null,
                'url_audio' => $p['url_audio'] ?? null,
                'persamaan_matematika' => $p['persamaan_matematika'] ?? null,
                'batas_waktu' => $p['batas_waktu'] ?? null,

                'skor' => $p['skor'] ?? null,
                'skor_bonus_waktu' => $p['skor_bonus_waktu'] ?? null,
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
