<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Kuis;
use App\Models\Pertanyaan;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TestSeeder extends Seeder
{
    public function run(): void
    {
        // ============================================================
        // 1. CREATE TEACHER USER
        // ============================================================
        $teacher = User::firstOrCreate(
            ['email' => 'teacher@example.com'],
            [
                'name' => 'Teacher Example',
                'password' => Hash::make('password123'),
            ]
        );

        if (!$teacher->hasRole('teacher')) {
            $teacher->assignRole('teacher');
        }

        // ============================================================
        // 2. CREATE SAMPLE KUIS
        // ============================================================
        $kuis = Kuis::create([
            'creator_id' => $teacher->id,
            'judul' => 'Contoh Kuis Matematika',
            'tampilkan_jawaban_benar' => true,
            'tampilkan_peringkat' => true,
        ]);

        // ============================================================
        // 3. CREATE SAMPLE QUESTIONS (ALL QUESTION TYPES)
        // ============================================================
        $questions = [

            // --------------------------------------------------------
            // Multiple Choice - Single Answer
            // --------------------------------------------------------
            [
                'urutan' => 1,
                'tipe_pertanyaan' => 'multiple_choice_single',
                'pertanyaan' => 'Berapakah hasil dari 5 + 7?',
                'opsi' => ['10', '11', '12', '13'],
                'jawaban_benar' => 2,
                'batas_waktu' => 30,
            ],

            // --------------------------------------------------------
            // Multiple Choice - Multiple Answers
            // --------------------------------------------------------
            [
                'urutan' => 2,
                'tipe_pertanyaan' => 'multiple_choice_multi',
                'pertanyaan' => 'Manakah bilangan prima?',
                'opsi' => ['4', '5', '6', '7'],
                'jawaban_benar' => [1, 3],
                'batas_waktu' => 30,
            ],

            // --------------------------------------------------------
            // True / False
            // --------------------------------------------------------
            [
                'urutan' => 3,
                'tipe_pertanyaan' => 'true_false',
                'pertanyaan' => 'Angka 0 adalah bilangan genap.',
                'opsi' => [true, false],
                'jawaban_benar' => true,
                'batas_waktu' => 20,
            ],

            // --------------------------------------------------------
            // Ordering
            // --------------------------------------------------------
            [
                'urutan' => 4,
                'tipe_pertanyaan' => 'ordering',
                'pertanyaan' => 'Urutkan bilangan dari yang terkecil.',
                'opsi' => ['5', '1', '3'],
                'jawaban_benar' => [1, 2, 0],
                'batas_waktu' => 45,
            ],

            // --------------------------------------------------------
            // Matching
            // --------------------------------------------------------
            [
                'urutan' => 5,
                'tipe_pertanyaan' => 'matching',
                'pertanyaan' => 'Pasangkan operasi dengan hasilnya.',
                'opsi' => [
                    'kiri' => ['2 + 2', '3 × 3', '10 ÷ 2'],
                    'kanan' => ['5', '4', '9'],
                ],
                'jawaban_benar' => [
                    0 => 1, // 2+2 -> 4
                    1 => 2, // 3x3 -> 9
                    2 => 0, // 10/2 -> 5
                ],
                'batas_waktu' => 60,
            ],
        ];

        foreach ($questions as $q) {
            Pertanyaan::createValidated([
                'kuis_id' => $kuis->id,
                'urutan' => $q['urutan'],
                'tipe_pertanyaan' => $q['tipe_pertanyaan'],
                'pertanyaan' => $q['pertanyaan'],
                'opsi' => $q['opsi'],
                'jawaban_benar' => $q['jawaban_benar'],
                'batas_waktu' => $q['batas_waktu'] ?? null,
            ]);
        }

        $kuis = Kuis::create([
            'creator_id' => $teacher->id,
            'judul' => 'Contoh Kuis Matematika (game)',
            'tampilkan_jawaban_benar' => true,
            'tampilkan_peringkat' => true,
            'mode' => 'game',
            'hp_awal' => 3
        ]);

        foreach ($questions as $q) {
            Pertanyaan::createValidated([
                'kuis_id' => $kuis->id,
                'urutan' => $q['urutan'],
                'tipe_pertanyaan' => $q['tipe_pertanyaan'],
                'pertanyaan' => $q['pertanyaan'],
                'opsi' => $q['opsi'],
                'jawaban_benar' => $q['jawaban_benar'],
                'batas_waktu' => $q['batas_waktu'] ?? null,
            ]);
        }
        

        echo "TestSeeder executed successfully.\n";
    }
}
