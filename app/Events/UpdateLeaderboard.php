<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

class UpdateLeaderboard implements ShouldBroadcast
{
    public $sessionId;
    public $leaderboard;

    public function __construct($sessionId, $leaderboard)
    {
        $this->sessionId = $sessionId;
        $this->leaderboard = $leaderboard;
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
