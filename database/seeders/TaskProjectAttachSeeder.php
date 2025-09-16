<?php

namespace Database\Seeders;

// database/seeders/TaskProjectAttachSeeder.php

namespace Database\Seeders;

use App\Models\{Project, Task};
use Illuminate\Database\Seeder;

class TaskProjectAttachSeeder extends Seeder
{
    public function run() : void
    {
        $work  = Project::firstWhere('name', '仕事');
        $study = Project::firstWhere('name', '学習');
        $life  = Project::firstWhere('name', '生活');

        // ルール例：タイトルに含む語で振分け、残りは「仕事」
        Task::whereNull('project_id')->where('title', 'like', '%学習%')
            ->update(['project_id' => $study?->id]);
        Task::whereNull('project_id')->where('title', 'like', '%買い物%')
            ->update(['project_id' => $life?->id]);
        Task::whereNull('project_id')->update(['project_id' => $work?->id]);
    }
}
