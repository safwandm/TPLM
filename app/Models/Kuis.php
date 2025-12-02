<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kuis extends Model
{
    protected $fillable = [
        'judul',
        'creator_id',
        'total_waktu',
        'tampilkan_jawaban_benar',
        'tampilkan_peringkat',
    ];

    public function quiz()
    {
        return $this->belongsTo(User::class);
    }

    public function pertanyaan()
    {
        return $this->hasMany(Pertanyaan::class);
    }
}
