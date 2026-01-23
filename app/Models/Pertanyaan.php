<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pertanyaan extends Model
{
    protected $fillable = [
        'kuis_id',
        'urutan',
        'pertanyaan',
        'mode',
        'jawaban_benar',
        'opsi_a',
        'opsi_b',
        'opsi_c',
        'opsi_d',
        'url_gambar',
        'persamaan_matematika',
        'batas_waktu',
    ];

    protected $casts = [
        'jawaban_benar' => 'array',
    ];


    public function kuis()
    {
        return $this->belongsTo(Kuis::class);
    }
}
