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
    protected $table = 'pertanyaans';

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
        'skor_bonus_waktu',
    ];

    protected $casts = [
        'opsi' => 'array',
        'jawaban_benar' => 'array',
    ];

    /* ======================================================
       RELATION
    ====================================================== */
    public function kuis()
    {
        return $this->belongsTo(Kuis::class);
    }

    /* ======================================================
       SCORING
    ====================================================== */
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
        return $jawabanMurid === ($this->jawaban_benar[0] ?? null) ? 1.0 : 0.0;
    }

    protected function cekMCMulti(array $jawabanMurid): float
    {
        $jawabanBenar = $this->jawaban_benar ?? [];

        $jawabanMurid = array_values(array_unique($jawabanMurid));

        // ada jawaban salah → 0
        foreach ($jawabanMurid as $j) {
            if (!in_array($j, $jawabanBenar, true)) {
                return 0;
            }
        }

        if (count($jawabanBenar) === 0) return 0;

        return round(
            count(array_intersect($jawabanMurid, $jawabanBenar)) / count($jawabanBenar),
            2
        );
    }

    protected function cekTrueFalse(bool $jawabanMurid): float
    {
        return $jawabanMurid === ($this->jawaban_benar[0] ?? false) ? 1.0 : 0.0;
    }

    protected function cekOrdering(array $jawabanMurid): float
    {
        $benar = $this->jawaban_benar ?? [];
        if (count($benar) === 0) return 0;

        $match = 0;
        foreach ($benar as $i => $v) {
            if (isset($jawabanMurid[$i]) && $jawabanMurid[$i] === $v) {
                $match++;
            }
        }

        return round($match / count($benar), 2);
    }

    protected function cekMatching(array $jawabanMurid): float
    {
        $benar = $this->jawaban_benar ?? [];
        if (count($benar) === 0) return 0;

        $match = 0;
        foreach ($benar as $kiri => $kanan) {
            if (
                array_key_exists($kiri, $jawabanMurid) &&
                $jawabanMurid[$kiri] === $kanan
            ) {
                $match++;
            }
        }

        return round($match / count($benar), 2);
    }

    /* ======================================================
       CREATE / UPDATE WITH VALIDATION
    ====================================================== */
    public static function createValidated(array $data): self
    {
        self::validatePayload($data);
        return self::create(self::normalizeForStorage($data));
    }

    public function updateValidated(array $data): bool
    {
        self::validatePayload($data);
        return $this->update(self::normalizeForStorage($data));
    }

    /* ======================================================
       VALIDATION
    ====================================================== */
    protected static function validatePayload(array $data): void
    {
        if (!isset($data['tipe_pertanyaan'])) {
            throw ValidationException::withMessages([
                'tipe_pertanyaan' => 'Tipe pertanyaan wajib.',
            ]);
        }

        match ($data['tipe_pertanyaan']) {
            'multiple_choice_single' => self::validateMCSingle($data),
            'multiple_choice_multi'  => self::validateMCMulti($data),
            'true_false'             => self::validateTrueFalse($data),
            'ordering'               => self::validateOrdering($data),
            'matching'               => self::validateMatching($data),
            default => throw ValidationException::withMessages([
                'tipe_pertanyaan' => 'Tipe pertanyaan tidak valid.',
            ]),
        };
    }

    /* ================= VALIDATORS ================= */

    protected static function validateMCSingle(array $data): void
    {
        if (!is_array($data['opsi']) || count($data['opsi']) < 2) {
            throw ValidationException::withMessages([
                'opsi' => 'Minimal 2 opsi.',
            ]);
        }

        if (!is_int($data['jawaban_benar'])) {
            throw ValidationException::withMessages([
                'jawaban_benar' => 'Jawaban harus index integer.',
            ]);
        }
    }

    protected static function validateMCMulti(array $data): void
    {
        if (!is_array($data['opsi']) || count($data['opsi']) < 2) {
            throw ValidationException::withMessages([
                'opsi' => 'Minimal 2 opsi.',
            ]);
        }

        if (!is_array($data['jawaban_benar'])) {
            throw ValidationException::withMessages([
                'jawaban_benar' => 'Jawaban harus array index.',
            ]);
        }
    }

    protected static function validateTrueFalse(array $data): void
    {
        if (!is_bool($data['jawaban_benar'])) {
            throw ValidationException::withMessages([
                'jawaban_benar' => 'Jawaban harus boolean.',
            ]);
        }
    }

    protected static function validateOrdering(array $data): void
    {
        if (!is_array($data['opsi']) || !is_array($data['jawaban_benar'])) {
            throw ValidationException::withMessages([
                'ordering' => 'Opsi & jawaban harus array.',
            ]);
        }
    }

    protected static function validateMatching(array $data): void
    {
        if (
            !isset($data['opsi']['kiri'], $data['opsi']['kanan']) ||
            !is_array($data['jawaban_benar'])
        ) {
            throw ValidationException::withMessages([
                'matching' => 'Format matching tidak valid.',
            ]);
        }
    }

    /* ======================================================
       NORMALIZER STORAGE
    ====================================================== */
    protected static function normalizeForStorage(array $data): array
    {
        // simpan jawaban_benar selalu sebagai ARRAY (JSON aman)
        if ($data['tipe_pertanyaan'] === 'true_false') {
            $data['jawaban_benar'] = [(bool) $data['jawaban_benar']];
        }

        if ($data['tipe_pertanyaan'] === 'multiple_choice_single') {
            $data['jawaban_benar'] = [(int) $data['jawaban_benar']];
        }

        return $data;
    }
}