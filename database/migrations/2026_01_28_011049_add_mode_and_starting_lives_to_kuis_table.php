<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('kuis', function (Blueprint $table) {
            $table->enum('mode', ['classic', 'game'])
                ->default('classic')
                ->after('judul');

            $table->integer('hp_awal')
                ->nullable()
                ->after('mode');
        });
    }

    public function down()
    {
        Schema::table('kuis', function (Blueprint $table) {
            $table->dropColumn(['mode', 'hp_awal']);
        });
    }
};