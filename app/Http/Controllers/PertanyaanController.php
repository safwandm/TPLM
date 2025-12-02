<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Pertanyaan;
use App\Models\Kuis;

class PertanyaanController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'kuis_id' => 'required|exists:kuis,id',
            'pertanyaan' => 'required|string',
            'opsi_a' => 'required|string',
            'opsi_b' => 'required|string',
            'opsi_c' => 'required|string',
            'opsi_d' => 'required|string',
            'jawaban_benar' => 'required|in:a,b,c,d',
            'url_gambar' => 'nullable|string',
            'persamaan_matematika' => 'nullable|string',
        ]);

        $pertanyaan = Pertanyaan::create($validated);

        return response()->json($pertanyaan, 201);
    }

    // Edit pertanyaan
    public function update(Request $request, $id)
    {
        $pertanyaan = Pertanyaan::findOrFail($id);

        $pertanyaan->update($request->all());

        return response()->json($pertanyaan);
    }

    // Hapus pertanyaan
    public function destroy($id)
    {
        $pertanyaan = Pertanyaan::findOrFail($id);

        $pertanyaan->delete();

        return response()->json(['message' => 'Pertanyaan dihapus']);
    }
}
