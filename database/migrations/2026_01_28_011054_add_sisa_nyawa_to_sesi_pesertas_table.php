<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;


return new class extends Migration
{
    public function up()
    {
        Schema::table('sesi_pesertas', function (Blueprint $table) {
            $table->integer('hp_sisa')
                ->nullable()
                ->after('total_skor');
        });
    }

    public function down()
    {
        Schema::table('sesi_pesertas', function (Blueprint $table) {
            $table->dropColumn('hp_sisa');
        });
    }
};
