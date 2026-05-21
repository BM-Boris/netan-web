from __future__ import annotations

import io
import json
import os
import threading
import uuid
from typing import Dict, Optional

import networkx as nx
import numpy as np
import pandas as pd
from rest_framework import status
from rest_framework.views import APIView
from django.http import JsonResponse

import rodin  # internal library
import netan
import netan._build as netan_build
from netan.plotting import _compute_layout


TASKS: dict[str, Dict] = {}
TASKS_LOCK = threading.Lock()
JOBLIB_N_JOBS = min(4, os.cpu_count() or 1)
_ORIGINAL_NETAN_TQDM = netan_build.tqdm
_TQDM_PATCH_LOCK = threading.Lock()
_TQDM_PROGRESS = threading.local()


SINGLE_OMIC_GUARD = (
    "Only a single omics file uploaded. Use layerMode=\"stack\" (Entire) "
    "instead of multilayer."
)

def _load_rodins(files, types):
    """Return rodin objects for each uploaded omics file."""
    meta = None
    omics = []
    for f, t in zip(files, types):
        t = t.lower()
        if t == "meta":
            if meta is not None:
                raise ValueError("Only one meta file allowed.")
            meta = (f.getvalue(), getattr(f, "name", "meta.csv"))
        else:
            omics.append((f.getvalue(), getattr(f, "name", "file"), t))

    if not omics:
        raise ValueError("No omics files found.")

    rodins = []
    for raw, name, ftype in omics:
        fb = io.BytesIO(raw)
        fb.name = name
        mb = None
        if meta is not None:
            mb = io.BytesIO(meta[0])
            mb.name = meta[1]
        r = rodin.create(fb, mb, mode="mzrt" if ftype == "metabolomics" else "ann")
        r.uns = dict(r.uns or {}, file_name=name, file_type=ftype)
        rodins.append(r)

    return rodins

def _preproc(r, p: Dict):
    if not p:
        return r
    r.transform(
        thresh=float(p.get("threshold", 1)),
        norm=None if p.get("normalization", "none") == "none" else p["normalization"],
        scale=None if p.get("scaling", "none") == "none" else p["scaling"],
        log=p.get("logTransformation", "none") == "log2",
    )
    r.uns["log"] = p.get("logTransformation", "none") == "log2"
    return r


def _filter(r, f: Dict):
    if not f or f.get("method", "none").lower() == "none":
        return r

    meth = f["method"].lower()
    thr = float(f.get("Threshold", 1))
    meta = f.get("meta", "")
    if meth != "none" and meta=="":
        raise ValueError("Meta column is empty while filter selection is chosen.")

    mapping = {
        "ttest": ("p_value(tt)", False, "<", r.ttest),
        "one-way anova": ("p_value(owa)", False, "<", r.oneway_anova),
        "oneway_anova": ("p_value(owa)", False, "<", r.oneway_anova),
        "pls_da": ("vips", False, ">", r.pls_da),
        "sf_lg": ("p_value(lg)", False, "<", r.sf_lg),
        "sf_lr": ("p_value(lr)", False, "<", r.sf_lr),
        "rf_class": ("imp(rf)", False, ">", r.rf_class),
        "rf_regress": ("imp(rf)", False, ">", r.rf_regress),
    }

    if meth == "fold_change":
        if r.uns.get("log") is False:
            raise ValueError("Apply log2 transformation before fold‑change.")
        key, abs_flag, op, fn = "lfc", True, ">", r.fold_change
    else:
        if meth not in mapping:
            return r
        key, abs_flag, op, fn = mapping[meth]

    fn(meta)
    feats = r.features
    cols = [c for c in feats.columns if key in c.lower()]
    if not cols:
        return r

    mask = pd.Series(True, index=feats.index)
    for c in cols:
        v = feats[c].abs() if abs_flag else feats[c]
        mask &= (v < thr) if op == "<" else (v > thr)

    return r[feats[mask]]

def _json_clean(v):
    if isinstance(v, np.generic):
        return v.item()
    if isinstance(v, (set, tuple)):
        return [_json_clean(x) for x in v]
    if isinstance(v, list):
        return [_json_clean(x) for x in v]
    if isinstance(v, dict):
        return {str(k): _json_clean(val) for k, val in v.items()}
    try:
        if pd.isna(v):
            return None
    except (TypeError, ValueError):
        pass
    return v


