import React from 'react';
import { Box, Grow, Card, CardContent, Typography, Link } from '@mui/material';

const cardStyles = {
  borderRadius: 2,
  boxShadow: 2,
  p: 3,
  backgroundColor: 'card.main',
};

const listItemStyles = {
  marginBottom: 1,
};

const linkStyles = (theme) => ({
  color: theme.palette.mode === 'dark' ? '#f0a17a' : theme.palette.secondary.main,
  fontWeight: 700,
  textDecorationColor: theme.palette.mode === 'dark' ? 'rgba(240, 161, 122, 0.55)' : undefined,
  '&:hover': {
    color: theme.palette.mode === 'dark' ? '#ffd0ba' : theme.palette.secondary.dark,
  },
});

const Guide = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      maxWidth: 900,
      mx: 'auto',
    }}
  >
    {/* Introduction */}
    <Grow in timeout={500}>
      <Card sx={{ ...cardStyles, width: '100%', mb: 4, mt: -1.3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
          Introduction
        </Typography>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <Typography paragraph>
            Netan builds multi-omics networks from numeric feature tables. You upload data files, specify preprocessing and filtering rules, choose network inference methods, and get an interactive graph with downloadable data.
          </Typography>
          <Typography paragraph>
            For advanced workflows, including large-scale analyses, network tuning, label-guided ranking, stability-based feature selection, and programmatic graph inspection, use the Python package.
          </Typography>
          <Box sx={{ display: 'grid', gap: 0.5 }}>
            <Typography>
              Python docs: <Link sx={linkStyles} href="https://minasenko.com/netan" target="_blank" rel="noopener noreferrer">minasenko.com/netan</Link>
            </Typography>
            <Typography>
              Install: <code>pip install netan</code>
            </Typography>
            <Typography>
              GitHub: <Link sx={linkStyles} href="https://github.com/BM-Boris/netan" target="_blank" rel="noopener noreferrer">github.com/BM-Boris/netan</Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Grow>

    {/* 1. Upload Data Files */}
    <Grow in timeout={500}>
      <Card sx={{ ...cardStyles, width: '100%', mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
          1. Upload Data Files
        </Typography>
        <CardContent>
          <Typography paragraph>
            Provide one or more CSV/TXT files containing your feature data. For each:
          </Typography>
          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            <Box component="li" sx={listItemStyles}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                Mass Spectrometry
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Untargeted m/z, retention time, and intensities.
              </Typography>
            </Box>
            
            <Box component="li" sx={listItemStyles}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                Transcriptomics / Genomics / Targeted MS
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Identifier column + sample columns.
              </Typography>
            </Box>
            <Box component="li" sx={listItemStyles}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                Meta Data
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sample annotation table (first column = sample IDs).
              </Typography>
            </Box>
            <Box component="li" sx={listItemStyles}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                Other
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Any numeric feature matrix.
              </Typography>
            </Box>
          </Box>
          <br></br>
          <Typography paragraph>
            Use +/– to add or remove entries. Enable “Sync Settings” to copy your preprocessing and filter choices to every non-meta file automatically. 
          </Typography>
          <Typography>
            Sample columns are automatically aligned across all files; any sample not present in every file will be removed.
          </Typography>
        </CardContent>
      </Card>
    </Grow>

    {/* 2. Preprocessing & Filter */}
    <Grow in timeout={500}>
      <Card sx={{ ...cardStyles, width: '100%', mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
          2. Preprocessing & Filter
        </Typography>
        <CardContent>
          <Typography paragraph>
            Clean and reduce your feature set before network inference:
          </Typography>
          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            <Box component="li" sx={listItemStyles}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                Missing Value Threshold
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Remove features missing in more than X% of samples.
              </Typography>
            </Box>
            <Box component="li" sx={listItemStyles}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                Normalization
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Ion Current or Probabilistic Quotient; or skip.
              </Typography>
            </Box>
            <Box component="li" sx={listItemStyles}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                Log Transformation
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Apply log2 or natural log to stabilize variance.
              </Typography>
            </Box>
            <Box component="li" sx={listItemStyles}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                Scaling
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Autoscale (unit variance) or Pareto; or skip.
              </Typography>
            </Box>
            <Box component="li" sx={listItemStyles}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                Feature Filter
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Remove features based on t-test, ANOVA, PLS-DA VIP, fold-change, or Random Forest importance thresholds.
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Grow>

    {/* 3. Network Inference Methods */}
<Grow in timeout={500}>
  <Card sx={{ ...cardStyles, width: '100%', mb: 4 }}>
    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
      3. Network Inference Methods
    </Typography>
    <CardContent>
      <Box component="ul" sx={{ pl: 2, m: 0 }}>
        <Box component="li" sx={{ ...listItemStyles, mt: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
            Spearman Correlation
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Ranks each variable’s values and computes the Spearman correlation matrix. Netan sparsifies the similarity matrix with raw, normalized, or auto-target thresholds, then builds an undirected graph with edge weights from similarity values.
          </Typography>
        </Box>
        <Box component="li" sx={listItemStyles}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
            CLR (Context Likelihood of Relatedness)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Computes pairwise mutual information via k-nearest-neighbors, symmetrizes the matrix, then transforms each MI value into a z-score using row- and column-wise statistics. Netan applies raw, normalized, or auto-target sparsification and optional kNN pruning.
          </Typography>
        </Box>
        <Box component="li" sx={listItemStyles}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
            Random Forest Similarity
          </Typography>
          <Typography variant="body2" color="text.secondary">
            For each feature, trains tree models to predict that feature from all others and uses feature importance as similarity. Netan symmetrizes the matrix, sparsifies it, and keeps weighted edges from averaged importance values.
          </Typography>
        </Box>
        <Box component="li" sx={listItemStyles}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
            Graphical Lasso
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Fits a sparse inverse covariance model, calculates partial correlations from the precision matrix, and uses Netan sparsification to define weighted edges.
          </Typography>
        </Box>
      </Box>
    </CardContent>
  </Card>
</Grow>

    {/* 4. Modes & Aggregation */}
    <Grow in timeout={500}>
      <Card sx={{ ...cardStyles, width: '100%', mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
          4. Modes & Aggregation
        </Typography>
        <CardContent>
          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            <Box component="li" sx={listItemStyles}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                Node Mode
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Select samples or features as graph nodes.
              </Typography>
            </Box>
            <Box component="li" sx={listItemStyles}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                Layer Mode
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                <Box component="li">
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Stack: merges all data into one network; edges labeled “Entire.”
                  </Typography>
                </Box>
                <Box component="li">
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Multilayer: shows per-file layer graphs plus combined graph variants on one shared layout: Entire, Fused, Consensus, and Cross when available.
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box component="li" sx={listItemStyles}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                Aggregation
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choose mean, median, or max to build the Fused graph from layer similarity matrices. Entire is the union-style combined graph, Consensus keeps edges shared by layers, and Cross contains cross-layer feature links when feature multilayer mode is used.
              </Typography>
            </Box>
            <Box component="li" sx={listItemStyles}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                Sparsification
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Use either raw threshold, normalized threshold, or auto target. Entering one manual threshold disables the others; auto target defaults to 95%, and kNN defaults to auto.
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Grow>

    {/* 5. Build Network & Stats */}
    <Grow in timeout={500}>
      <Card sx={{ ...cardStyles, width: '100%', mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
          5. Build Network & Stats
        </Typography>
        <CardContent>
          <Typography paragraph>
            Click “Build” to start. The progress bar maps parsing, preprocessing, inference, merging, and statistics calculations in real time.
          </Typography>
          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            <Box component="li" sx={listItemStyles}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                Overall stats
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total nodes, edges, density, mean degree, components, communities, and modules.
              </Typography>
            </Box>
            <Box component="li" sx={listItemStyles}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                Active nodes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Nodes with at least one connection.
              </Typography>
            </Box>
            <Box component="li" sx={listItemStyles}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                Density
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Network sparsity metrics (overall and active subgraph).
              </Typography>
            </Box>
            <Box component="li" sx={listItemStyles}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                Layer stats
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Node/edge counts, densities, mean degree, communities/modules, final thresholds, and final k for each graph/layer.
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Grow>

    {/* 6. Explore & Download */}
    <Grow in timeout={500}>
      <Card sx={{ ...cardStyles, width: '100%', mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
          6. Explore & Download
        </Typography>
        <CardContent>
          <Typography paragraph>
            Inspect and export your graph:
          </Typography>
          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            <Box component="li" sx={listItemStyles}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                Node Styling
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Color and shape nodes by metadata fields.
              </Typography>
            </Box>
            <Box component="li" sx={listItemStyles}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                Filters & Zoom
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Filter layers by edge weight range and hide disconnected nodes. Fullscreen, zoom, and legend toggles for navigation.
              </Typography>
            </Box>
            <Box component="li" sx={listItemStyles}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                Export Options
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Download edge list CSV or merged feature–metadata table. Feature and annotation columns are kept first; sample-value columns are placed at the end.
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Grow>

    {/* Privacy & Contact */}
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'space-between', width: '100%', mb: 4 }}>
      <Grow in timeout={500}>
        <Card sx={{ ...cardStyles, width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
            Privacy Policy
          </Typography>
          <CardContent>
            <Typography paragraph>
              No data is stored.
            </Typography>
           
          </CardContent>
        </Card>
      </Grow>
      <Grow in timeout={500}>
        <Card sx={{ ...cardStyles, width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
            Contact Information
          </Typography>
          <CardContent>
            <Typography paragraph>
              Support: <Link sx={linkStyles} href="mailto:boris.minasenko@emory.edu">boris.minasenko@emory.edu</Link>
            </Typography>
            <Typography>
              Code: <Link sx={linkStyles} href="https://github.com/BM-Boris/netan">github.com/BM-Boris/netan</Link>
            </Typography>
          </CardContent>
        </Card>
      </Grow>
    </Box>

    {/* Troubleshooting & Tips */}
    <Grow in timeout={500}>
      <Card sx={{ ...cardStyles, width: '100%', mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
          Troubleshooting & Tips
        </Typography>
        <CardContent>
          <Typography paragraph>
            No edges? Lower thresholds or verify sample alignment across files.
          </Typography>
          <Typography paragraph>
            Single file in multilayer mode? Switch to Stack mode under Network Params.
          </Typography>
          <Typography paragraph>
            Too many edges? Increase the raw/normalized threshold, lower the auto target, or apply stricter feature filtering.
          </Typography>
          <Typography>
            For errors, open your browser console or check server logs for detailed messages.
          </Typography>
        </CardContent>
      </Card>
    </Grow>
  </Box>
);

export default Guide;
