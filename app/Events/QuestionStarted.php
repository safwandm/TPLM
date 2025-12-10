<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class QuestionStarted implements ShouldBroadcast
{
    use SerializesModels;

    public $sessionId;
    public $payload;

    public function __construct($sessionId, array $payload)
    {
        $this->sessionId = $sessionId;
        $this->payload = $payload;
    }

    public function broadcastOn()
    {
        // channel public atau private, ubah ke private jika perlu auth
        return new Channel("sesi.{$this->sessionId}");
    }

    public function broadcastWith()
    {
        return $this->payload;
    }

    public function broadcastAs()
    {
        return 'QuestionStarted';
    }
}
