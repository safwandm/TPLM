<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kuis extends Model
{
    protected $fillable = [
        'judul',
        'mode',
        'creator_id',
        'total_waktu',
        'tampilkan_jawaban_benar',
        'tampilkan_peringkat',
        'hp_awal'
    ];

    public function quiz()
    {
        return $this->belongsTo(User::class);
    }

    public function pertanyaan()
    {
        return $this->hasMany(Pertanyaan::class);
    }

    public function kuisAktif()
    {
        return $this->hasOne(SesiKuis::class)
            ->where('status', '!=', 'finished')
            ->latest('created_at');
    }
}
