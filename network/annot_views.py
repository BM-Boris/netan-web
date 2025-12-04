# network/annot_views.py

from __future__ import annotations

import io
import os
import tempfile
import contextlib

from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework import status

# твоя библиотека
from annot import run_lc, run_gc


def _detect_sep_from_bytes(data: bytes) -> str:
    """
    Простейший авто-детект сепаратора по первым ~8 KB текста.
    Кандидаты: ',', '\\t', ';', '|'. Если ничего не нашли – по умолчанию таб.
    """
    head = data[:8192].decode("utf-8", "ignore")
    candidates = [",", "\t", ";", "|"]
    counts = {c: head.count(c) for c in candidates}
    best = max(counts, key=counts.get)
    return best if counts[best] > 0 else "\t"


class AnnotateView(APIView):
    """
    POST /annotate/

    Принимает:
      file        — feature table (CSV/TSV)
      mode        — 'lc' или 'gc' (default 'lc')
      separator   — ',', ';', '\\t', '|' (если нет — auto detect)
      mz_col      — имя колонки m/z (default 'mz')
      rt_col      — имя колонки RT  (default 'rt')

      LC-специфичное:
        mz_diff, time_diff, ion_mode, adducts, lib, shift

      GC-специфичное:
        mz_diff, time_diff, time_range, ngroup, shift

    Возвращает JSON:
      {
        columns: [...],
        preview: [ {row}, ... ],   // до 200 строк
        rowCount: int,
        logs: "текст всех print/tqdm",
        csv: "полный CSV как текст"
      }
    """

    def post(self, request, format=None):
        try:
            upload = request.FILES.get("file")
            if upload is None:
                return JsonResponse(
                    {"error": "Missing 'file' in request."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # ─────────────────────────
            # параметры из запроса
            # ─────────────────────────
            mode = (request.data.get("mode") or "lc").lower()
            if mode not in {"lc", "gc"}:
                return JsonResponse(
                    {"error": "mode must be 'lc' or 'gc'"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # separator: если не пришёл — auto detect
            sep = request.data.get("separator", "")
            if sep == "\\t":
                sep = "\t"

            mz_col = request.data.get("mz_col", "mz")
            rt_col = request.data.get("rt_col", "rt")

            def _get_float(name: str, default: float) -> float:
                v = request.data.get(name)
                return float(v) if v not in (None, "",) else default

            def _get_int(name: str, default: int) -> int:
                v = request.data.get(name)
                return int(v) if v not in (None, "",) else default

            mz_diff = _get_float("mz_diff", 5e-6)
            time_diff = _get_float("time_diff", 0.05)
            shift = request.data.get("shift", "auto")

            ion_mode = request.data.get("ion_mode", "pos")
            lib = request.data.get("lib", "hmdb")

            time_range = _get_float("time_range", 2.0)
            ngroup = _get_int("ngroup", 3)

            adducts_raw = request.data.get("adducts", "")
            adducts = [
                a.strip() for a in adducts_raw.split(",") if a.strip()
            ] or None

            # ─────────────────────────
            # читаем файл один раз в память
            # ─────────────────────────
            data_bytes = b"".join(upload.chunks())

            # авто-детект сепаратора, если не пришёл от фронта
            if not sep:
                sep = _detect_sep_from_bytes(data_bytes)

            # ─────────────────────────
            # пишем во временный файл (run_lc/run_gc ожидают путь)
            # ─────────────────────────
            with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as tmp:
                tmp.write(data_bytes)
                tmp_path = tmp.name

            # ─────────────────────────
            # перехватываем все print/tqdm в буфер
            # ─────────────────────────
            log_buffer = io.StringIO()
            try:
                with contextlib.redirect_stdout(log_buffer), contextlib.redirect_stderr(
                    log_buffer
                ):
                    if mode == "lc":
                        df = run_lc(
                            data=tmp_path,
                            sep=sep,
                            mz_col=mz_col,
                            rt_col=rt_col,
                            mz_diff=mz_diff,
                            time_diff=time_diff,
                            ion_mode=ion_mode,
                            adducts=adducts,
                            lib=lib,
                            shift=shift,
                            save=None, show_progress=False,
                        )
                    else:
                        df = run_gc(
                            data=tmp_path,
                            sep=sep,
                            mz_col=mz_col,
                            rt_col=rt_col,
                            mz_diff=mz_diff,
                            time_diff=time_diff,
                            time_range=time_range,
                            ngroup=ngroup,
                            shift=shift,
                            save=None,show_progress=False,
                        )
            finally:
                logs_text = log_buffer.getvalue()
                try:
                    os.remove(tmp_path)
                except OSError:
                    pass

            # ─────────────────────────
            # готовим CSV и превью
            # ─────────────────────────
            import pandas as pd  # локально, чтобы не ругался lint, если выше не нужен

            if not isinstance(df, pd.DataFrame):
                return JsonResponse(
                    {"error": "annot.run_lc/run_gc did not return a DataFrame"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            csv_buffer = io.StringIO()
            df.to_csv(csv_buffer, index=False)
            csv_text = csv_buffer.getvalue()

            preview_df = df.head(200).copy()
            if "candidates" in preview_df.columns:
                preview_df = preview_df.drop(columns=["candidates"])
            num_cols = preview_df.select_dtypes(include="number").columns
            preview_df[num_cols] = preview_df[num_cols].round(4)
            preview = preview_df.to_dict(orient="records")
            columns = list(preview_df.columns)
            row_count = int(df.shape[0])

            return JsonResponse(
                {
                    "columns": columns,
                    "preview": preview,
                    "rowCount": row_count,
                    "logs": logs_text,
                    "csv": csv_text,
                },
                status=status.HTTP_200_OK,
            )

        except ValueError as ve:
            return JsonResponse(
                {"error": str(ve)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as exc:
            return JsonResponse(
                {"error": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
