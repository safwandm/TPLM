<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class QuizStarting implements ShouldBroadcast
{
    use SerializesModels;

    public int $sessionId;
    public int $startsIn;

    public function __construct(int $sessionId, int $startsIn)
    {
        $this->sessionId = $sessionId;
        $this->startsIn = $startsIn;
    }

    public function broadcastOn()
    {
        return new Channel("sesi.{$this->sessionId}");
    }

    public function broadcastAs()
    {
        return 'QuizStarting';
    }

    public function broadcastWith()
    {
        return [
            'session_id' => $this->sessionId,
            'starts_in' => $this->startsIn,
        ];
    }
}
