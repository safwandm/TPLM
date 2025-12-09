<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('jawaban_pesertas', function (Blueprint $table) {
            $table->id();

            $table->foreignId('peserta_id')->constrained('sesi_pesertas')->onDelete('cascade');
            $table->foreignId('pertanyaan_id')->constrained('pertanyaans')->onDelete('cascade');

            $table->enum('jawaban', ['a', 'b', 'c', 'd'])->nullable();
            $table->integer('waktu_jawab_ms')->nullable();

            # karena bisa jadi soal berubah sejak instance ini dibuat
            $table->boolean('is_benar')->default(false);

            $table->timestamps();

            $table->unique(['peserta_id', 'pertanyaan_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('jawaban_pesertas');
    }
};
