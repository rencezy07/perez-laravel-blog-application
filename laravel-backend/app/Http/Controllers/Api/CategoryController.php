<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    public function index()
    {
        return response()->json(Category::all());
    }

    public function show(Category $category)
    {
        return response()->json($category);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('categories', 'name')],
        ]);

        $category = Category::create([
            'name' => $data['name'],
            'slug' => str($data['name'])->slug()->toString(),
        ]);

        return response()->json($category, 201);
    }

    public function update(Request $request, Category $category)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255', Rule::unique('categories', 'name')->ignore($category)],
        ]);

        $category->update([
            'name' => $data['name'] ?? $category->name,
            'slug' => str(($data['name'] ?? $category->name))->slug()->toString(),
        ]);

        return response()->json($category);
    }

    public function destroy(Category $category)
    {
        $category->delete();

        return response()->json(['message' => 'Category deleted successfully.']);
    }
}
