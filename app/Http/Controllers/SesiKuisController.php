<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

use App\Models\SesiKuis;
use App\Models\Kuis;
use App\Models\Pertanyaan;
use App\Jobs\ActivateQuestion;
use App\Jobs\EndQuestion;

class SesiKuisController extends Controller
{

    public function create(Request $request)
    {
        $request->validate([
            'kuis_id' => 'required|exists:kuis,id',
        ]);

        $user = $request->user();

        $kuis = Kuis::findOrFail($request->kuis_id);
        if ($kuis->creator_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        do {
            $kode = strtoupper(str()->random(6));
        } while (SesiKuis::where('kode', $kode)->exists());

        $session = SesiKuis::create([
            'kuis_id' => $kuis->id,
            'kode' => $kode,
            'status' => 'waiting', 
        ]);

        return response()->json([
            'message' => 'Sesi baru berhasil dibuat',
            'sesi' => $session,
        ]);
    }

    public function start(Request $request, $id)
    {
        $user = $request->user();

        $session = SesiKuis::with('kuis')->findOrFail($id);

        if ($session->status !== 'waiting') {
            return response()->json(['message' => 'Sesi sudah dimulai atau selesai'], 422);
        }

        if ($user->id !== $session->kuis->creator_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        DB::transaction(function () use ($session) {
            $session->status = 'running';
            $session->dimulai_pada = Carbon::now();
            $session->save();
        });

        $questions = Pertanyaan::where('kuis_id', $session->kuis_id)
                        ->orderBy('created_at') 
                        ->get();

        if ($questions->isEmpty()) {
            $session->status = 'finished';
            $session->berakhir_pada = Carbon::now();
            $session->save();
            return response()->json(['message' => 'Tidak ada soal pada kuis ini'], 200);
        }
        
        $first = $questions->first();

        ActivateQuestion::dispatch($session->id, $first->id, $questions->pluck('id')->toArray());

        return response()->json(['message' => 'Sesi dimulai'], 200);
    }

    // Optional: endpoint untuk memaksa selesai (mis. saat emergency)
    public function forceFinish(Request $request, $id)
    {
        $user = $request->user();
        $session = SesiKuis::findOrFail($id);

        // cek permission (sama seperti di start)
        if ($user->id !== $session->kuis->creator_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $session->status = 'finished';
        $session->berakhir_pada = Carbon::now();
        $session->save();

        // clear cache keys
        Cache::forget("sesi:{$session->id}:current_question");
        Cache::forget("sesi:{$session->id}:question_ends_at");

        // broadcast jika ingin memberitahu frontend (bisa lakukan event SessionFinished)
        event(new \App\Events\SessionFinished($session));

        return response()->json(['message' => 'Sesi dipaksa selesai'], 200);
    }
}
