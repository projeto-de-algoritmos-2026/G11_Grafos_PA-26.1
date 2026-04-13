import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { findShortestPath } from "./lib/dijkstra";
import { findNearestNode } from "./lib/geo";
import "./App.css";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(
  /\/$/,
  "",
);
const GAMA_BOUNDS = [
  [-16.03, -48.095],
  [-15.96, -48.03],
];

function centerFromCoords(coords) {
  if (!coords.length) {
    return [
      (GAMA_BOUNDS[0][0] + GAMA_BOUNDS[1][0]) / 2,
      (GAMA_BOUNDS[0][1] + GAMA_BOUNDS[1][1]) / 2,
    ];
  }

  const { lat, lng } = coords.reduce(
    (acc, [latValue, lngValue]) => ({
      lat: acc.lat + latValue,
      lng: acc.lng + lngValue,
    }),
    { lat: 0, lng: 0 },
  );

  return [lat / coords.length, lng / coords.length];
}

function buildEdgeSegments(edgesMap, nodesById) {
  const seen = new Set();
  const segments = [];

  Object.entries(edgesMap).forEach(([from, list]) => {
    list.forEach((edge) => {
      const key = [from, edge.to].sort().join("|");
      if (seen.has(key)) return;

      const fromNode = nodesById.get(from);
      const toNode = nodesById.get(edge.to);
      if (!fromNode || !toNode) return;
      if (fromNode.lat == null || toNode.lat == null) return;

      seen.add(key);
      segments.push([
        [fromNode.lat, fromNode.lng],
        [toNode.lat, toNode.lng],
      ]);
    });
  });

  return segments;
}

function MapFitBounds({ bounds }) {
  const map = useMap();

  useEffect(() => {
    if (!bounds?.length) return;

    map.fitBounds(bounds, { padding: [30, 30] });
  }, [map, bounds]);

  return null;
}

function MapClickHandler({ activeMode, nodes, onPick }) {
  useMapEvents({
    click(event) {
      if (!activeMode || nodes.length === 0) return;

      const nearest = findNearestNode(
        nodes,
        event.latlng.lat,
        event.latlng.lng,
      );
      if (!nearest) return;

      onPick(activeMode, nearest.id);
    },
  });

  return null;
}

function formatKm(value) {
  return value.toFixed(2);
}

