<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index()
    {
        return response()->json(User::with('roles')->latest()->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->getRoleNames(),
            ];
        }));
    }

    public function updateRole(Request $request, User $user)
    {
        $data = $request->validate([
            'role' => ['required', 'in:admin,user'],
        ]);

        $user->syncRoles([$data['role']]);

        return response()->json([
            'message' => 'Role updated successfully.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->getRoleNames(),
            ],
        ]);
    }

    public function destroy(User $user)
    {
        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully.']);
    }
}
