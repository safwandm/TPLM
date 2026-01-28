<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\ValidationException;

/**
 * ============================================================
 * Struktur Kolom Opsi
 * ============================================================
 *
 * ------------------------------------------------------------
 * 1. multiple_choice_single
 * ------------------------------------------------------------
 * Pilihan ganda, SATU jawaban benar
 *
 * opsi:
 * [
 *   "Pilihan A",
 *   "Pilihan B",
 *   "Pilihan C",
 *   "Pilihan D"
 * ]
 *
 * jawaban_benar:
 * int (index opsi, 0-based)
 *
 * Contoh:
 * opsi = ["10", "11", "12", "13"]
 * jawaban_benar = 2   // "12"
 *
 * ------------------------------------------------------------
 * 2. multiple_choice_multi
 * ------------------------------------------------------------
 * Pilihan ganda, LEBIH DARI SATU jawaban benar
 * Digunakan untuk soal yang bisa setengah benar.
 *
 * opsi:
 * [
 *   "Opsi 1",
 *   "Opsi 2",
 *   "Opsi 3",
 *   "Opsi 4"
 * ]
 *
 * jawaban_benar:
 * int[] (array index opsi, unik, 0-based)
 *
 * Contoh:
 * opsi = ["A", "B", "C", "D"]
 * jawaban_benar = [0, 2]   // A dan C benar
 *
 * ------------------------------------------------------------
 * 3. true_false
 * ------------------------------------------------------------
 * Soal benar / salah
 *
 * opsi:
 * null (sudah pasti antara true atau false)
 *
 * jawaban_benar:
 * bool
 *
 * Contoh:
 * pertanyaan = "5 adalah bilangan prima"
 * jawaban_benar = true
 *
 * ------------------------------------------------------------
 * 4. ordering
 * ------------------------------------------------------------
 * Menyusun item ke urutan yang benar
 *
 * opsi:
 * [
 *   "Langkah pertama",
 *   "Langkah kedua",
 *   "Langkah ketiga"
 * ]
 *
 * jawaban_benar:
 * int[] (urutan index opsi yang benar, panjang HARUS sama)
 *
 * Contoh:
 * opsi = ["B", "C", "A"]
 * jawaban_benar = [2, 0, 1]   // urutan benar: A → B → C
 *
 * ------------------------------------------------------------
 * 5. matching
 * ------------------------------------------------------------
 * Menjodohkan dua kolom (kiri ↔ kanan)
 *
 * opsi:
 * {
 *   "kiri":  ["Soal 1", "Soal 2", "Soal 3"],
 *   "kanan": ["Jawaban A", "Jawaban B", "Jawaban C"]
 * }
 *
 * jawaban_benar:
 * object (mapping index kiri → index kanan)
 *
 * Contoh:
 * jawaban_benar = {
 *   0: 2,   // kiri[0] → kanan[2]
 *   1: 0,
 *   2: 1
 * }
 */
