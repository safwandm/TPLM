<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pertanyaan extends Model
{
    protected $fillable = [
        'kuis_id',
        'urutan',
        'pertanyaan',
        'url_gambar',
        'persamaan_matematika',
        'batas_waktu',
        'tipe_pertanyaan',
        'opsi',
        'jawaban_benar',
    ];

    protected $casts = [
        'opsi' => 'array',
        'jawaban_benar' => 'array',
    ];

    public function kuis()
    {
        return $this->belongsTo(Kuis::class);
    }

    public function cekJawaban($jawabanMurid): float
    {
        return match ($this->tipe_pertanyaan) {
            'multiple_choice_single' => $this->cekMCSingle($jawabanMurid),
            'multiple_choice_multi'  => $this->cekMCMulti($jawabanMurid),
            'true_false'             => $this->cekTrueFalse($jawabanMurid),
            'ordering'               => $this->cekOrdering($jawabanMurid),
            'matching'               => $this->cekMatching($jawabanMurid),
            default                  => 0.0,
        };
    }

    protected function cekMCSingle(int $jawabanMurid): float
    {
        return $jawabanMurid === $this->jawaban_benar[0] ? 1.0 : 0.0;
    }

    protected function cekMCMulti(array $jawabanMurid): float
    {
        $jawabanBenar = $this->jawaban_benar;

        // hilangkan duplikat & normalisasi
        $jawabanMurid = array_values(array_unique($jawabanMurid));

        // ada jawaban salah → 0
        foreach ($jawabanMurid as $jawaban) {
            if (!in_array($jawaban, $jawabanBenar, true)) {
                return 0;
            }
        }

        $jumlahBenar = count(array_intersect($jawabanMurid, $jawabanBenar));
        $totalBenar  = count($jawabanBenar);

        if ($totalBenar === 0) {
            return 0;
        }

        // skor proporsional (0–1)
        return round($jumlahBenar / $totalBenar, 2);
    }

    protected function cekTrueFalse(bool $jawabanMurid): float
    {
        return $jawabanMurid === $this->jawaban_benar[0] ? 1.0 : 0.0;
    }

    protected function cekOrdering(array $jawabanMurid): float
    {
        return $jawabanMurid === $this->jawaban_benar ? 1.0 : 0.0;
    }

    protected function cekMatching(array $jawabanMurid): bool
    {
        /*
         * jawaban_benar:
         * [
         *   0 => 2,
         *   1 => 0,
         *   2 => 1
         * ]
         */

        foreach ($this->jawaban_benar as $kiri => $kanan) {
            if (
                !array_key_exists($kiri, $jawabanMurid) ||
                $jawabanMurid[$kiri] !== $kanan
            ) {
                return 0.0;
            }
        }

        return 1.0;
    }
}
