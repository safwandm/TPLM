<?php

namespace App\Http\Controllers;

use App\Events\QuizStarting;
use App\Events\UpdateLeaderboard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

use App\Models\SesiKuis;
use App\Models\Kuis;
use App\Models\Pertanyaan;
use App\Jobs\ActivateQuestion;
use App\Models\JawabanPeserta;
use App\Models\SesiPeserta;

class SesiKuisController extends Controller
{

    public function list_sesi($kuisId)
    {
        $sesi = SesiKuis::where('kuis_id', $kuisId)
            ->withCount('pesertas')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($sesi);
    }

    public function detail_sesi($sesiId)
    {
        $sesi = SesiKuis::with([
            'kuis',
            'pesertas.jawabans.pertanyaan'
        ])->findOrFail($sesiId);

        return response()->json($sesi);
    }

    public function config($id)
    {
        $session = SesiKuis::with('kuis')->findOrFail($id);

        return response()->json([
            'tampilkan_jawaban_benar' => (bool) $session->kuis->tampilkan_jawaban_benar,
            'tampilkan_peringkat' => (bool) $session->kuis->tampilkan_peringkat,
        ]);
    }


    public function create(Request $request)
    {
        $request->validate([
            'kuis_id' => 'required|exists:kuis,id',
        ]);

        $user = $request->user();

        $kuis = Kuis::findOrFail($request->kuis_id);
        if ($kuis->creator_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        do {
            $kode = strtoupper(str()->random(6));
        } while (SesiKuis::where('kode', $kode)->exists());

        $session = SesiKuis::create([
            'kuis_id' => $kuis->id,
            'kode' => $kode,
            'status' => 'waiting',
            'tampilkan_jawaban_benar' => $kuis->tampilkan_jawaban_benar,
            'tampilkan_peringkat' => $kuis->tampilkan_peringkat,
        ]);

        return response()->json([
            'message' => 'Sesi baru berhasil dibuat',
            'sesi' => $session,
        ]);
    }

    public function start(Request $request, $id)
    {
        $user = $request->user();

        $session = SesiKuis::with('kuis')->findOrFail($id);

        if ($session->status !== 'waiting') {
            return response()->json(['message' => 'Sesi sudah dimulai atau selesai'], 422);
        }

        if ($user->id !== $session->kuis->creator_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        DB::transaction(function () use ($session) {
            $session->status = 'running';
            $session->dimulai_pada = Carbon::now();
            $session->save();
        });

        $questions = Pertanyaan::where('kuis_id', $session->kuis_id)
                        ->orderBy('created_at') 
                        ->get();

        if ($questions->isEmpty()) {
            $session->status = 'finished';
            $session->berakhir_pada = Carbon::now();
            $session->save();
            return response()->json(['message' => 'Tidak ada soal pada kuis ini'], 200);
        }
        
        $first = $questions->first();

        $startDelay = config('quiz.start_delay');

        broadcast(new QuizStarting($session->id, $startDelay));

        ActivateQuestion::dispatch(
            $session->id,
            $first->id,
            $questions->pluck('id')->toArray()
        )->delay(now()->addSeconds($startDelay));

        return response()->json(['message' => 'Sesi dimulai'], 200);
    }

    // Optional: endpoint untuk memaksa selesai (mis. saat emergency)
    public function forceFinish(Request $request, $id)
    {
        $user = $request->user();
        $session = SesiKuis::findOrFail($id);

        // cek permission (sama seperti di start)
        if ($user->id !== $session->kuis->creator_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $session->status = 'finished';
        $session->berakhir_pada = Carbon::now();
        $session->save();

        // clear cache keys
        Cache::forget("sesi:{$session->id}:current_question");
        Cache::forget("sesi:{$session->id}:question_ends_at");

        // broadcast jika ingin memberitahu frontend (bisa lakukan event SessionFinished)
        event(new \App\Events\SessionFinished($session));

        return response()->json(['message' => 'Sesi dipaksa selesai'], 200);
    }

    public function submit(Request $request, $session_id, $question_id)
    {

        $request->validate([
            'peserta_id' => 'required|exists:sesi_pesertas,id',
            'jawaban' => 'required',
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
        $endsAtRaw = Cache::get("sesi:{$session_id}:question_ends_at");

        $endsAt = Carbon::parse($endsAtRaw); // ✅ convert string → Carbon
        $now = now();

        if (!$endsAt || $now->greaterThan($endsAt)) {
            return response()->json(['message' => 'Waktu menjawab sudah habis'], 422);
        }

        // Hitung waktu respon
        $waktuJawabMs = max(0, $endsAt->diffInMilliseconds($now));
        $waktuJawabMs = (int) $waktuJawabMs;

        $question = Pertanyaan::find($currentQuestionId);

        $correctness = $question->cekJawaban($request->jawaban);

        if ($correctness > 0) {
            $timeLimitMs = $question->batas_waktu * 1000;

            $timeFactor = 1 - ($waktuJawabMs / $timeLimitMs);
            $timeFactor = max(0, min(1, $timeFactor));

            $baseScore = $question->skor ?? config('quiz.base_score');
            $timeBonusScore = $question->skor_bonus_waktu ?? config('quiz.time_bonus_score');

            $score =
                ($baseScore +
                ($timeFactor * $timeBonusScore))
                * $correctness;

            $peserta->total_skor += (int) round($score);
            $peserta->save();
        }

        $jawaban = JawabanPeserta::updateOrCreate(
            [
                'peserta_id' => $peserta->id,
                'pertanyaan_id' => $question_id,
            ],
            [
                'jawaban' => $request->jawaban,
                'waktu_jawab_ms' => $waktuJawabMs,
                'correctness' => $correctness,
            ]
        );

        # TODO: optimisasi, kalau  salah gak perlu query ulang
        $leaderboard = SesiPeserta::where('session_id', $session_id)
            ->orderByDesc('total_skor')
            ->orderBy('nama')
            ->get(['nama', 'total_skor']);

        broadcast(new UpdateLeaderboard($session_id, $leaderboard));

        return response()->json([
            'message' => 'Jawaban disimpan',
            'jawaban' => $jawaban
        ]);
    }
}
