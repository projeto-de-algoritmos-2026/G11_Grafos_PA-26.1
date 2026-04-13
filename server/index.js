import cors from "cors";
import express from "express";
import { fetchGamaGraph } from "./overpass.js";

const app = express();
const PORT = Number(process.env.PORT) || 5174;
const CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS : true,
    methods: ["GET"],
  }),
);

let cachedGraph = null;
let cacheExpiresAt = 0;

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/graph/gama", async (_req, res) => {
  try {
    const now = Date.now();
    if (cachedGraph && now < cacheExpiresAt) {
      res.json({
        ...cachedGraph,
        meta: { ...cachedGraph.meta, cached: true },
      });
      return;
    }

    const graph = await fetchGamaGraph();
    const edgeCount = Math.round(
      Object.values(graph.edges).reduce(
        (total, list) => total + list.length,
        0,
      ) / 2,
    );

    cachedGraph = {
      ...graph,
      meta: {
        nodeCount: graph.nodes.length,
        edgeCount,
        poiCount: graph.pois?.length ?? 0,
        generatedAt: new Date().toISOString(),
        cached: false,
      },
    };
    cacheExpiresAt = now + CACHE_TTL_MS;

    res.json(cachedGraph);
  } catch (error) {
    res.status(500).json({
      error: error?.message ?? "Falha ao gerar grafo.",
    });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API de grafo ativa em http://localhost:${PORT}`);
});