class Pertanyaan extends Model
{
    protected $fillable = [
        'kuis_id',
        'urutan',
        'pertanyaan',
        'url_gambar',
        'url_video',
        'url_audio',
        'persamaan_matematika',
        'batas_waktu',
        'tipe_pertanyaan',
        'opsi',
        'jawaban_benar',
        'skor',
        'skor_bonus_waktu'
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

    
    public static function createValidated(array $data): self
    {
        self::validateAndNormalize($data);
        return self::create($data);
    }

    public function updateValidated(array $data): bool
    {
        $merged = array_merge($this->toArray(), $data);
        self::validateAndNormalize($merged);
        return $this->update($data);
    }

    protected static function validateAndNormalize(array &$data): void
    {
        foreach (['tipe_pertanyaan', 'opsi', 'jawaban_benar'] as $key) {
            if (!array_key_exists($key, $data)) {
                throw ValidationException::withMessages([
                    $key => 'Field wajib ada.',
                ]);
            }
        }

        match ($data['tipe_pertanyaan']) {

            'multiple_choice_single' => self::mcSingle($data),
            'multiple_choice_multi'  => self::mcMulti($data),
            'true_false'             => self::trueFalse($data),
            'ordering'               => self::ordering($data),
            'matching'               => self::matching($data),

            default => throw ValidationException::withMessages([
                'tipe_pertanyaan' => 'Tipe pertanyaan tidak valid.',
            ]),
        };
    }

    protected static function mcSingle(array &$data): void
    {
        self::assertArray($data['opsi'], min: 2);
        self::assertInt($data['jawaban_benar']);

        if ($data['jawaban_benar'] < 0 || $data['jawaban_benar'] >= count($data['opsi'])) {
            throw ValidationException::withMessages([
                'jawaban_benar' => 'Index jawaban di luar range.',
            ]);
        }

        $data['opsi'] = array_values($data['opsi']);
        $data['jawaban_benar'] = [(int) $data['jawaban_benar']];
    }

    protected static function mcMulti(array &$data): void
    {
        self::assertArray($data['opsi'], min: 2);
        self::assertArray($data['jawaban_benar'], min: 1);

        $opsiCount = count($data['opsi']);
        $unique = array_unique($data['jawaban_benar']);

        if (count($unique) !== count($data['jawaban_benar'])) {
            throw ValidationException::withMessages([
                'jawaban_benar' => 'Jawaban duplikat tidak diperbolehkan.',
            ]);
        }

        foreach ($data['jawaban_benar'] as $idx) {
            if (!is_int($idx) || $idx < 0 || $idx >= $opsiCount) {
                throw ValidationException::withMessages([
                    'jawaban_benar' => 'Index jawaban tidak valid.',
                ]);
            }
        }

        $data['opsi'] = array_values($data['opsi']);
        $data['jawaban_benar'] = array_values($unique);
    }

    protected static function trueFalse(array &$data): void
    {
        if (!is_bool($data['jawaban_benar'])) {
            throw ValidationException::withMessages([
                'jawaban_benar' => 'Harus boolean.',
            ]);
        }

        // $data['opsi'] = [true, false];
        $data['opsi'] = null;
        $data['jawaban_benar'] = [(bool) $data['jawaban_benar']];
    }

    protected static function ordering(array &$data): void
    {
        self::assertArray($data['opsi'], min: 2);
        self::assertArray($data['jawaban_benar'], min: 2);

        if (count($data['opsi']) !== count($data['jawaban_benar'])) {
            throw ValidationException::withMessages([
                'jawaban_benar' => 'Jumlah jawaban harus sama dengan opsi.',
            ]);
        }

        $data['opsi'] = array_values($data['opsi']);
        $data['jawaban_benar'] = array_values($data['jawaban_benar']);
    }

    protected static function matching(array &$data): void
    {
        if (
            !isset($data['opsi']['kiri'], $data['opsi']['kanan']) ||
            !is_array($data['opsi']['kiri']) ||
            !is_array($data['opsi']['kanan'])
        ) {
            throw ValidationException::withMessages([
                'opsi' => 'Matching harus punya kiri & kanan.',
            ]);
        }

        $data['opsi'] = [
            'kiri' => array_values($data['opsi']['kiri']),
            'kanan' => array_values($data['opsi']['kanan']),
        ];

        if (!is_array($data['jawaban_benar'])) {
            throw ValidationException::withMessages([
                'jawaban_benar' => 'Jawaban harus array mapping.',
            ]);
        }
    }

    protected static function assertArray($value, int $min = 1): void
    {
        if (!is_array($value) || count($value) < $min) {
            throw ValidationException::withMessages([
                'opsi' => "Minimal $min item diperlukan.",
            ]);
        }
    }

    protected static function assertInt($value): void
    {
        if (!is_int($value)) {
            throw ValidationException::withMessages([
                'jawaban_benar' => 'Harus integer.',
            ]);
        }
    }
}