def _records(df: pd.DataFrame) -> list[dict]:
    return [{k: _json_clean(v) for k, v in rec.items()} for rec in df.to_dict("records")]


def _display_label(value: object) -> str:
    raw = str(value)
    lower = raw.lower()
    canonical = {
        "entire": "Entire",
        "fused": "Fused",
        "consensus": "Consensus",
        "cross": "Cross",
    }
    if lower in canonical:
        return canonical[lower]
    return os.path.splitext(os.path.basename(raw))[0]


def _layer_label(value: object) -> str:
    return _display_label(value)


def _layer_tokens(value: object) -> set[str]:
    if isinstance(value, (set, list, tuple)):
        return {_layer_label(v) for v in value if str(v)}
    if value is None:
        return set()
    try:
        if pd.isna(value):
            return set()
    except (TypeError, ValueError):
        pass
    normalized = str(value).replace(",", "|")
    return {_layer_label(token) for token in normalized.split("|") if token}


def _safe_stat_key(label: str) -> str:
    return str(label).replace(" ", "_").replace(".", "_").replace(",", "_")


def _first_record(df: pd.DataFrame) -> dict:
    if not isinstance(df, pd.DataFrame) or df.empty:
        return {}
    return {k: _json_clean(v) for k, v in df.iloc[0].to_dict().items()}


def _sample_last_columns(columns, sample_ids) -> list[str]:
    samples = set(map(str, sample_ids))
    cols = list(columns)
    sample_cols = [col for col in cols if str(col) in samples]
    return [col for col in cols if col not in sample_cols] + sample_cols


def _data_sample_columns(rows: list[dict], sample_ids) -> list[str]:
    keys = {str(key) for row in rows for key in row}
    return [sid for sid in map(str, sample_ids) if sid in keys]


def _unique_layer_names(rodins: list[object]) -> list[str]:
    reserved = {"entire", "fused", "consensus", "cross"}
    seen: set[str] = set()
    names = []
    for i, r in enumerate(rodins, start=1):
        raw = str((getattr(r, "uns", {}) or {}).get("file_name") or f"L{i}")
        base = os.path.splitext(os.path.basename(raw))[0]
        name = base if base.lower() not in reserved else f"{base}_layer"
        candidate = name
        suffix = 2
        while candidate.lower() in seen:
            candidate = f"{name}_{suffix}"
            suffix += 1
        seen.add(candidate.lower())
        names.append(candidate)
    return names


def _layout_with_netan(nt, graph: str, layout: str) -> None:
    try:
        nt.plot(graph=graph, layout=layout, layout_seed=777)
        return
    except Exception:
        graph_name, G = nt._resolve_active_graph(graph)
        pos = _compute_layout(G, layout=layout, seed=777, weighted=True)
        for node, (x, y) in pos.items():
            G.nodes[node]["x"] = float(x)
            G.nodes[node]["y"] = float(y)
        nt._set_graph_entry(graph_name, graph=G)


