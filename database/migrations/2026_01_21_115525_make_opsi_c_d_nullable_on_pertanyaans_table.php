<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('pertanyaans', function (Blueprint $table) {
            $table->string('opsi_c')->nullable()->change();
            $table->string('opsi_d')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('pertanyaans', function (Blueprint $table) {
            $table->string('opsi_c')->nullable(false)->change();
            $table->string('opsi_d')->nullable(false)->change();
        });
    }
};

// This migration requires doctrine/dbal package to run the change() method.