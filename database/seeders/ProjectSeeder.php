<?php

namespace Database\Seeders;

// database/seeders/ProjectSeeder.php

namespace Database\Seeders;

use App\Models\{Project, User};
use Illuminate\Database\Seeder;

class ProjectSeeder extends Seeder
{
    public function run() : void
    {
        // 既存ユーザーの誰かを所有者に（無ければ作る）
        $owner = User::first() ?? User::factory()->create([
            'name'     => 'Seeder User',
            'email'    => 'seed@example.com',
            'password' => \bcrypt('password'),
        ]);

        foreach ([
            ['name' => '仕事','color' => '#3b82f6'],
            ['name' => '学習','color' => '#10b981'],
            ['name' => '生活','color' => '#f59e0b'],
        ] as $row) {
            Project::updateOrCreate(
                ['owner_id' => $owner->id, 'name' => $row['name']],
                ['color' => $row['color']],
            );
        }
    }
}
