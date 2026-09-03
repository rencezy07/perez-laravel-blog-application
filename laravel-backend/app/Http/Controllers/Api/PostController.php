<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PostController extends Controller
{
    public function index()
    {
        $posts = Post::with(['category', 'user', 'comments.user'])->latest()->get();

        return response()->json($posts);
    }

    public function show(Post $post)
    {
        $post->load(['category', 'user', 'comments.user']);

        return response()->json($post);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'category_id' => ['required', 'exists:categories,id'],
        ]);

        $post = Post::create([
            'title' => $data['title'],
            'slug' => Str::slug($data['title']),
            'content' => $data['content'],
            'category_id' => $data['category_id'],
            'user_id' => $request->user()->id,
        ]);

        $post->load(['category', 'user', 'comments.user']);

        return response()->json(['post' => $post], 201);
    }

    public function update(Request $request, Post $post)
    {
        if ($request->user()->id !== $post->user_id && ! $request->user()->hasRole('admin')) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'content' => ['sometimes', 'string'],
            'category_id' => ['sometimes', 'exists:categories,id'],
        ]);

        $post->fill([
            'title' => $data['title'] ?? $post->title,
            'slug' => isset($data['title']) ? Str::slug($data['title']) : $post->slug,
            'content' => $data['content'] ?? $post->content,
            'category_id' => $data['category_id'] ?? $post->category_id,
        ]);
        $post->save();
        $post->load(['category', 'user', 'comments.user']);

        return response()->json(['post' => $post]);
    }

    public function destroy(Request $request, Post $post)
    {
        if ($request->user()->id !== $post->user_id && ! $request->user()->hasRole('admin')) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $post->delete();

        return response()->json(['message' => 'Post deleted successfully.']);
    }
}
