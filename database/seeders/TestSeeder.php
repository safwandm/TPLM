<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Kuis;
use App\Models\Pertanyaan;
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
                'password' => Hash::make('password123')
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
        // 3. CREATE SAMPLE QUESTIONS FOR THE KUIS
        // ============================================================
        $questions = [
            [
                'urutan' => 1,
                'pertanyaan' => 'Berapakah hasil dari 5 + 7?',
                'opsi_a' => '10',
                'opsi_b' => '11',
                'opsi_c' => '12',
                'opsi_d' => '13',
                'jawaban_benar' => 'c',
                'batas_waktu' => 30,
            ],
            [
                'urutan' => 2,
                'pertanyaan' => 'Manakah bilangan prima?',
                'opsi_a' => '4',
                'opsi_b' => '6',
                'opsi_c' => '7',
                'opsi_d' => '9',
                'jawaban_benar' => 'c',
                'batas_waktu' => 30,
            ],
        ];

        foreach ($questions as $q) {
            Pertanyaan::create(array_merge($q, [
                'kuis_id' => $kuis->id,
            ]));
        }

        echo "KuisSeeder executed successfully.\n";
    }
}
