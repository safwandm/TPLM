<?php

namespace App\Events;

use App\Models\SesiPeserta;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Support\Facades\DB;

class UpdateLeaderboard implements ShouldBroadcast
{
    public $sessionId;
    public $leaderboard;

    public function __construct($sessionId)
    {
        $this->sessionId = $sessionId;
        $this->leaderboard = SesiPeserta::select(
            'sesi_pesertas.nama',
            'sesi_pesertas.total_skor',
            'sesi_pesertas.hp_sisa',
            DB::raw('COALESCE(SUM(jawaban_pesertas.correctness), 0) as total_correctness')
        )
        ->leftJoin('jawaban_pesertas', 'jawaban_pesertas.peserta_id', '=', 'sesi_pesertas.id')
        ->where('sesi_pesertas.session_id', $this->sessionId)
        ->groupBy('sesi_pesertas.id')
        ->orderByDesc('total_skor')
        ->orderBy('nama')
        ->get();
    }

    public function broadcastOn()
    {
        return new Channel("sesi.{$this->sessionId}");
    }

    public function broadcastAs()
    {
        return 'LeaderboardUpdated';
    }

    public function broadcastWith()
    {
        return [
            'leaderboard' => $this->leaderboard
        ];
    }
}
