<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('pertanyaans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kuis_id')->constrained()->onDelete('cascade');
            $table->integer('urutan')->nullable()->after('kuis_id');

            $table->text('pertanyaan');
            $table->string('url_gambar')->nullable();
            $table->string('persamaan_matematika')->nullable();
            $table->integer('batas_waktu')->default(30);

            $table->enum('tipe_pertanyaan', [
                'multiple_choice_single',
                'multiple_choice_multi',
                'true_false',
                'matching',
                'ordering'
            ]);

            $table->json('opsi')->nullable();
            $table->json('jawaban_benar');

            $table->timestamps();
            
            $table->unique(['kuis_id', 'urutan']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('pertanyaan');
    }
};
