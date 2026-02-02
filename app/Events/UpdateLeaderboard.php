<?php

namespace App\Events;

use App\Models\SesiKuis;
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
        $this->leaderboard = SesiKuis::getLeaderboard($sessionId);
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
