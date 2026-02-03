<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::statement("
            ALTER TABLE jawaban_pesertas
            ALTER COLUMN jawaban TYPE json
            USING jawaban::json
        ");

        DB::statement("
            ALTER TABLE jawaban_pesertas
            ALTER COLUMN jawaban DROP NOT NULL
        ");

        DB::statement("
            ALTER TABLE jawaban_pesertas
            ALTER COLUMN jawaban DROP DEFAULT
        ");
    }

    public function down(): void
    {
        DB::statement("
            ALTER TABLE jawaban_pesertas
            ALTER COLUMN jawaban TYPE text
        ");
    }
};
