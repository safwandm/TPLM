<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

class ParticipantsUpdated implements ShouldBroadcast
{
    public $sessionId;
    public $pesertaList;

    public function __construct($sessionId, $pesertaList)
    {
        $this->sessionId = $sessionId;
        $this->pesertaList = $pesertaList;
    }

    public function broadcastOn()
    {
        return new Channel("sesi.{$this->sessionId}");
    }

    public function broadcastAs()
    {
        return 'ParticipantsUpdated';
    }

    public function broadcastWith()
    {
        return [
            'peserta' => $this->pesertaList
        ];
    }
}
