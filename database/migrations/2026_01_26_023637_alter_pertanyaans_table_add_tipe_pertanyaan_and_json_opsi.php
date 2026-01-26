<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

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

            // ubah tipe jawaban_benar
            $table->json('jawaban_benar')->change();

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

            // kembalikan jawaban_benar ke enum
            $table->enum('jawaban_benar', ['a', 'b', 'c', 'd'])->change();

            // hapus kolom baru
            $table->dropColumn([
                'tipe_pertanyaan',
                'opsi',
            ]);

        });
    }
};
