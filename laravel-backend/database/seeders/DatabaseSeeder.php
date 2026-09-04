<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $userRole = Role::firstOrCreate(['name' => 'user', 'guard_name' => 'web']);

        $admin = User::updateOrCreate(
            ['email' => env('ADMIN_EMAIL', 'admin@example.com')],
            [
                'name' => 'Admin User',
                'password' => env('ADMIN_PASSWORD', 'Admin123!'),
            ]
        );
        $admin->syncRoles([$adminRole]);

        $user = User::firstOrCreate(
            ['email' => 'user@example.com'],
            [
                'name' => 'Regular User',
                'password' => bcrypt('User123!'),
            ]
        );
        $user->syncRoles([$userRole]);

        $categories = ['Technology', 'Lifestyle', 'Travel', 'Design'];

        foreach ($categories as $name) {
            Category::firstOrCreate([
                'slug' => str($name)->slug()->toString(),
            ], ['name' => $name]);
        }

        $categoryIds = Category::pluck('id')->all();

        foreach (range(1, 5) as $index) {
            Post::factory()->create([
                'user_id' => $index % 2 === 0 ? $admin->id : $user->id,
                'category_id' => $categoryIds[array_rand($categoryIds)],
            ]);
        }
    }
}
