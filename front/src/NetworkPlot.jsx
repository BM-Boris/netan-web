/* NetworkPlot.jsx – single-layer selector + node click interactions
  
=================================================================== */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import Plot from 'react-plotly.js';
import {
  Card, Typography, Box, FormControl, InputLabel, Select, MenuItem,
  Switch, FormControlLabel, IconButton, Dialog, Slider
} from '@mui/material';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { useTheme } from '@mui/material/styles';

/* ───────── helpers ───────── */
const NUM_UNIQUE_THRESHOLD = 6;
const isNum = v => v !== null && v !== '' && !Number.isNaN(+v);
const colType = (col, data) => {
  if (!col) return 'none';
  const vals = data.map(d => d[col]).filter(v => v !== undefined && v !== null);
  if (!vals.length) return 'none';
  return vals.every(isNum) && new Set(vals.map(Number)).size >= NUM_UNIQUE_THRESHOLD
    ? 'continuous'
    : 'categorical';
};

const symbols = ['circle','square','diamond','triangle-up','triangle-down','cross','x','star'];
const safeId  = s => String(s).replace(/[^A-Za-z0-9_-]/g, '_');

/* ───────── control panel ───────── */
const Panel = ({
  columns, colorBy, setColorBy,
  shapeBy, setShapeBy,
  selLayer, setSelLayer, layerNames,
  hideIso, setHideIso,
  minW, maxW, stepW, range, setRange
}) => (
  <Box display="flex" alignItems="center" gap={3} mb={2} flexWrap="wrap">
    {/* Color */}
    <FormControl size="small">
      <InputLabel>Color by</InputLabel>
      <Select
        value={columns.includes(colorBy) ? colorBy : ''}
        onChange={e => setColorBy(e.target.value)}
        label="Color by"
        sx={{ width: { xs: 105, sm: 150 } }}
      >
        <MenuItem value="">(None)</MenuItem>
        {columns.map(c => (
          <MenuItem key={c} value={c}>{c}</MenuItem>
        ))}
      </Select>
    </FormControl>

    {/* Shape */}
    <FormControl size="small">
      <InputLabel>Shape by</InputLabel>
      <Select
        value={columns.includes(shapeBy) ? shapeBy : ''}
        onChange={e => setShapeBy(e.target.value)}
        label="Shape by"
        sx={{ width: { xs: 110, sm: 150 } }}
      >
        <MenuItem value="">(None)</MenuItem>
        {columns.map(c => (
          <MenuItem key={c} value={c}>{c}</MenuItem>
        ))}
      </Select>
    </FormControl>

    {/* Layer */}
    <FormControl size="small" disabled={layerNames.length === 0}>
      <InputLabel>Layer</InputLabel>
      <Select
        value={layerNames.includes(selLayer) ? selLayer : (layerNames[0] || '')}
        onChange={e => setSelLayer(e.target.value)}
        label="Layer"
        sx={{ width: { xs: 105, sm: 150 } }}
      >
        {layerNames.map(l => (
          <MenuItem key={l} value={l}>{l}</MenuItem>
        ))}
      </Select>
    </FormControl>

    {/* Hide isolated */}
    <FormControlLabel
      control={
        <Switch
          checked={hideIso}
          onChange={e => setHideIso(e.target.checked)}
          color="secondary"
          sx={{ mb: 0.4 }}
        />
      }
      label="Hide isolated"
    />

    {/* Weight slider */}
    <Box sx={{ width: { xs: 190, sm: 220 }, px: 1 }}>
      <Typography variant="body2" sx={{ mb: 0.3 }}>Edge weight range</Typography>
      <Slider
        value={range}
        onChange={(_, v) => setRange(v)}
        valueLabelDisplay="auto"
        min={minW}
        max={maxW}
        step={stepW}
        marks
        color="secondary"
        sx={{ mt: -0.8 }}
      />
      <Box display="flex" justifyContent="space-between" sx={{ mt: -1 }}>
        <Typography variant="caption">{minW.toFixed(3)}</Typography>
        <Typography variant="caption">{maxW.toFixed(3)}</Typography>
      </Box>
    </Box>
  </Box>
);

