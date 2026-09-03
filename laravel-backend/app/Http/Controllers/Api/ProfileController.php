<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        return response()->json([
            'user' => [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'email' => $request->user()->email,
                'roles' => $request->user()->getRoleNames(),
            ],
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'unique:users,email,' . $request->user()->id],
            'password' => ['sometimes', 'string', 'min:8', 'confirmed'],
        ]);

        if (isset($data['name'])) {
            $request->user()->name = $data['name'];
        }

        if (isset($data['email'])) {
            $request->user()->email = $data['email'];
        }

        if (isset($data['password'])) {
            $request->user()->password = Hash::make($data['password']);
        }

        $request->user()->save();

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $request->user()->fresh(),
        ]);
    }
}
