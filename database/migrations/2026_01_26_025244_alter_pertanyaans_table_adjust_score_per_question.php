<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('pertanyaans', function (Blueprint $table) {
            // kalau null, pake value default di config/quiz.php
            $table->integer('skor')->nullable();
            $table->integer('skor_bonus_waktu')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pertanyaans', function (Blueprint $table) {        
            $table->dropColumn([
                'skor',
                'skor_bonus_waktu'
            ]);
        });
    }
};
