<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_and_fetch_current_user(): void
    {
        $role = Role::create(['name' => 'user']);
        $user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'user@example.com',
            'password' => bcrypt('User123!'),
        ]);
        $user->assignRole($role);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'user@example.com',
            'password' => 'User123!',
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'token',
                'user' => ['id', 'name', 'email'],
            ]);

        $this->assertAuthenticated();

        $me = $this->withHeader('Authorization', 'Bearer ' . $response->json('token'))
            ->getJson('/api/auth/me');

        $me->assertOk()
            ->assertJsonPath('user.email', 'user@example.com');
    }

    public function test_user_can_register(): void
    {
        Role::firstOrCreate(['name' => 'user', 'guard_name' => 'web']);

        $response = $this->postJson('/api/auth/register', [
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'token',
                'user' => ['id', 'name', 'email'],
            ])
            ->assertJsonPath('user.email', 'newuser@example.com');

        $this->assertDatabaseHas('users', ['email' => 'newuser@example.com']);
        $this->assertTrue(User::where('email', 'newuser@example.com')->first()->hasRole('user'));
    }

    public function test_admin_can_access_posts_index(): void
    {
        $role = Role::create(['name' => 'admin']);
        $admin = User::factory()->create([
            'email' => 'admin@example.com',
            'password' => bcrypt('Admin123!'),
        ]);
        $admin->assignRole($role);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/posts')
            ->assertOk();
    }
}
