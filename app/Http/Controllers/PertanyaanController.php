<?php

namespace App\Http\Controllers;

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

    public function submit(Request $request, $session_id, $question_id)
    {
        $request->validate([
            'peserta_id' => 'required|exists:sesi_pesertas,id',
            'jawaban' => 'nullable|in:a,b,c,d',
            'pertanyaan_id' => 'required|integer'
        ]);

        // ID pertanyaan di payload *harus* sama dengan URL
        if ((int)$request->pertanyaan_id !== (int)$question_id) {
            return response()->json([
                'message' => 'Payload pertanyaan_id tidak valid'
            ], 422);
        }

        // Validasi peserta
        $peserta = SesiPeserta::findOrFail($request->peserta_id);
        if ($peserta->session_id != $session_id) {
            return response()->json(['message' => 'Peserta tidak berada di sesi ini'], 403);
        }

        // Validasi sesi
        $sesi = SesiKuis::findOrFail($session_id);
        if ($sesi->status !== 'running') {
            return response()->json(['message' => 'Sesi tidak sedang berjalan'], 422);
        }

        // Validasi pertanyaan aktif
        $currentQuestionId = Cache::get("sesi:{$session_id}:current_question");

        if (!$currentQuestionId || (int)$currentQuestionId !== (int)$question_id) {
            return response()->json([
                'message' => 'Pertanyaan sudah berakhir atau belum dimulai'
            ], 422);
        }

        // Validasi waktu
        $endsAt = Cache::get("sesi:{$session_id}:question_ends_at");
        $now = now();

        if (!$endsAt || $now->greaterThan($endsAt)) {
            return response()->json(['message' => 'Waktu menjawab sudah habis'], 422);
        }

        // Hitung waktu respon
        $waktuJawabMs = Carbon::parse($endsAt)->diffInMilliseconds($now);

        $question = Pertanyaan::find($currentQuestionId);

        $isBenar = false;
        if (!is_null($request->jawaban) && $request->jawaban === $question->jawaban_benar) {
            $isBenar = true;
        }

        if ($isBenar) {
            $peserta->total_skor = $peserta->total_skor + 100  + (1  - ($waktuJawabMs / ($question->batas_waktu *  1000))) * 100;
            $peserta->save();
        }

        $jawaban = JawabanPeserta::updateOrCreate(
            [
                'peserta_id' => $peserta->id,
                'pertanyaan_id' => $question_id,
                'is_benar' =>  $isBenar
            ],
            [
                'jawaban' => $request->jawaban,
                'waktu_jawab_ms' => $waktuJawabMs,
            ]
        );

        # TODO: optimisasi, kalau  salah gak perlu query ulang
        $leaderboard = SesiPeserta::where('session_id', $session_id)
            ->orderByDesc('total_skor')
            ->orderBy('nama')
            ->get(['id', 'nama', 'total_skor']);

        broadcast(new UpdateLeaderboard($session_id, $leaderboard));

        return response()->json([
            'message' => 'Jawaban disimpan',
            'jawaban' => $jawaban
        ]);
    }

}
