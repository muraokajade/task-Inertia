<?php

// database/migrations/xxxx_xx_xx_xxxxxx_create_activity_logs_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up() : void
    {
        Schema::create('activity_logs', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $t->string('action', 64);                  // ex: task.created
            $t->string('entity_type', 64)->nullable(); // ex: task
            $t->unsignedBigInteger('entity_id')->nullable();
            $t->json('before')->nullable();
            $t->json('after')->nullable();
            $t->json('meta')->nullable();              // 任意: ids, count など
            $t->string('ip', 45)->nullable();
            $t->string('ua', 255)->nullable();
            $t->timestamps();

            $t->index(['entity_type','entity_id']);
            $t->index('created_at');
        });
    }
    public function down() : void
    {
        Schema::dropIfExists('activity_logs');
    }
};
