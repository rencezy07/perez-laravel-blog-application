<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function index()
    {
        return response()->json(Comment::with(['user', 'post'])->latest()->get());
    }

    public function show(Comment $comment)
    {
        return response()->json($comment->load(['user', 'post']));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'post_id' => ['required', 'exists:posts,id'],
            'content' => ['required', 'string', 'max:1000'],
        ]);

        $comment = Comment::create([
            'post_id' => $data['post_id'],
            'user_id' => $request->user()->id,
            'content' => $data['content'],
        ]);

        return response()->json(['comment' => $comment->load(['user', 'post'])], 201);
    }

    public function update(Request $request, Comment $comment)
    {
        if ($request->user()->id !== $comment->user_id && ! $request->user()->hasRole('admin')) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $data = $request->validate([
            'content' => ['required', 'string', 'max:1000'],
        ]);

        $comment->update($data);

        return response()->json(['comment' => $comment->load(['user', 'post'])]);
    }

    public function destroy(Request $request, Comment $comment)
    {
        if ($request->user()->id !== $comment->user_id && ! $request->user()->hasRole('admin')) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $comment->delete();

        return response()->json(['message' => 'Comment deleted successfully.']);
    }
}
