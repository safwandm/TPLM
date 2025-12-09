<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pertanyaan extends Model
{
    protected $fillable = [
        'kuis_id',
        'pertanyaan',
        'url_gambar',
        'persamaan_matematika',
        'batas_waktu',
        'opsi_a',
        'opsi_b',
        'opsi_c',
        'opsi_d',
        'jawaban_benar',
    ];

    public function kuis()
    {
        return $this->belongsTo(Kuis::class);
    }
}
