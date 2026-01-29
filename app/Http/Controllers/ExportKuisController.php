<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class ExportKuisController extends Controller
{
    public function exportBySesi(int $sesiId)
    {
        $rows = DB::table('sesi_pesertas as sp')
            ->leftJoin('jawaban_pesertas as jp', 'jp.peserta_id', '=', 'sp.id')
            ->leftJoin('pertanyaans as p', 'p.id', '=', 'jp.pertanyaan_id')
            ->where('sp.session_id', $sesiId)
            ->groupBy('sp.id', 'sp.nama', 'sp.total_skor')
            ->select([
                'sp.nama',
                'sp.total_skor',
                DB::raw('SUM(CASE WHEN jp.correctness = 1 THEN 1 ELSE 0 END) as jumlah_benar'),
                DB::raw('COUNT(DISTINCT p.id) as total_pertanyaan'),
            ])
            ->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"hasil_sesi_{$sesiId}.csv\"",
        ];

        $callback = function () use ($rows) {
            $file = fopen('php://output', 'w');

            fputcsv($file, [
                'Nama Murid',
                'Skor',
                'Jumlah Jawaban Benar',
                'Total Pertanyaan',
                'Persentase Benar (%)',
            ]);

            foreach ($rows as $row) {
                $persentase = $row->total_pertanyaan > 0
                    ? round(($row->jumlah_benar / $row->total_pertanyaan) * 100, 2)
                    : 0;

                fputcsv($file, [
                    $row->nama,
                    $row->total_skor,
                    $row->jumlah_benar,
                    $row->total_pertanyaan,
                    $persentase,
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, Response::HTTP_OK, $headers);
    }

    public function exportSesiDetail(int $sesiId)
    {
        $pertanyaans = DB::table('pertanyaans')
            ->join('sesi_kuis', 'sesi_kuis.kuis_id', '=', 'pertanyaans.kuis_id')
            ->where('sesi_kuis.id', $sesiId)
            ->orderBy('pertanyaans.urutan')
            ->select('pertanyaans.id', 'pertanyaans.urutan')
            ->get();

        $pesertas = DB::table('sesi_pesertas')
            ->where('session_id', $sesiId)
            ->get();

        $jawabans = DB::table('jawaban_pesertas')
            ->whereIn('peserta_id', $pesertas->pluck('id'))
            ->get()
            ->groupBy(fn ($j) => $j->peserta_id . '-' . $j->pertanyaan_id);

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"detail_sesi_{$sesiId}.csv\"",
        ];

        $callback = function () use ($pesertas, $pertanyaans, $jawabans) {
            $file = fopen('php://output', 'w');

            $headerRow = [
                'Nama Murid',
                'Skor',
                'Jumlah Jawaban Benar',
                'Total Pertanyaan',
                'Persentase Benar (%)',
            ];

            foreach ($pertanyaans as $p) {
                $headerRow[] = 'Soal ' . $p->urutan;
            }

            fputcsv($file, $headerRow);

            foreach ($pesertas as $peserta) {
                $totalPertanyaan = count($pertanyaans);
                $jumlahBenar = 0;

                $row = [
                    $peserta->nama,
                    $peserta->total_skor,
                ];

                foreach ($pertanyaans as $p) {
                    $key = $peserta->id . '-' . $p->id;
                    if (isset($jawabans[$key]) && $jawabans[$key][0]->correctness == 1) {
                        $jumlahBenar++;
                    }
                }

                $persentase = $totalPertanyaan > 0
                    ? round(($jumlahBenar / $totalPertanyaan) * 100, 2)
                    : 0;

                $row[] = $jumlahBenar;
                $row[] = $totalPertanyaan;
                $row[] = $persentase;

                foreach ($pertanyaans as $p) {
                    $key = $peserta->id . '-' . $p->id;

                    if (isset($jawabans[$key])) {
                        $row[] = $jawabans[$key][0]->correctness;
                    } else {
                        $row[] = 'Tidak Menjawab';
                    }
                }

                fputcsv($file, $row);
            }

            fclose($file);
        };

        return response()->stream($callback, Response::HTTP_OK, $headers);
    }

}
