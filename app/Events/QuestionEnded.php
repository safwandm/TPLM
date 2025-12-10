<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class QuestionEnded implements ShouldBroadcast
{
    use SerializesModels;

    public $sessionId;
    public $questionId;

    public function __construct($sessionId, $questionId)
    {
        $this->sessionId = $sessionId;
        $this->questionId = $questionId;
    }

    public function broadcastOn()
    {
        return new Channel("sesi.{$this->sessionId}");
    }

    public function broadcastWith()
    {
        return ['pertanyaan_id' => $this->questionId];
    }

    public function broadcastAs()
    {
        return 'QuestionEnded';
    }
}
