<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Drop old CHECK constraint
        DB::statement("
            ALTER TABLE pertanyaans
            DROP CONSTRAINT IF EXISTS pertanyaans_jawaban_benar_check
        ");

        // Convert string → jsonb array
        DB::statement("
            ALTER TABLE pertanyaans
            ALTER COLUMN jawaban_benar
            TYPE jsonb
            USING jsonb_build_array(jawaban_benar)
        ");

        // Add question mode (string, not enum)
        Schema::table('pertanyaans', function (Blueprint $table) {
            $table->string('mode')->default('single');
        });
    }

    public function down(): void
    {
        // Convert jsonb → string (first answer)
        DB::statement("
            ALTER TABLE pertanyaans
            ALTER COLUMN jawaban_benar
            TYPE varchar
            USING jawaban_benar->>0
        ");

        // Restore old CHECK constraint
        DB::statement("
            ALTER TABLE pertanyaans
            ADD CONSTRAINT pertanyaans_jawaban_benar_check
            CHECK (jawaban_benar IN ('a','b','c','d'))
        ");

        Schema::table('pertanyaans', function (Blueprint $table) {
            $table->dropColumn('mode');
        });
    }
};