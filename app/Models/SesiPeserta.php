<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SesiPeserta extends Model
{
    use HasFactory;

    protected $fillable = [
        'session_id',
        'nama',
        'total_skor'
    ];

    public function session()
    {
        return $this->belongsTo(SesiKuis::class, 'session_id');
    }

    public function jawabans()
    {
        return $this->hasMany(JawabanPeserta::class, 'peserta_id');
    }
}
