<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('kuis', function (Blueprint $table) {
            $table->id();

            $table->foreignId('creator_id')
                ->constrained('users')  
                ->onDelete('cascade');
                
            $table->string('judul');
            # TODO: belum jelas apakah waktu total per kuis atau per pertanyaan
            // $table->integer('total_waktu')->nullable(); 
            $table->boolean('tampilkan_jawaban_benar')->default(false);
            $table->boolean('tampilkan_peringkat')->default(false);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('kuis');
    }
};