/* ───────── main component ───────── */
const NetworkPlot = ({ nodes, edges }) => {
  const theme = useTheme();
  const mode = theme.palette.mode;

  /*─────────────────────────────────────────────
    Цветовые палитры для нод
  ─────────────────────────────────────────────*/
  const lightPalette = [
    '#c0392b', '#2980b9', '#27ae60', '#e67e22', '#8e44ad', '#8d6e63',
    '#d81b60', '#7f8c8d', '#00897b', '#f4c20d', '#00acc1', '#ad1457',
    '#afc52f', '#556b2f', '#6d214f', '#303f9f', '#bdc3c7', '#9b59b6',
    '#3f51b5', '#ff7043', '#c0b283', '#40e0d0',
  ];

  const darkPalette = [
    '#ff4d6d', '#2ecfff', '#13ffae', '#ff9e2c', '#c792ff', '#b87333',
    '#ff6ec7', '#b0bec5', '#1cf0c8', '#ffd95c', '#46cfff', '#ff4fff',
    '#7dff3b', '#9ccc65', '#ff5e99', '#5c6cff', '#9ea7ff', '#b388ff',
    '#7ea2ff', '#ff8a65', '#e7d691', '#63ffda',
  ];

  const palette = theme.palette.mode === 'dark' ? darkPalette : lightPalette;

  /* dynamic column list */
  const cols = Object.keys(nodes[0] || {}).filter(
    k => !['id', 'x', 'y', 'compound', 'display_id'].includes(k)
  );

  /* state: color/shape/layer/edge range */
  const [colorBy, setColorBy] = useState('');
  const [shapeBy, setShapeBy] = useState('');
  const [hideIso, setHideIso] = useState(false);
  const [full, setFull] = useState(false);
  const toggleFull = () => setFull(v => !v);

  /* pinned labels + highlight centers (как в Python) */
  const [pinnedIds, setPinnedIds] = useState([]);           // ['node1', 'node2', ...]
  const [highlightCenters, setHighlightCenters] = useState([]); // те же id

  /* zoom / reset tracking */
  const axisRef = useRef(null);      // для памяти зума
  const zoomRef = useRef(false);     // был ли зум/пан

  /* reset color/shape when columns change */
  useEffect(() => {
    if (!cols.includes(colorBy)) setColorBy('');
    if (!cols.includes(shapeBy)) setShapeBy('');
  }, [cols]); // eslint-disable-line

  /* layer names */
  const layerNames = useMemo(
    () => [...new Set(edges.flatMap(e => e.layers || [e.layer]))].sort(),
    [edges]
  );
  const [selLayer, setSelLayer] = useState('');
  useEffect(() => {
    setSelLayer(p => (layerNames.includes(p) ? p : (layerNames[0] || '')));
  }, [layerNames]);

  /* hidden legend items */
  const [hidden, setHidden] = useState(new Set());
  useEffect(() => setHidden(new Set()), [colorBy, shapeBy]);

  /* weight slider bounds */
  const wArr = useMemo(() => edges.map(e => Number(e.weight) || 0), [edges]);
  const minW = useMemo(
    () => (wArr.length ? Math.floor(Math.min(...wArr) * 1000) / 1000 : 0),
    [wArr]
  );
  const maxW = useMemo(
    () => (wArr.length ? Math.ceil(Math.max(...wArr) * 1000) / 1000 : 1),
    [wArr]
  );
  const stepW = useMemo(
    () => +((maxW - minW) / 19).toFixed(3) || 0.001,
    [minW, maxW]
  );
  const [range, setRange] = useState([minW, maxW]);
  useEffect(() => setRange([minW, maxW]), [minW, maxW]);

  /* grouping key */
  const gKey = useCallback(
    n => {
      const c = colorBy ? n[colorBy] : 'all';
      const s = shapeBy ? n[shapeBy] : 'all';
      if (colorBy && shapeBy) return `${c}||${s}`;
      if (colorBy) return `${c}`;
      if (shapeBy) return `${s}`;
      return 'Nodes';
    },
    [colorBy, shapeBy]
  );

  /* maps */
  const maps = useMemo(() => {
    const keys  = [...new Set(nodes.map(gKey))].sort();
    const cVals = [...new Set(nodes.map(n => (colorBy ? n[colorBy] : 'all')))].sort();
    const sVals = [...new Set(nodes.map(n => (shapeBy ? n[shapeBy] : 'all')))].sort();
    const cMap  = {};
    const sMap  = {};
    cVals.forEach((v, i) => {
      cMap[v] = palette[i % palette.length];
    });
    sVals.forEach((v, i) => {
      sMap[v] = symbols[i % symbols.length];
    });
    return { keys, cMap, sMap, cType: colType(colorBy, nodes) };
  }, [nodes, colorBy, shapeBy, gKey, palette]);

  /* ───────── основная сборка data + annotations ───────── */
  const { data, annotations } = useMemo(() => {
    const isDark = mode === 'dark';

    // базовые цвета для рёбер/хайлайта в зависимости от темы
    const baseEdgeColor = isDark
      ? '#9c9ea7'  
      : '#717171';       
  
    const highlightEdgeColor = isDark
      ? '#dfdfe2'   
      : '#2A3439';       
  
    const highlightNodeRingColor = isDark
      ? '#dfdfe2'  
      : '#2A3439';
  
    const nodeBorderColor = isDark
      ? 'rgba(0,0,0,0.7)'          
      : '#333';
  
    /* filter edges by layer + weight */
    const eFilt = edges.filter(e => {
      const list = e.layers || [e.layer];
      return (!selLayer || list.includes(selLayer)) &&
             e.weight >= range[0] && e.weight <= range[1];
    });

    /* nodes/edges visibility */
    let vNodes = nodes.filter(n => !hidden.has(gKey(n)));
    const idSet = new Set(vNodes.map(n => String(n.id)));
    let vEdges = eFilt.filter(({ source, target }) => idSet.has(String(source)) && idSet.has(String(target)));

    if (hideIso) {
      const conn = new Set();
      vEdges.forEach(e => {
        conn.add(String(e.source));
        conn.add(String(e.target));
      });
      vNodes = vNodes.filter(n => conn.has(String(n.id)));
      const id2 = new Set(vNodes.map(n => String(n.id)));
      vEdges = vEdges.filter(({ source, target }) => id2.has(String(source)) && id2.has(String(target)));
    }

    const pos = Object.fromEntries(
      vNodes.map(n => [String(n.id), { x: n.x, y: n.y }])
    );
    const visibleIds = new Set(vNodes.map(n => String(n.id)));

    /* base edges */
    const ex = [];
    const ey = [];
    vEdges.forEach(({ source, target }) => {
      const s = pos[String(source)];
      const t = pos[String(target)];
      if (!s || !t) return;
      ex.push(s.x, t.x, null);
      ey.push(s.y, t.y, null);
    });

    /* highlight edges + nodes (по centers) */
    const centerSet = new Set(
      highlightCenters.map(String).filter(id => visibleIds.has(id))
    );
    const hEx = [];
    const hEy = [];
    const neigh = new Set(centerSet);

    if (centerSet.size > 0) {
      vEdges.forEach(({ source, target }) => {
        const sId = String(source);
        const tId = String(target);
        if (!visibleIds.has(sId) || !visibleIds.has(tId)) return;

        if (centerSet.has(sId) || centerSet.has(tId)) {
          neigh.add(sId);
          neigh.add(tId);
          const ps = pos[sId];
          const pt = pos[tId];
          if (ps && pt) {
            hEx.push(ps.x, pt.x, null);
            hEy.push(ps.y, pt.y, null);
          }
        }
      });
    }

    const hNx = [];
    const hNy = [];
    if (neigh.size > 0) {
      neigh.forEach(id => {
        if (!visibleIds.has(id)) return;
        const p = pos[id];
        if (p) {
          hNx.push(p.x);
          hNy.push(p.y);
        }
      });
    }

    const traces = [];

    // базовые ребра
    traces.push({
      uid: 'edges',
      x: ex,
      y: ey,
      mode: 'lines',
      hoverinfo: 'none',
      showlegend: false,
      line: { color: baseEdgeColor, width: 1.2 },
      name: 'edges',
    });

    // хайлайтнутые ребра
    traces.push({
      uid: 'edges_highlight',
      x: hEx,
      y: hEy,
      mode: 'lines',
      hoverinfo: 'none',
      showlegend: false,
      line: { color: highlightEdgeColor, width: 2.2 },
      name: 'highlight_edges',
    });

    /* узлы */
    if (maps.cType === 'continuous' && colorBy) {
      const byShape = {};
      vNodes.forEach(n => {
        const sv = shapeBy ? n[shapeBy] : 'all';
        if (!byShape[sv]) {
          byShape[sv] = { x: [], y: [], c: [], t: [], ids: [] };
        }
        byShape[sv].x.push(n.x);
        byShape[sv].y.push(n.y);
        byShape[sv].c.push(+n[colorBy]);
        byShape[sv].t.push(`ID: ${n.display_id}<br>${colorBy}: ${n[colorBy]}`);
        byShape[sv].ids.push(String(n.id));
      });

      Object.entries(byShape).forEach(([sv, g], i) => {
        const safe = safeId(sv);
        traces.push({
          uid: `nodes_${safe}`,
          x: g.x,
          y: g.y,
          mode: 'markers',
          hoverinfo: 'text',
          text: g.t,
          showlegend: false,
          customdata: g.ids,
          marker: {
            color: g.c,
            colorscale: 'Viridis',
            showscale: i === 0,
            colorbar: i === 0 ? { title: colorBy } : undefined,
            symbol: shapeBy ? maps.sMap[sv] : 'circle',
            size: 10,
            line: { width: 1, color: nodeBorderColor },
          },
        });
      });
    } else {
      const groups = {};
      vNodes.forEach(n => {
        const k = gKey(n);
        if (!groups[k]) {
          groups[k] = {
            x: [],
            y: [],
            t: [],
            cVal: colorBy ? n[colorBy] : 'all',
            sVal: shapeBy ? n[shapeBy] : 'all',
            ids: [],
          };
        }
        groups[k].x.push(n.x);
        groups[k].y.push(n.y);
        let t = `ID: ${n.display_id}`;
        if (n.compound) t += `<br>Compound: ${n.compound}`;
        if (colorBy) t += `<br>${colorBy}: ${groups[k].cVal}`;
        if (shapeBy) t += `<br>${shapeBy}: ${groups[k].sVal}`;
        groups[k].t.push(t);
        groups[k].ids.push(String(n.id));
      });

      maps.keys.forEach(k => {
        const g = groups[k] || {
          x: [null],
          y: [null],
          t: [],
          cVal: null,
          sVal: null,
          ids: [],
        };
        const safe = safeId(k);
        traces.push({
          uid: `nodes_${safe}`,
          x: g.x,
          y: g.y,
          mode: 'markers',
          name: k,
          legendgroup: k,
          hoverinfo: 'text',
          text: g.t,
          visible: hidden.has(k) ? 'legendonly' : true,
          customdata: g.ids,
          marker: {
            color: g.cVal != null ? maps.cMap[g.cVal] : '#000',
            symbol: g.sVal != null ? maps.sMap[g.sVal] : 'circle',
            size: 10,
            line: { width: 1, color: nodeBorderColor },
          },
        });
      });
    }

    // overlay для выделенных нод (кольца поверх нод)
    traces.push({
      uid: 'nodes_highlight',
      x: hNx,
      y: hNy,
      mode: 'markers',
      hoverinfo: 'none',
      showlegend: false,
      marker: {
        size: 12,
        symbol: 'circle-open',
        color: highlightNodeRingColor,
        line: { width: 3 },
      },
      name: 'highlight_nodes',
    });

    // annotations для pinned
    const pinnedSet = new Set(pinnedIds.map(String));
    const idToNode = new Map(
      vNodes.map(n => [String(n.id), n])
    );
    const anns = [];

    pinnedSet.forEach(id => {
      const n = idToNode.get(id);
      if (!n) return;
      let labelText =
        (typeof n.compound === 'string' && n.compound.trim()) ||
        n.display_id ||
        n.id;
      labelText = String(labelText);

      anns.push({
        x: n.x,
        y: n.y,
        text: `<b>${labelText}</b>`,
        showarrow: false,
        xanchor: 'center',
        yanchor: 'bottom',
        yshift: 8,
        font: { size: 12 },
      });
    });

    return { data: traces, annotations: anns };
  }, [
    nodes,
    edges,
    selLayer,
    range,
    hidden,
    hideIso,
    colorBy,
    shapeBy,
    maps,
    gKey,
    pinnedIds,
    highlightCenters,
    mode,
  ]);

  /* legend interaction */
  const onLegendClick = useCallback(ev => {
    const g = ev?.data?.[ev.curveNumber]?.name;
    if (!g) return false;
    setHidden(prev => {
      const n = new Set(prev);
      if (n.has(g)) n.delete(g);
      else n.add(g);
      return n;
    });
    return false; // отменить стандартное поведение Plotly
  }, []);

  const onLegendDouble = useCallback(() => {
    setHidden(new Set());
    return false;
  }, []);

  /* очистка всех selection (как _full_reset в Python) */
  const clearSelections = useCallback(() => {
    setPinnedIds([]);
    setHighlightCenters([]);
  }, []);

  /* relayout – обработка зума и Reset axes */
  const onRelayout = useCallback(
    ev => {
      if ('xaxis.range[0]' in ev) {
        // зум / пан
        axisRef.current = {
          x: [ev['xaxis.range[0]'], ev['xaxis.range[1]']],
          y: [ev['yaxis.range[0]'], ev['yaxis.range[1]']],
        };
        zoomRef.current = true;
      } else if ('xaxis.autorange' in ev || 'yaxis.autorange' in ev) {
        // Reset axes / двойной клик по пустому фону
        axisRef.current = null;
        if (zoomRef.current) {
          // первый Reset после зума — только снять зум
          zoomRef.current = false;
        } else {
          // не было зума → глобальный reset selection
          clearSelections();
        }
      }
    },
    [clearSelections]
  );

  /* click по точке: pin label → toggle highlight center */
  const onClick = useCallback(ev => {
    if (!ev || !ev.points || !ev.points.length) return;
    const pt = ev.points[0];
    const cd = pt.data?.customdata;
    if (!cd) return;
    const idx = pt.pointIndex;
    const nid = String(cd[idx]);

    setPinnedIds(prev => {
      const already = prev.includes(nid);
      if (!already) {
        // первый клик по ноде → пинним подпись
        return [...prev, nid];
      }

      // нода уже pinned → переключаем её как highlight center
      setHighlightCenters(prevCenters => {
        const exists = prevCenters.includes(nid);
        if (exists) {
          return prevCenters.filter(id => id !== nid);
        }
        return [...prevCenters, nid];
      });

      // pinned состав не меняем
      return prev;
    });
  }, []);

  const legendTop = shapeBy && maps.cType === 'continuous';
  const legendCfg = legendTop
    ? {
        orientation: 'h',
        x: 0.5,
        y: 1.05,
        xanchor: 'center',
        yanchor: 'bottom',
        itemwidth: 30,
        itemsizing: 'trace',
        tracegroupgap: 12,
      }
    : {
        orientation: 'v',
        x: 1.02,
        y: 1,
        xanchor: 'left',
        tracegroupgap: 8,
      };

  /* ───────── Plotly-блок ───────── */
  const PlotBox = ({ full }) => {
    const themeInner = useTheme();

    const layout = {
      title: 'Network Plot',
      hovermode: 'closest',
      showlegend: true,
      legend: {
        ...legendCfg,
        font: { color: themeInner.palette.text.primary },
      },
      font: { color: themeInner.palette.text.primary },
      margin: full
        ? { l: 20, r: 20, t: 40, b: 20 }
        : { l: 20, r: 60, t: legendTop ? 70 : 40, b: 20 },
      paper_bgcolor: themeInner.palette.card.plot,
      plot_bgcolor:
        themeInner.palette.mode === 'dark'
          ? themeInner.palette.card.plot
          : themeInner.palette.background.paper,
      xaxis: {
        visible: false,
        ...(axisRef.current
          ? { range: axisRef.current.x, autorange: false }
          : {}),
      },
      yaxis: {
        visible: false,
        ...(axisRef.current
          ? { range: axisRef.current.y, autorange: false }
          : {}),
      },
      uirevision: 'network',
      annotations,
    };

    return (
      <Plot
        data={data}
        layout={layout}
        style={
          full
            ? { width: '100%', height: 'calc(100vh - 200px)' }
            : { width: '100%', height: '600px' }
        }
        config={{
          responsive: true,
          toImageButtonOptions: {
            format: 'png',
            filename: 'netan_network',
            scale: 4,
          },
        }}
        onClick={onClick}
        onLegendClick={onLegendClick}
        onLegendDoubleClick={onLegendDouble}
        onRelayout={onRelayout}
      />
    );
  };

  /* ───────── UI ───────── */
  return (
    <>
      {/* обычная карточка */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
        <Card
          sx={themeInner => ({
            borderRadius: 2,
            boxShadow: 2,
            p: 3,
            backgroundColor: themeInner.palette.card.plot,
            width: '100%',
            maxWidth: 900,
          })}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2.5,
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              Network Plot
            </Typography>
            <IconButton onClick={toggleFull} size="small">
              <FullscreenIcon sx={{ fontSize: 30 }} />
            </IconButton>
          </Box>

          <Panel
            columns={cols}
            colorBy={colorBy}
            setColorBy={setColorBy}
            shapeBy={shapeBy}
            setShapeBy={setShapeBy}
            selLayer={selLayer}
            setSelLayer={setSelLayer}
            layerNames={layerNames}
            hideIso={hideIso}
            setHideIso={setHideIso}
            minW={minW}
            maxW={maxW}
            stepW={stepW}
            range={range}
            setRange={setRange}
          />

          <PlotBox full={false} />
        </Card>
      </Box>

      {/* полноэкранный диалог */}
      <Dialog
        fullScreen
        open={full}
        onClose={toggleFull}
        PaperProps={{
          sx: themeInner => ({
            backgroundColor: themeInner.palette.card.plot,
          }),
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            pt: 3,
            mb: 0.5,
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Network Plot
          </Typography>
          <IconButton onClick={toggleFull}>
            <FullscreenExitIcon sx={{ fontSize: 38 }} />
          </IconButton>
        </Box>

        <Box sx={{ px: 2 }}>
          <Panel
            columns={cols}
            colorBy={colorBy}
            setColorBy={setColorBy}
            shapeBy={shapeBy}
            setShapeBy={setShapeBy}
            selLayer={selLayer}
            setSelLayer={setSelLayer}
            layerNames={layerNames}
            hideIso={hideIso}
            setHideIso={setHideIso}
            minW={minW}
            maxW={maxW}
            stepW={stepW}
            range={range}
            setRange={setRange}
          />

          <PlotBox full={true} />
        </Box>
      </Dialog>
    </>
  );
};

export default NetworkPlot;
