<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class QuestionEnded implements ShouldBroadcast
{
    use SerializesModels;

    public int $sessionId;
    public int $questionId;
    public int $breakTime;
    public $jawabanBenar;

    public function __construct(int $sessionId, int $questionId, int $breakTime, $jawabanBenar)
    {
        $this->sessionId = $sessionId;
        $this->questionId = $questionId;
        $this->breakTime = $breakTime;
        $this->jawabanBenar = $jawabanBenar;
    }

    public function broadcastOn()
    {
        return new Channel("sesi.{$this->sessionId}");
    }

    public function broadcastWith()
    {
        return [
            'session_id' => $this->sessionId,
            'pertanyaan_id' => $this->questionId,
            'break_time' => $this->breakTime, 
            'jawaban_benar' => $this->jawabanBenar
        ];
    }

    public function broadcastAs()
    {
        return 'QuestionEnded';
    }
}