def _network_stats_payload(nt, graph: str) -> dict:
    G = nt._resolve_active_graph(graph)[1]
    info = nt.info(verbose=False)
    params = _first_record(nt.params(graph=graph, verbose=False))
    rows = {str(row["graph"]): row for row in info.to_dict("records")}
    active = rows.get(graph, {})
    active_stats = nt._graph_stats(graph)
    nstats = {
        "numNodes": int(active.get("nodes", G.number_of_nodes())),
        "numEdges": int(active.get("edges", G.number_of_edges())),
        "nodesWithEdges": int(active.get("active_nodes", 0)),
        "numNodesWithEdges": int(active.get("active_nodes", 0)),
        "density_": float(active.get("density_active", 0.0)),
        "density": float(active.get("density_all", nx.density(G) if G.number_of_nodes() > 1 else 0.0)),
        "numComponents": nx.number_connected_components(G) if G.number_of_nodes() else 0,
        "numCommunities": int(active.get("communities", 0)),
        "numModules": int(active.get("modules", 0)),
        "meanDegree": float(active_stats.get("meanDegree", 0.0)),
        "meanDegreeActive": float(active_stats.get("meanDegreeActive", 0.0)),
        "medianDegreeActive": float(active_stats.get("medianDegreeActive", 0.0)),
        "maxDegreeActive": float(active_stats.get("maxDegreeActive", 0.0)),
        "thresholdRaw": params.get("thr_raw", params.get("thr_raw_base")),
        "thresholdNorm": params.get("thr_norm", params.get("thr_norm_base")),
        "autoTarget": params.get("auto", params.get("auto_base")),
        "kFinal": params.get("k", params.get("k_base")),
    }

    for row in info.to_dict("records"):
        graph_name = str(row["graph"])
        layer = _display_label(graph_name)
        safe = _safe_stat_key(layer)
        gstats = nt._graph_stats(graph_name)
        gparams = _first_record(nt.params(graph=graph_name, verbose=False))
        nstats[f"nodes_{safe}"] = int(row.get("nodes", 0))
        nstats[f"edges_{safe}"] = int(row.get("edges", 0))
        nstats[f"density_{safe}"] = float(row.get("density_all", 0.0))
        nstats[f"modules_{safe}"] = int(row.get("modules", 0))
        nstats[f"communities_{safe}"] = int(row.get("communities", 0))
        nstats[f"meanDegree_{safe}"] = float(gstats.get("meanDegree", 0.0))
        nstats[f"meanDegreeActive_{safe}"] = float(gstats.get("meanDegreeActive", 0.0))
        nstats[f"thrRaw_{safe}"] = gparams.get("thr_raw", gparams.get("thr_raw_base"))
        nstats[f"thrNorm_{safe}"] = gparams.get("thr_norm", gparams.get("thr_norm_base"))
        nstats[f"auto_{safe}"] = gparams.get("auto", gparams.get("auto_base"))
        nstats[f"k_{safe}"] = gparams.get("k", gparams.get("k_base"))
    return nstats


def _graph_names_for_payload(nt, active_graph: str, layer_mode: str) -> list[str]:
    if layer_mode != "multilayer":
        return [active_graph]

    names = []
    for name in ("entire", "fused", "consensus", "cross", *map(str, nt.names)):
        if name in names:
            continue
        if nt._graph_obj(name) is not None:
            names.append(name)
    return names or [active_graph]


def _serialize_netan(nt, graph: str, node_mode: str, layer_mode: str, rodin_count: int):
    node_df = nt.nodes(graph=graph).copy()
    node_df["display_id"] = node_df["id"].astype(str).map(
        lambda x: x.split("__", 1)[1] if node_mode == "features" and "__" in x else x
    )
    nodes_json = _records(node_df)

    edges_json = []
    for graph_name in _graph_names_for_payload(nt, graph, layer_mode):
        graph_label = _display_label(graph_name)
        edge_df = nt.edges(graph=graph_name).copy()
        for rec in edge_df.to_dict("records"):
            support_layers = sorted(_layer_tokens(rec.get("layers") or rec.get("layer")))
            layers = support_layers or [graph_label]
            edge = {
                "source": str(rec["source"]),
                "target": str(rec["target"]),
                "weight": float(rec.get("weight", 1) or 1),
                "graph": graph_label,
                "support_layers": support_layers,
                "layer": graph_label,
                "layers": layers,
                "plot_layers": [graph_label],
            }
            if node_mode == "features":
                edge["source_compound"] = _json_clean(rec.get("source_compound")) or ""
                edge["target_compound"] = _json_clean(rec.get("target_compound")) or ""
            edges_json.append(edge)

    nstats = _network_stats_payload(nt, graph)
    nstats["layerMode"] = layer_mode
    return nodes_json, edges_json, nstats


def _data_table_from_rodins(nt) -> list[dict]:
    dfs = []
    features = nt.features()
    for name, r in zip(map(str, nt.names), nt.rodins):
        x = getattr(r, "X", None)
        if not isinstance(x, pd.DataFrame) or x.empty:
            continue
        meta = features[features["layer"].astype(str) == name].copy()
        if meta.empty:
            meta = pd.DataFrame({"layer": name, "feature_id": x.index.astype(str)})
        meta = meta.drop(columns=["feature"], errors="ignore")
        meta["feature_id"] = meta["feature_id"].astype(str)
        values = x.copy()
        values.index = values.index.astype(str)
        values = values.reset_index().rename(columns={"index": "feature_id"})
        df = (
            meta.merge(values, on="feature_id", how="left")
            .assign(file=name)
            .rename(columns={"feature_id": "feature"})
        )
        dfs.append(df)
    if not dfs:
        return []

    out = pd.concat(dfs, ignore_index=True)
    return _records(out[_sample_last_columns(out.columns, nt.sample_ids)])


