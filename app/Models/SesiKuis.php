<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SesiKuis extends Model
{
    use HasFactory;

    protected $fillable = [
        'kuis_id',
        'kode',
        'status',
        'nomor_pertanyaan_sekarang',
        'dimulai_pada',
        'berakhir_pada',
    ];

    public function kuis()
    {
        return $this->belongsTo(Kuis::class);
    }

    public function pesertas()
    {
        return $this->hasMany(SesiPeserta::class, 'session_id');
    }

    public function settings()
    {
        return $this->hasOne(SesiKuis::class, 'session_id');
    }
}
