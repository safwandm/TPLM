<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class SessionFinished implements ShouldBroadcast
{
    use SerializesModels;

    public $session;

    public function __construct($session)
    {
        $this->session = $session;
    }

    public function broadcastOn()
    {
        return new Channel("sesi.{$this->session->id}");
    }

    public function broadcastWith()
    {
        return [
            'status' => $this->session->status,
            'berakhir_pada' => optional($this->session->berakhir_pada)->toIso8601String(),
            'teks_penutup' => $this->session->kuis->teks_penutup,
        ];
    }

    public function broadcastAs()
    {
        return 'SessionFinished';
    }
}