def _is_off(value: object) -> bool:
    return value in (None, "", False) or str(value).strip().lower() in {"off", "none", "null"}


def _optional_float(value: object) -> Optional[float]:
    if _is_off(value):
        return None
    return float(value)


def _auto_target_fraction(value: object) -> float:
    if _is_off(value):
        return 0.95
    target = float(value)
    return target / 100.0 if target > 1 else target


def _knn_value(value: object):
    if _is_off(value):
        return None
    if str(value).strip().lower() == "auto":
        return "auto"
    return int(value)


def _sparsity_kwargs(net_p: dict) -> dict:
    thr_raw = _optional_float(net_p.get("thrRaw", net_p.get("thr_raw")))
    thr_norm = _optional_float(net_p.get("thrNorm", net_p.get("thr_norm")))
    auto_target = _auto_target_fraction(net_p.get("autoTarget", net_p.get("auto_target", 95)))

    if thr_raw is not None:
        thr_norm = None
    elif thr_norm is not None:
        thr_raw = None
    active_mode = "thrRaw" if thr_raw is not None else "thrNorm" if thr_norm is not None else "autoTarget"

    if thr_norm is not None and not 0 <= thr_norm <= 1:
        raise ValueError("Normalized threshold must be within [0, 1].")
    if not 0 < auto_target <= 1:
        raise ValueError("Auto target must be within (0, 100].")

    return {
        "thr_raw": thr_raw,
        "thr_norm": thr_norm,
        "auto_target": auto_target,
        "k": _knn_value(net_p.get("knn", "auto")),
        "mode": active_mode,
    }


class _ProgressTqdm:
    """tqdm adapter for netan._build that forwards progress into TASKS."""

    def __init__(self, *args, total=None, **kwargs):
        cfg = getattr(_TQDM_PROGRESS, "cfg", None)
        self._delegate = None
        if cfg is None:
            self._delegate = _ORIGINAL_NETAN_TQDM(*args, total=total, **kwargs)
            return

        self.total = float(total or kwargs.get("total") or 1)
        self.n = 0
        self._cfg = cfg
        index = cfg["next_bar"]
        cfg["next_bar"] += 1
        bar_count = max(int(cfg["bar_count"]), 1)
        span = (cfg["end"] - cfg["start"]) / bar_count
        self._start = cfg["start"] + index * span
        self._end = min(self._start + span, cfg["end"])
        cfg["set_progress"](self._start)

    def __enter__(self):
        if self._delegate is not None:
            return self._delegate.__enter__()
        return self

    def __exit__(self, exc_type, exc, tb):
        if self._delegate is not None:
            return self._delegate.__exit__(exc_type, exc, tb)
        self.close()
        return False

    def _emit(self):
        if self._delegate is not None:
            return
        if self._cfg["cancelled"]():
            raise RuntimeError("cancelled by user")
        frac = min(max(float(self.n) / max(self.total, 1.0), 0.0), 1.0)
        self._cfg["set_progress"](self._start + (self._end - self._start) * frac)

    def update(self, n=1):
        if self._delegate is not None:
            return self._delegate.update(n)
        self.n += n
        self._emit()

    def refresh(self, *args, **kwargs):
        if self._delegate is not None:
            return self._delegate.refresh(*args, **kwargs)
        self._emit()

    def close(self):
        if self._delegate is not None:
            return self._delegate.close()
        self.n = max(self.n, self.total)
        self._emit()


def _expected_tqdm_bars(method: str, node_mode: str, layer_mode: str, rodin_count: int) -> int:
    if method not in {"clr", "rf", "glasso"}:
        return 0
    if layer_mode != "multilayer":
        return 1
    if node_mode == "features":
        return rodin_count + (rodin_count * (rodin_count - 1)) // 2
    return rodin_count


def _build_with_tqdm_progress(
    nt,
    *,
    set_progress,
    cancelled,
    progress_start: float,
    progress_end: float,
    bar_count: int,
    **build_kwargs,
):
    if bar_count <= 0:
        return nt.build(**build_kwargs)

    with _TQDM_PATCH_LOCK:
        netan_build.tqdm = _ProgressTqdm
        _TQDM_PROGRESS.cfg = {
            "set_progress": set_progress,
            "cancelled": cancelled,
            "start": float(progress_start),
            "end": float(progress_end),
            "bar_count": int(bar_count),
            "next_bar": 0,
        }
        try:
            return nt.build(**build_kwargs)
        finally:
            _TQDM_PROGRESS.cfg = None
            netan_build.tqdm = _ORIGINAL_NETAN_TQDM


