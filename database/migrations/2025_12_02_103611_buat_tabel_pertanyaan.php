<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('pertanyaan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kuis_id')->constrained()->onDelete('cascade');

            $table->text('pertanyaan');
            $table->string('url_gambar')->nullable();
            $table->string('persamaan_matematika')->nullable();

            $table->string('opsi_a');
            $table->string('opsi_b');
            $table->string('opsi_c');
            $table->string('opsi_d');

            $table->enum('jawaban_benar', ['a', 'b', 'c', 'd']);

            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('pertanyaan');
    }
};
