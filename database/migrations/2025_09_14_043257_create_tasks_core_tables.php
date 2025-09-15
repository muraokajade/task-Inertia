<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // projects
        Schema::create('projects', function (Blueprint $t) {
            $t->id();
            $t->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $t->string('name', 120);
            $t->string('color', 16)->nullable();
            $t->timestamp('archived_at')->nullable();
            $t->timestamps();
        });

        // tasks
        Schema::create('tasks', function (Blueprint $t) {
            $t->id();
            $t->foreignId('project_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('creator_id')->constrained('users')->cascadeOnDelete();
            $t->foreignId('assignee_id')->nullable()->constrained('users')->nullOnDelete();
            $t->foreignId('parent_id')->nullable()->constrained('tasks')->cascadeOnDelete();
            $t->string('title', 160);
            $t->text('description')->nullable();
            $t->string('status', 16)->default('todo');      // todo/doing/done/archived
            $t->string('priority', 16)->default('normal');  // low/normal/high/urgent
            $t->date('start_date')->nullable();
            $t->date('due_date')->nullable();
            $t->timestamp('completed_at')->nullable();
            $t->unsignedInteger('position')->default(0);
            $t->json('labels')->nullable();                 // SQLiteは内部的にTEXTでOK
            $t->timestamps();
            $t->softDeletes();

            $t->index(['project_id','assignee_id','status']);
            $t->index(['due_date','completed_at']);
        });

        // task_comments
        Schema::create('task_comments', function (Blueprint $t) {
            $t->id();
            $t->foreignId('task_id')->constrained('tasks')->cascadeOnDelete();
            $t->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $t->text('body');
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_comments');
        Schema::dropIfExists('tasks');
        Schema::dropIfExists('projects');
    }
};