function App() {
  const [graph, setGraph] = useState(() => ({
    nodes: [],
    edges: {},
    pois: [],
    source: "servidor",
  }));
  const [startId, setStartId] = useState("");
  const [endId, setEndId] = useState("");
  const [startPoiId, setStartPoiId] = useState("");
  const [endPoiId, setEndPoiId] = useState("");
  const [pickMode, setPickMode] = useState(null);
  const [loadState, setLoadState] = useState({
    status: "idle",
    error: "",
  });

  const nodesById = useMemo(
    () => new Map(graph.nodes.map((node) => [node.id, node])),
    [graph.nodes],
  );
  const edgeCount = useMemo(
    () =>
      Math.round(
        Object.values(graph.edges).reduce(
          (total, list) => total + list.length,
          0,
        ) / 2,
      ),
    [graph.edges],
  );
  const nodesWithCoords = useMemo(
    () =>
      graph.nodes.filter(
        (node) => typeof node.lat === "number" && typeof node.lng === "number",
      ),
    [graph.nodes],
  );
  const pois = useMemo(() => graph.pois ?? [], [graph.pois]);
  const poisById = useMemo(
    () => new Map(pois.map((poi) => [poi.id, poi])),
    [pois],
  );
  const hasPois = pois.length > 0;
  const allCoords = useMemo(
    () => nodesWithCoords.map((node) => [node.lat, node.lng]),
    [nodesWithCoords],
  );
  const poiCoords = useMemo(
    () => pois.map((poi) => [poi.lat, poi.lng]),
    [pois],
  );
  const hasGraph = graph.nodes.length > 0;
  const isLargeGraph = graph.nodes.length > 250;
  const showSelects = hasGraph && graph.nodes.length <= 200;
  const mapCenter = useMemo(() => centerFromCoords(allCoords), [allCoords]);

  useEffect(() => {
    if (!graph.nodes.length) return;

    if (hasPois) {
      setStartPoiId(pois[0]?.id ?? "");
      setEndPoiId(pois[1]?.id ?? "");
      setPickMode(null);
    } else if (showSelects) {
      setStartId(graph.nodes[0]?.id ?? "");
      setEndId(graph.nodes[1]?.id ?? "");
      setPickMode(null);
    } else {
      setStartId("");
      setEndId("");
      setPickMode("start");
    }
  }, [graph.nodes, showSelects, hasPois, pois]);

  useEffect(() => {
    if (!hasPois || !startPoiId) return;
    const poi = poisById.get(startPoiId);
    if (!poi) return;

    const nearest = findNearestNode(nodesWithCoords, poi.lat, poi.lng);
    if (!nearest) return;
    setStartId(nearest.id);
  }, [startPoiId, hasPois, nodesWithCoords, poisById]);

  useEffect(() => {
    if (!hasPois || !endPoiId) return;
    const poi = poisById.get(endPoiId);
    if (!poi) return;

    const nearest = findNearestNode(nodesWithCoords, poi.lat, poi.lng);
    if (!nearest) return;
    setEndId(nearest.id);
  }, [endPoiId, hasPois, nodesWithCoords, poisById]);

  const route = useMemo(() => {
    if (!hasGraph || !startId || !endId) {
      return { path: [], segments: [], totalDistance: 0 };
    }

    const weightFn = (edge) => edge.distanceKm;
    const result = findShortestPath({
      edges: graph.edges,
      startId,
      endId,
      weightFn,
    });

    const segments = [];
    let totalDistance = 0;

    for (let i = 0; i < result.path.length - 1; i += 1) {
      const from = result.path[i];
      const to = result.path[i + 1];
      const edge = graph.edges[from]?.find((item) => item.to === to);

      if (!edge) continue;

      totalDistance += edge.distanceKm;
      segments.push({
        from,
        to,
        distanceKm: edge.distanceKm,
      });
    }

    return {
      path: result.path,
      segments,
      totalDistance,
    };
  }, [startId, endId, graph.edges]);

  const isSamePoint = startId && endId && startId === endId;
  const hasRoute = route.path.length > 1;
  const edgeSegments = useMemo(() => {
    if (!hasGraph) return [];
    if (graph.nodes.length > 400) return [];
    return buildEdgeSegments(graph.edges, nodesById);
  }, [graph.edges, graph.nodes.length, nodesById, hasGraph]);
  const pathCoords = useMemo(
    () =>
      route.path
        .map((nodeId) => {
          const node = nodesById.get(nodeId);
          if (!node || node.lat == null || node.lng == null) return null;
          return [node.lat, node.lng];
        })
        .filter(Boolean),
    [route.path, nodesById],
  );
  const mapBounds = useMemo(() => {
    if (pathCoords.length > 1) return pathCoords;
    if (allCoords.length) return allCoords;
    if (poiCoords.length) return poiCoords;
    return GAMA_BOUNDS;
  }, [pathCoords, allCoords, poiCoords]);
  const mapNodes = useMemo(() => {
    if (!hasGraph) return [];
    if (!isLargeGraph) return nodesWithCoords;
    return nodesWithCoords.filter(
      (node) => node.id === startId || node.id === endId,
    );
  }, [nodesWithCoords, isLargeGraph, startId, endId, hasGraph]);
  const missingPoints = !hasGraph || !startId || !endId;
  const startPoi = poisById.get(startPoiId);
  const endPoi = poisById.get(endPoiId);
  const startLabel =
    startPoi?.label ?? nodesById.get(startId)?.label ?? startId;
  const endLabel = endPoi?.label ?? nodesById.get(endId)?.label ?? endId;
  const isLoading = loadState.status === "loading";

  const handlePick = (mode, nodeId) => {
    if (hasPois) return;
    if (mode === "start") {
      setStartId(nodeId);
      setPickMode("end");
      return;
    }

    setEndId(nodeId);
    setPickMode(null);
  };

  const handleLoadGraph = async () => {
    setLoadState({ status: "loading", error: "" });

    try {
      const response = await fetch(`${API_BASE_URL}/api/graph/gama`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "Falha ao carregar o grafo.");
      }

      setGraph({
        nodes: data.nodes ?? [],
        edges: data.edges ?? {},
        pois: data.pois ?? [],
        source: "servidor",
      });
      setLoadState({ status: "ready", error: "" });
    } catch (error) {
      setLoadState({
        status: "error",
        error: error?.message ?? "Falha ao carregar o grafo.",
      });
    }
  };

  const handleSwap = () => {
    setStartId(endId);
    setEndId(startId);
  };

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">RoutenPlaner</p>
          <h1>Traço de Rota - Gama</h1>
          <p className="subtitle">
            Escolha dois pontos do grafo e calcule a rota mais rapida.
          </p>
          <div className="chip-row">
            <span className="chip">Dijkstra</span>
            <span className="chip">Grafo</span>
          </div>
        </div>
        <div className="hero-card">
          <div className="hero-stat">
            <span className="stat-label">Nós</span>
            <span className="stat-value">{graph.nodes.length}</span>
          </div>
          <div className="hero-stat">
            <span className="stat-label">Arestas</span>
            <span className="stat-value">{edgeCount}</span>
          </div>
          {hasPois ? (
            <div className="hero-stat">
              <span className="stat-label">POIs</span>
              <span className="stat-value">{pois.length}</span>
            </div>
          ) : null}
          <div className="hero-stat">
            <span className="stat-label">Fonte</span>
            <span className="stat-value">Servidor</span>
          </div>
        </div>
      </header>

      <main className="layout">
        <section className="panel">
          <div className="panel-head">
            <h2>Defina a rota</h2>
            <p className="panel-hint">Troque os pontos quando quiser.</p>
          </div>

          {hasPois ? (
            <>
              <div className="field">
                <label htmlFor="startPoi">Origem (POI)</label>
                <select
                  id="startPoi"
                  value={startPoiId}
                  onChange={(event) => setStartPoiId(event.target.value)}
                >
                  {pois.map((poi) => (
                    <option key={poi.id} value={poi.id}>
                      {poi.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="endPoi">Destino (POI)</label>
                <select
                  id="endPoi"
                  value={endPoiId}
                  onChange={(event) => setEndPoiId(event.target.value)}
                >
                  {pois.map((poi) => (
                    <option key={poi.id} value={poi.id}>
                      {poi.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="field">
                <label htmlFor="start">Origem</label>
                {showSelects ? (
                  <select
                    id="start"
                    value={startId}
                    onChange={(event) => setStartId(event.target.value)}
                  >
                    {graph.nodes.map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="node-pill">
                    {!hasGraph
                      ? "Carregue o grafo do servidor"
                      : startId
                        ? startLabel
                        : "Nao definido"}
                  </div>
                )}
              </div>

              <div className="field">
                <label htmlFor="end">Destino</label>
                {showSelects ? (
                  <select
                    id="end"
                    value={endId}
                    onChange={(event) => setEndId(event.target.value)}
                  >
                    {graph.nodes.map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="node-pill">
                    {!hasGraph
                      ? "Carregue o grafo do servidor"
                      : endId
                        ? endLabel
                        : "Nao definido"}
                  </div>
                )}
              </div>
            </>
          )}

          {hasGraph && !hasPois && !showSelects ? (
            <div className="pick-row">
              <button
                type="button"
                className={`pick-button ${pickMode === "start" ? "active" : ""}`}
                onClick={() => setPickMode("start")}
              >
                Selecionar origem no mapa
              </button>
              <button
                type="button"
                className={`pick-button ${pickMode === "end" ? "active" : ""}`}
                onClick={() => setPickMode("end")}
              >
                Selecionar destino no mapa
              </button>
            </div>
          ) : null}

          <button className="swap" type="button" onClick={handleSwap}>
            Inverter origem e destino
          </button>

          <div className="load-card">
            <div>
              <h3>Grafo do servidor</h3>
              <p className="panel-hint">
                O servidor baixa as ruas do Gama, simplifica e envia o grafo
                pronto.
              </p>
            </div>
            <button
              className="load-button"
              type="button"
              onClick={handleLoadGraph}
              disabled={isLoading}
            >
              {isLoading ? "Carregando..." : "Carregar grafo do Gama"}
            </button>
            {loadState.error ? (
              <p className="error">{loadState.error}</p>
            ) : null}
          </div>
        </section>

        <section className="panel panel-map">
          <div className="panel-head">
            <h2>Mapa</h2>
            <p className="panel-hint">Clique nos pontos para ver os nomes.</p>
          </div>
          <div className="map-shell">
            {pickMode ? (
              <div className="map-overlay">
                Clique no mapa para definir{" "}
                {pickMode === "start" ? "origem" : "destino"}.
              </div>
            ) : null}
            <MapContainer
              center={mapCenter}
              zoom={13}
              minZoom={12}
              maxZoom={18}
              maxBounds={GAMA_BOUNDS}
              maxBoundsViscosity={0.9}
              scrollWheelZoom={false}
              className="map"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {edgeSegments.map((segment, index) => (
                <Polyline
                  key={`edge-${index}`}
                  positions={segment}
                  pathOptions={{ color: "#c7c1b6", weight: 2, opacity: 0.75 }}
                />
              ))}
              {pathCoords.length > 1 && (
                <Polyline
                  positions={pathCoords}
                  pathOptions={{ color: "#1e8e7c", weight: 4 }}
                />
              )}
              {mapNodes.map((node) => {
                const isStart = node.id === startId;
                const isEnd = node.id === endId;
                const color = isStart
                  ? "#1e8e7c"
                  : isEnd
                    ? "#f4a259"
                    : "#2f3133";
                const radius = isStart || isEnd ? 8 : 6;

                return (
                  <CircleMarker
                    key={node.id}
                    center={[node.lat, node.lng]}
                    radius={radius}
                    pathOptions={{ color, fillColor: color, fillOpacity: 0.9 }}
                  >
                    <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                      {node.label}
                    </Tooltip>
                  </CircleMarker>
                );
              })}
              {pois.map((poi) => (
                <CircleMarker
                  key={poi.id}
                  center={[poi.lat, poi.lng]}
                  radius={7}
                  pathOptions={{
                    color: "#f4a259",
                    fillColor: "#f4a259",
                    fillOpacity: 0.9,
                  }}
                >
                  <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                    {poi.label}
                  </Tooltip>
                </CircleMarker>
              ))}
              <MapFitBounds bounds={mapBounds} />
              <MapClickHandler
                activeMode={pickMode}
                nodes={nodesWithCoords}
                onPick={handlePick}
              />
            </MapContainer>
          </div>
        </section>

        <section className="panel panel-accent panel-route">
          <div className="panel-head">
            <h2>Melhor rota</h2>
            <span className="badge">
              {hasRoute ? `${route.path.length - 1} trechos` : "Sem rota"}
            </span>
          </div>

          {!hasGraph ? (
            <p className="empty">Carregue o grafo do servidor.</p>
          ) : missingPoints ? (
            <p className="empty">Selecione origem e destino.</p>
          ) : isSamePoint ? (
            <p className="empty">Origem e destino iguais.</p>
          ) : !hasRoute ? (
            <p className="empty">Nao foi possivel encontrar rota.</p>
          ) : (
            <>
              <ol className="path">
                {route.path.map((nodeId, index) => (
                  <li key={`${nodeId}-${index}`}>
                    <span className="dot" aria-hidden="true"></span>
                    <span className="path-label">
                      {nodesById.get(nodeId)?.label ?? nodeId}
                    </span>
                  </li>
                ))}
              </ol>

              <div className="stats">
                <div>
                  <span className="stat-label">Distancia total</span>
                  <span className="stat-value">
                    {formatKm(route.totalDistance)} km
                  </span>
                </div>
              </div>

              <div className="segments">
                {route.segments.map((segment, index) => (
                  <div className="segment" key={`${segment.from}-${index}`}>
                    <div className="segment-title">
                      {nodesById.get(segment.from)?.label ?? segment.from} -{" "}
                      {nodesById.get(segment.to)?.label ?? segment.to}
                    </div>
                    <div className="segment-meta">
                      <span>{formatKm(segment.distanceKm)} km</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
