<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('sesi_pesertas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('sesi_kuis')->onDelete('cascade');
            $table->string('nama');
            $table->integer('total_skor')->default(0);
            $table->timestamps();

            $table->unique(['session_id', 'nama']); // nama peserta wajib unik per sesi
        });
    }

    public function down()
    {
        Schema::dropIfExists('sesi_pesertas');
    }
};
