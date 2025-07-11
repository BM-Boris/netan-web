# NeTan — Integrated Multi-Omics Network Analysis

NeTan is an end-to-end web platform that lets biologists turn raw metabolomics / transcriptomics (and other omics) tables into interactive networks and visual analytics — **directly in the browser, no coding or local installs required**.

| &nbsp; | NeTan in a nutshell |
|--------|--------------------|
| **Upload anything** | Mass-spec features, targeted panels, gene-expression counts, metadata — drag-and-drop CSV/TXT. Samples auto-align across files. |
| **One-click pre-processing** | Missing-value filter, quantile / median / mean normalisation, log₂ transform, Pareto or unit-variance scaling. |
| **Smart feature filtering** | Built-in t-test, one-way ANOVA, PLS-DA VIP, log-fold change, logistic / linear regression, RF-importance. |
| **Network inference** | Spearman, CLR (MI z-score), Random-Forest similarity, Graphical Lasso. Single-layer, stacked or true multilayer aggregation (mean / median / max). |
| **Instant exploration** | Force-directed / Kamada-Kawai / circular layouts, colour & shape nodes by any meta column, edge-weight slider, hide isolates, hover tooltips, legend toggles, full-screen. |
| **Share & export** | Download edge + node tables, PNG plots, or your processed data to reproduce the analysis elsewhere. |

---

## Quick demo

1. Open **<https://netan.io>**.  
2. Click **“Upload Data”** → drop your CSVs.  
3. Adjust parameters in the panel.  
4. Hit **“Build Network”** — watch the graph appear.  
5. Explore, filter, export. Done.

---

## Under the hood

| Layer | Stack |
|-------|-------|
| **Frontend** | React 18, MUI v5, Plotly.js |
| **Backend**  | Django 4, DRF, Pandas, SciPy, Scikit-learn, NetworkX |
| **Realtime** | WebSocket job status + progress bars |
| **Deploy**   | Gunicorn + Nginx on AWS EC2 |

---

## Contact

Boris Minasenko  
📧 <boris.minasenko@emory.edu>
