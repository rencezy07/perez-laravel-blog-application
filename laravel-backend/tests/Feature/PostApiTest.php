<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PostApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_own_post(): void
    {
        $role = Role::create(['name' => 'user']);
        $user = User::factory()->create([
            'email' => 'user2@example.com',
            'password' => bcrypt('User123!'),
        ]);
        $user->assignRole($role);

        $category = Category::factory()->create(['name' => 'News']);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/posts', [
            'title' => 'My first post',
            'content' => 'This is my content.',
            'category_id' => $category->id,
        ]);

        $response->assertCreated()
            ->assertJsonPath('post.title', 'My first post');

        $this->assertDatabaseHas('posts', ['title' => 'My first post', 'user_id' => $user->id]);
    }
}
