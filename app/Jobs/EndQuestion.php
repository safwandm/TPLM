<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

use App\Models\SesiKuis;
use App\Models\Pertanyaan;
use App\Models\SesiPeserta;
use App\Models\JawabanPeserta;
use App\Events\QuestionEnded;
use App\Events\SessionFinished;
use App\Jobs\ActivateQuestion;

class EndQuestion implements ShouldQueue
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
            return;
        }

        $question = Pertanyaan::find($this->questionId);
        if (!$question) return;

        DB::transaction(function () use ($session, $question) {
            // Dapatkan semua peserta di sesi
            $participants = SesiPeserta::where('session_id', $session->id)->get();

            foreach ($participants as $p) {
                // cari jawaban peserta untuk pertanyaan ini
                $jawab = JawabanPeserta::where('peserta_id', $p->id)
                        ->where('pertanyaan_id', $question->id)
                        ->first();

                if (!$jawab) {
                    // belum menjawab -> buat record sebagai tidak menjawab (jawaban null)
                    JawabanPeserta::create([
                        'peserta_id' => $p->id,
                        'pertanyaan_id' => $question->id,
                        'jawaban' => null,
                        'waktu_jawab_ms' => null,
                        'is_benar' => false,
                    ]);
                    continue;
                }
            }
        });

        // hapus cache current question (sudah berakhir)
        Cache::forget("sesi:{$this->sessionId}:current_question");
        Cache::forget("sesi:{$this->sessionId}:question_ends_at");

        // Broadcast event QuestionEnded (frontend bisa kasih transisi)
        broadcast(new QuestionEnded($session->id, $question->id));

        // cari index soal saat ini dan tentukan next
        $ids = $this->questionIds;
        $pos = array_search($this->questionId, $ids);
        $nextPos = $pos === false ? null : $pos + 1;
        if (!is_null($nextPos) && isset($ids[$nextPos])) {
            // dispatch ActivateQuestion untuk soal berikutnya (langsung)
            $nextId = $ids[$nextPos];
            ActivateQuestion::dispatch($this->sessionId, $nextId, $ids)
                ->delay(now()->addSeconds(5)); // langsung
            return;
        }

        // Jika tidak ada next => finish session
        $session->status = 'finished';
        $session->berakhir_pada = Carbon::now();
        $session->save();

        // broadcast session finished
        broadcast(new SessionFinished($session));
    }
}
