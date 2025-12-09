<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('sesi_kuis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kuis_id')->constrained('kuis')->onDelete('cascade');
            $table->string('kode', 10)->unique();
            $table->enum('status', ['waiting', 'running', 'finished'])->default('waiting');
            $table->timestamp('dimulai_pada')->nullable();
            $table->timestamp('berakhir_pada')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('sesi_kuis');
    }
};
