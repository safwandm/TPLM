<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

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
        'teks_waiting_room'
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

    public static function getLeaderboard($sessionId)
    {
        return SesiPeserta::select(
                'sesi_pesertas.nama',
                'sesi_pesertas.total_skor',
                'sesi_pesertas.hp_sisa',
                DB::raw('COALESCE(SUM(jawaban_pesertas.correctness), 0) as total_correctness')
            )
            ->leftJoin('jawaban_pesertas', 'jawaban_pesertas.peserta_id', '=', 'sesi_pesertas.id')
            ->where('sesi_pesertas.session_id', $sessionId)
            ->groupBy('sesi_pesertas.id')
            ->orderByDesc('sesi_pesertas.total_skor')
            ->orderBy('nama')
            ->get();
    }
}
