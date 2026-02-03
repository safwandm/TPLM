<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        Schema::table('pertanyaans', function (Blueprint $table) {

            // tambah kolom baru
            $table->enum('tipe_pertanyaan', [
                'multiple_choice_single',
                'multiple_choice_multi',
                'true_false',
                'matching',
                'ordering'
            ])->default('multiple_choice_single')->after('batas_waktu');

            $table->json('opsi')->nullable()->after('tipe_pertanyaan');
        });

        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("
                ALTER TABLE pertanyaans
                ALTER COLUMN jawaban_benar
                TYPE json
                USING jawaban_benar::json
            ");
        }

        if ($driver === 'sqlite') {
            Schema::table('pertanyaans', function (Blueprint $table) {
                $table->json('jawaban_benar')->change();
            });
        }

        Schema::table('pertanyaans', function (Blueprint $table) {
            // hapus kolom opsi lama
            $table->dropColumn([
                'opsi_a',
                'opsi_b',
                'opsi_c',
                'opsi_d',
            ]);
        });
    }

    public function down()
    {
        Schema::table('pertanyaans', function (Blueprint $table) {

            // kembalikan kolom opsi lama
            $table->string('opsi_a')->after('batas_waktu');
            $table->string('opsi_b')->after('opsi_a');
            $table->string('opsi_c')->after('opsi_b');
            $table->string('opsi_d')->after('opsi_c');

            // hapus kolom baru
            $table->dropColumn([
                'tipe_pertanyaan',
                'opsi',
            ]);
        });
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("
                ALTER TABLE pertanyaans
                ALTER COLUMN jawaban_benar
                TYPE text
            ");
        }

        if ($driver === 'sqlite') {
            Schema::table('pertanyaans', function (Blueprint $table) {
                $table->text('jawaban_benar')->change();
            });
        }
    }
};
