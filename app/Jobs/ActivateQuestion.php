<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Carbon;

use App\Models\SesiKuis;
use App\Models\Pertanyaan;
use App\Events\QuestionStarted;
use App\Jobs\EndQuestion;

class ActivateQuestion implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $sessionId;
    public $questionId;
    public $questionIds; 

    public function __construct(int $sessionId, int $questionId, array $questionIds)
    {
        $this->sessionId = $sessionId;
        $this->questionId = $questionId;
        $this->questionIds = $questionIds;
    }

    public function handle()
    {
        $session = SesiKuis::find($this->sessionId);
        if (!$session || $session->status !== 'running') {
            // session sudah selesai atau tidak ditemukan -> abort
            return;
        }

        $question = Pertanyaan::find($this->questionId);
        if (!$question) return;

        // set current question di cache supaya frontend bisa cek
        $ttl = $question->batas_waktu ?? 30; // detik (migration default 30)
        $endsAt = Carbon::now()->addSeconds($ttl);

        Cache::put("sesi:{$this->sessionId}:current_question", $this->questionId, $ttl + 5);
        Cache::put("sesi:{$this->sessionId}:question_ends_at", $endsAt->toDateTimeString(), $ttl + 5);

        // Broadcast event ke frontend (jangan include jawaban benar)
        broadcast(new QuestionStarted($session->id, [
            'pertanyaan_id' => $question->id,
            'pertanyaan' => $question->pertanyaan,
            'url_gambar' => $question->url_gambar,
            'url_video' => $question->url_video,
            'url_audio' => $question->url_audio,
            'persamaan_matematika' => $question->persamaan_matematika,
            'opsi' => $question->opsi,
            'batas_waktu' => $ttl,
            'ends_at' => $endsAt->toIso8601String(),
        ]));

        // Dispatch job untuk mengakhiri soal ini setelah $ttl detik
        EndQuestion::dispatch($this->sessionId, $this->questionId, $this->questionIds)
            ->delay(now()->addSeconds($ttl));
    }
}
