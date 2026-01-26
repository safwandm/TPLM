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
        // 3. CREATE SAMPLE QUESTIONS (NEW STRUCTURE)
        // ============================================================
        $questions = [
            [
                'urutan' => 1,
                'tipe_pertanyaan' => 'multiple_choice_single',
                'pertanyaan' => 'Berapakah hasil dari 5 + 7?',
                'opsi' => [
                    '10',
                    '11',
                    '12',
                    '13',
                ],
                'jawaban_benar' => 2, // index dari opsi (0-based)
                'batas_waktu' => 30,
            ],
            [
                'urutan' => 2,
                'tipe_pertanyaan' => 'multiple_choice_single',
                'pertanyaan' => 'Manakah bilangan prima?',
                'opsi' => [
                    '4',
                    '6',
                    '7',
                    '9',
                ],
                'jawaban_benar' => 2,
                'batas_waktu' => 30,
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

        echo "TestSeeder executed successfully.\n";
    }
}
