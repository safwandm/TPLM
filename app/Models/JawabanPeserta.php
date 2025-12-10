<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JawabanPeserta extends Model
{
    use HasFactory;

    protected $fillable = [
        'peserta_id',
        'pertanyaan_id',
        'jawaban',
        'waktu_jawab_ms',
        'is_benar',
    ];

    public function peserta()
    {
        return $this->belongsTo(SesiPeserta::class, 'peserta_id');
    }

    public function pertanyaan()
    {
        return $this->belongsTo(Pertanyaan::class);
    }
}
