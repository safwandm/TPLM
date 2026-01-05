<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SesiKuis;
use App\Models\SesiPeserta;
use App\Events\ParticipantsUpdated;
use Illuminate\Support\Facades\Log;

class SesiPesertaController extends Controller
{
    public function join(Request $request, $kode)
    {
        $request->validate([
            'nama' => 'required|string|max:100',
        ]);

        $sesi = SesiKuis::where('kode', $kode)->first();
        if (!$sesi) {
            return response()->json(['message' => 'Sesi tidak ditemukan'], 404);
        }

        if ($sesi->status !== 'waiting') {  
            return response()->json(['message' => 'Sesi sudah dimulai atau selesai'], 422);
        }

        if (SesiPeserta::where('session_id', $sesi->id)->where('nama', $request->nama)->exists()) {
            return response()->json(['message' => 'Nama sudah dipakai dalam sesi ini'], 422);
        }

        $peserta = SesiPeserta::create([
            'session_id' => $sesi->id,
            'nama' => $request->nama,
            'total_skor' => 0
        ]);
        
        $pesertaList = SesiPeserta::where('session_id', $sesi->id)
            ->orderBy('nama')
            ->pluck('nama') 
            ->toArray();

        broadcast(new ParticipantsUpdated($sesi->id, $pesertaList));

        Log::info("Dispatching QuizStarting", ['sesi' => $sesi->id]);

        return response()->json([
            'message' => 'Berhasil bergabung ke sesi',
            'peserta' => $peserta,
        ]);
    }
}
