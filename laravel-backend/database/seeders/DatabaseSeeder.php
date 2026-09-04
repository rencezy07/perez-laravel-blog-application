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

        $categoriesBySlug = Category::pluck('id', 'slug');
        $demoPosts = [
            ['title' => 'Welcome to the Blog', 'slug' => 'welcome-to-the-blog', 'category' => 'technology', 'user_id' => $admin->id],
            ['title' => 'Simple Ideas for Everyday Life', 'slug' => 'simple-ideas-for-everyday-life', 'category' => 'lifestyle', 'user_id' => $user->id],
            ['title' => 'Planning Your Next Adventure', 'slug' => 'planning-your-next-adventure', 'category' => 'travel', 'user_id' => $user->id],
            ['title' => 'Design Principles That Matter', 'slug' => 'design-principles-that-matter', 'category' => 'design', 'user_id' => $admin->id],
            ['title' => 'Building Better Projects', 'slug' => 'building-better-projects', 'category' => 'technology', 'user_id' => $user->id],
        ];

        foreach ($demoPosts as $demoPost) {
            Post::updateOrCreate(
                ['slug' => $demoPost['slug']],
                [
                    'title' => $demoPost['title'],
                    'content' => 'This is a demo post for the blog application.',
                    'category_id' => $categoriesBySlug[$demoPost['category']],
                    'user_id' => $demoPost['user_id'],
                ]
            );
        }
    }
}
