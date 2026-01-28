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
        Schema::table('kuis', function (Blueprint $table) {
            $table->string('teks_waiting_room')->nullable();
            $table->string('teks_penutup')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kuis', function (Blueprint $table) {
            $table->dropColumn([
                'teks_waiting_room',
                'teks_penutup'
            ]);
        });
    }
};
