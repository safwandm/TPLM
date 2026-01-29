<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('jawaban_pesertas', function (Blueprint $table) {
            $table->json('jawaban')->nullable()->change();
        });
    }

    public function down()
    {
        Schema::table('jawaban_pesertas', function (Blueprint $table) {
             $table->enum('jawaban', ['a','b','c','d'])->nullable()->change();
        });
    }
};
