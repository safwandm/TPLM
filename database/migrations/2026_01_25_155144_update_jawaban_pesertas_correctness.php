<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

    public function up()
    {
        Schema::table('jawaban_pesertas', function (Blueprint $table) {
            // hapus boolean lama
            $table->dropColumn('is_benar');

            // tambah kolom baru (0–1)
            $table->float('correctness')->default(0)->after('waktu_jawab_ms');
        });
    }

    public function down()
    {
        Schema::table('jawaban_pesertas', function (Blueprint $table) {
            $table->dropColumn('correctness');
            $table->boolean('is_benar')->default(false)->after('waktu_jawab_ms');
        });
    }

};