def _network_worker(task_id: str,
                    files_bin: list[tuple[bytes, str]],
                    types: list[str],
                    params: dict):
    def cancelled():
        with TASKS_LOCK:
            return TASKS.get(task_id, {}).get("cancelled", False)
            
    def set_progress(val: float):
        with TASKS_LOCK:
            if task_id in TASKS:
                TASKS[task_id]["progress"] = round(min(max(val, 0), 100), 1)

    try:
        set_progress(2)

        files = []
        for raw, name in files_bin:
            buf = io.BytesIO(raw)
            buf.name = name
            files.append(buf)

        sync_all = str(params.get("syncAll", True)).lower() == "true"
        p_data   = params.get("paramData", {})
        net_p    = p_data.get("networkParams", {})
        pre_f    = p_data.get("preFilterParams", {})

        rodins = _load_rodins(files, types)
        set_progress(10)

        if (len(rodins) == 1
                and net_p.get("layerMode", "stack").lower() == "multilayer"):
            raise ValueError(SINGLE_OMIC_GUARD)

        fstats = [{"features_original": len(r.features)} for r in rodins]

        def _apply(i, r, pre, filt):
            if pre:
                before = len(r.features)
                r = _preproc(r, pre)
                fstats[i]["features_after_preproc"]   = len(r.features)
                fstats[i]["features_removed_preproc"] = before - len(r.features)
            else:
                fstats[i].update(features_after_preproc=len(r.features),
                                 features_removed_preproc=0)

            if filt:
                before = len(r.features)
                r = _filter(r, filt)
                fstats[i]["features_before_filter"]   = before
                fstats[i]["features_after_filter"]    = len(r.features)
                fstats[i]["features_removed_filter"]  = before - len(r.features)
            else:
                fstats[i].update(features_before_filter=len(r.features),
                                 features_after_filter=len(r.features),
                                 features_removed_filter=0)
            return r

        if sync_all:
            d    = (pre_f[0] if isinstance(pre_f, list) and pre_f else pre_f).get("data", {})
            pre  = {k: d[k] for k in ("threshold","normalization",
                                      "logTransformation","scaling") if k in d}
            filt = {k: d[k] for k in ("method","meta","Threshold") if k in d}
            rodins = [_apply(i, r, pre, filt) for i, r in enumerate(rodins)]
        else:
            tmp = []
            for i, r in enumerate(rodins):
                d    = (pre_f[i] if i < len(pre_f) else {}).get("data", {})
                pre  = {k: d[k] for k in ("threshold","normalization",
                                          "logTransformation","scaling") if k in d}
                filt = {k: d[k] for k in ("method","meta","Threshold") if k in d}
                tmp.append(_apply(i, r, pre, filt))
            rodins = tmp

        for i, r in enumerate(rodins):
            fstats[i]["X_shape"] = list(r.X.shape)

        if sum(len(r.features) for r in rodins) == 0:
            raise ValueError("All features were filtered out.")

        set_progress(20)

        mth = str(net_p.get("networkMethod", "spearman")).lower()
        lmode = str(net_p.get("layerMode", "stack")).lower()
        combine = str(net_p.get("combineSamples", "mean")).lower()
        nmode = str(net_p.get("nodeMode", "samples")).lower()
        layout = net_p.get("layout", "force-directed")
        sparsity = _sparsity_kwargs(net_p)

        if nmode not in ("samples", "features"):
            raise ValueError("nodeMode must be 'samples' or 'features'.")
        if cancelled():
            raise RuntimeError("cancelled by user")

        names = _unique_layer_names(rodins)
        nt = netan.create(rodins, names=names)

        method_kwargs = {}
        if mth == "clr":
            method_kwargs["n_neighbors"] = int(net_p.get("n_neighbors", 2))
        elif mth == "rf":
            method_kwargs["n_estimators"] = int(net_p.get("n_estimators", 80))
            max_depth = net_p.get("max_depth", None)
            method_kwargs["max_depth"] = None if max_depth in (None, "", "0", 0) else int(max_depth)
        elif mth == "glasso":
            method_kwargs["alpha"] = float(net_p.get("glassoAlpha", 0.05))
            method_kwargs["max_iter"] = int(net_p.get("glassoMaxIter", 200))

        graph_choice = "entire"
        set_progress(30)
        build_sparsity = {k: sparsity[k] for k in ("thr_raw", "thr_norm", "auto_target", "k")}
        _build_with_tqdm_progress(
            nt,
            set_progress=set_progress,
            cancelled=cancelled,
            progress_start=30,
            progress_end=85,
            bar_count=_expected_tqdm_bars(mth, nmode, lmode, len(rodins)),
            method=mth,
            node_mode=nmode,
            layer_mode=lmode,
            combine=combine,
            graph=graph_choice,
            n_jobs=JOBLIB_N_JOBS,
            verbose=False,
            **build_sparsity,
            **method_kwargs,
        )
        set_progress(85)

        if cancelled():
            raise RuntimeError("cancelled by user")
        _layout_with_netan(nt, graph_choice, layout)
        set_progress(93)

        nodes_json, edges_json, nstats = _serialize_netan(
            nt,
            graph_choice,
            nmode,
            lmode,
            len(rodins),
        )

        if not edges_json:
            raise ValueError("No edges. Lower the threshold or increase auto target.")

        data_table = _data_table_from_rodins(nt)
        data_sample_columns = _data_sample_columns(data_table, nt.sample_ids)

        payload = {
            "networkMethod": mth,
            "thrRaw": sparsity["thr_raw"],
            "thrNorm": sparsity["thr_norm"],
            "autoTarget": sparsity["auto_target"] if sparsity["mode"] == "autoTarget" else None,
            "knn": sparsity["k"],
            "layout":       layout,
            "layerMode":    lmode,
            "nodes":        nodes_json,
            "edges":        edges_json,
            "stats":        {"fileStats": fstats, "networkStats": nstats},
            "dataTable":    data_table,
            "dataSampleColumns": data_sample_columns,
        }

        set_progress(100)
        with TASKS_LOCK:
            TASKS[task_id].update(status="done", result=payload)

    except Exception as exc:   # noqa: BLE001
        with TASKS_LOCK:
            TASKS[task_id].update(status="error", progress=100, error=str(exc))


