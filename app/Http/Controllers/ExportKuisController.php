<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class ExportKuisController extends Controller
{
    public function exportBySesi(int $sesiId)
    {
        $skorMaksimal = DB::table('pertanyaans as p')
            ->join('sesi_kuis as sk', 'sk.kuis_id', '=', 'p.kuis_id')
            ->where('sk.id', $sesiId)
            ->selectRaw('
                COALESCE(SUM(
                    COALESCE(p.skor, 0) + COALESCE(p.skor_bonus_waktu, 0)
                ), 0) as skor_maksimal
            ')
            ->value('skor_maksimal');

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

        $callback = function () use ($rows, $skorMaksimal) {
            $file = fopen('php://output', 'w');

            fputcsv($file, [
                'Nama Murid',
                'Total Skor',
                'Skor Maksimal',
                'Persentase Skor (%)',
                'Jumlah Jawaban Benar',
                'Total Pertanyaan',
                'Persentase Benar (%)',
            ]);

            foreach ($rows as $row) {
                $persentaseBenar = $row->total_pertanyaan > 0
                    ? round(($row->jumlah_benar / $row->total_pertanyaan) * 100, 2)
                    : 0;

                $persentaseSkor = $skorMaksimal > 0
                    ? round(($row->total_skor / $skorMaksimal) * 100, 2)
                    : 0;

                fputcsv($file, [
                    $row->nama,
                    $row->total_skor,
                    $skorMaksimal,
                    $persentaseSkor,
                    $row->jumlah_benar,
                    $row->total_pertanyaan,
                    $persentaseBenar,
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, Response::HTTP_OK, $headers);
    }

    public function exportSesiDetail(int $sesiId)
    {
        $pertanyaans = DB::table('pertanyaans as p')
            ->join('sesi_kuis as sk', 'sk.kuis_id', '=', 'p.kuis_id')
            ->where('sk.id', $sesiId)
            ->orderBy('p.urutan')
            ->select('p.id', 'p.urutan')
            ->get();

        $skorMaksimal = DB::table('pertanyaans as p')
            ->join('sesi_kuis as sk', 'sk.kuis_id', '=', 'p.kuis_id')
            ->where('sk.id', $sesiId)
            ->selectRaw('
                COALESCE(SUM(
                    COALESCE(p.skor, 0) + COALESCE(p.skor_bonus_waktu, 0)
                ), 0)
            ')
            ->value('COALESCE(SUM(
                COALESCE(p.skor, 0) + COALESCE(p.skor_bonus_waktu, 0)
            ), 0)');

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

        $callback = function () use ($pesertas, $pertanyaans, $jawabans, $skorMaksimal) {
            $file = fopen('php://output', 'w');


            $headerRow = [
                'Nama Murid',
                'Total Skor',
                'Skor Maksimal',
                'Persentase Skor (%)',
                'Jumlah Jawaban Benar',
                'Total Pertanyaan',
                'Persentase Benar (%)',
            ];

            foreach ($pertanyaans as $p) {
                $headerRow[] = 'Soal ' . $p->urutan . ' (Benar)';
                $headerRow[] = 'Soal ' . $p->urutan . ' (Skor)';
            }

            fputcsv($file, $headerRow);

            foreach ($pesertas as $peserta) {
                $totalPertanyaan = count($pertanyaans);
                $jumlahBenar = 0;
                $totalSkorPeserta = 0;

                foreach ($pertanyaans as $p) {
                    $key = $peserta->id . '-' . $p->id;

                    if (isset($jawabans[$key])) {
                        $jawaban = $jawabans[$key][0];
                        $totalSkorPeserta += $jawaban->total_skor;

                        if ($jawaban->correctness == 1) {
                            $jumlahBenar++;
                        }
                    }
                }

                $persentaseBenar = $totalPertanyaan > 0
                    ? round(($jumlahBenar / $totalPertanyaan) * 100, 2)
                    : 0;

                $persentaseSkor = $skorMaksimal > 0
                    ? round(($totalSkorPeserta / $skorMaksimal) * 100, 2)
                    : 0;

                $row = [
                    $peserta->nama,
                    $totalSkorPeserta,
                    $skorMaksimal,
                    $persentaseSkor,
                    $jumlahBenar,
                    $totalPertanyaan,
                    $persentaseBenar,
                ];


                foreach ($pertanyaans as $p) {
                    $key = $peserta->id . '-' . $p->id;

                    if (isset($jawabans[$key])) {
                        $jawaban = $jawabans[$key][0];
                        $row[] = $jawaban->correctness;
                        $row[] = $jawaban->total_skor;
                    } else {
                        $row[] = '-';
                        $row[] = 0;
                    }
                }

                fputcsv($file, $row);
            }

            fclose($file);
        };

        return response()->stream($callback, Response::HTTP_OK, $headers);
    }

}
