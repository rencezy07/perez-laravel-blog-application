<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PostFactory extends Factory
{
    protected $model = Post::class;

    public function definition(): array
    {
        $title = fake()->sentence(6);

        return [
            'title' => $title,
            'slug' => str($title)->slug()->toString(),
            'content' => fake()->paragraphs(3, true),
            'category_id' => Category::factory(),
            'user_id' => User::factory(),
        ];
    }
}