class BuildNetworkView(APIView):
    def post(self, request, format=None):
        if request.GET.get("action") == "cancel":
            return self.patch(request, format=format)
        try:
            files = request.FILES.getlist("data_files")
            types = request.data.getlist("file_types")
            if not files or len(files) != len(types):
                raise ValueError("Upload files + file_types mismatch.")

            params = json.loads(request.data.get("parameters", "{}"))

            files_bin = [(f.read(), getattr(f, "name", f"file{i}"))
                         for i, f in enumerate(files)]

            task_id = uuid.uuid4().hex
            with TASKS_LOCK:
                TASKS[task_id] = {"status": "running", "progress": 0,"cancelled": False}

            threading.Thread(
                target=_network_worker,
                args=(task_id, files_bin, types, params),
                daemon=True,
            ).start()

            return JsonResponse({"task_id": task_id}, status=202)

        except ValueError as ve:
            return JsonResponse({"error": str(ve)},
                                status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:  # noqa: BLE001
            return JsonResponse({"error": str(exc)},
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get(self, request, format=None):
        task_id = request.GET.get("task_id")
        if not task_id:
            return JsonResponse({"error": "Missing task_id parameter."},
                                status=status.HTTP_400_BAD_REQUEST)

        with TASKS_LOCK:
            info = TASKS.get(task_id)

        if info is None:
            return JsonResponse({"error": "task_id not found."},
                                status=status.HTTP_404_NOT_FOUND)

        resp = {"status": info["status"], "progress": info["progress"]}
        if info["status"] == "done":
            resp["result"] = info["result"]
        elif info["status"] == "error":
            resp["error"] = info["error"]
        return JsonResponse(resp, status=200)
        
    def patch(self, request, format=None):
        task_id = request.GET.get("task_id")
        if request.GET.get("action") != "cancel" or not task_id:
            return JsonResponse(
                {"error": "Need task_id & action=cancel"},
                status=status.HTTP_400_BAD_REQUEST
            )

        with TASKS_LOCK:
            info = TASKS.get(task_id)
            if info is None:
                return JsonResponse(
                    {"error": "task_id not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            info["cancelled"] = True
            if info["status"] == "running":
                info["status"] = "cancelling"

        return JsonResponse({"status": "cancelling"}, status=202)
