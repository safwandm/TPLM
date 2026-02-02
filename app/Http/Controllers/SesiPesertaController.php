<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SesiKuis;
use App\Models\SesiPeserta;
use App\Events\ParticipantsUpdated;
use App\Events\UpdateLeaderboard;
use App\Models\JawabanPeserta;
use App\Models\Pertanyaan;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
class SesiPesertaController extends Controller
{
    public function join(Request $request, $kode)
    {
        $request->validate([
            'nama' => 'required|string|max:100',
        ]);

        $sesi = SesiKuis::where('kode', $kode)->first();
        if (!$sesi) {
            return response()->json(['message' => 'Sesi tidak ditemukan'], 404);
        }

        if ($sesi->status !== 'waiting') {  
            return response()->json(['message' => 'Sesi sudah dimulai atau selesai'], 422);
        }

        if (SesiPeserta::where('session_id', $sesi->id)->where('nama', $request->nama)->exists()) {
            return response()->json(['message' => 'Nama sudah dipakai dalam sesi ini'], 422);
        }

        $kuis = $sesi->kuis;

        $peserta = SesiPeserta::create([
            'session_id' => $sesi->id,
            'nama' => $request->nama,
            'total_skor' => 0,
            'hp_sisa' => $kuis->mode === 'game'
                ? $kuis->hp_awal
                : null,
        ]);
        
        $pesertaList = SesiPeserta::where('session_id', $sesi->id)
            ->orderBy('nama')
            ->pluck('nama') 
            ->toArray();

        broadcast(new ParticipantsUpdated($sesi->id, $pesertaList));

        Log::info("Dispatching QuizStarting", ['sesi' => $sesi->id]);

        return response()->json([
            'message' => 'Berhasil bergabung ke sesi',
            'peserta' => $peserta,
            'teks_waiting_room' => $sesi->kuis->teks_waiting_room
        ]);
    }

    public function get(Request $request, $peserta_id)
    {
        return response()->json(SesiPeserta::findOrFail($request->peserta_id));
    }

    
    public function restore($session_id, $peserta_id)
    {
        $sesi = SesiKuis::with('kuis')->findOrFail($session_id);

        $peserta = SesiPeserta::findOrFail($peserta_id);
        if ($peserta->session_id != $session_id) {
            return response()->json(['message' => 'Peserta tidak valid'], 403);
        }

        // session sudah selesai
        if ($sesi->status === 'finished') {
            return response()->json([
                'status' => 'finished',
                'final_score' => $peserta->total_skor,
            ]);
        }

        /* ================= CURRENT QUESTION ================= */

        $currentQuestionId = Cache::get("sesi:{$session_id}:current_question");
        $startedAt = Cache::get("sesi:{$session_id}:question_started_at");
        $endsAt = Cache::get("sesi:{$session_id}:question_ends_at");

        $question = null;
        $jawaban = null;

        if ($currentQuestionId) {
            $question = Pertanyaan::find($currentQuestionId);

            $jawaban = JawabanPeserta::where('peserta_id', $peserta->id)
                ->where('pertanyaan_id', $currentQuestionId)
                ->first();
        }

        /* ================= TIME ================= */

        $timeLeft = null;
        if ($endsAt) {
            $timeLeft = max(
                0,
                Carbon::now()->diffInSeconds(Carbon::parse($endsAt), false)
            );
        }

        /* ================= LEADERBOARD ================= */

        $leaderboard = SesiKuis::getLeaderboard($session_id);

        return response()->json([
            'status' => 'running',
            'current_question' => $question ? [
                'pertanyaan_id' => $question->id,
                'pertanyaan' => $question->pertanyaan,
                'opsi' => $question->opsi,
                'tipe_pertanyaan' => $question->tipe_pertanyaan,
                'batas_waktu' => $question->batas_waktu,
                'ends_at' => $endsAt,
            ] : null,

            'answered' => $jawaban ? true : false,
            'jawaban' => $jawaban?->jawaban,
            'correctness' => $jawaban?->correctness,
            'hp_sisa' => $peserta->hp_sisa,
            'time_left' => $timeLeft,
            'leaderboard' => $leaderboard,
        ]);
    }
}
