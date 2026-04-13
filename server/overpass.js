import { haversineKm } from "./geo.js";

const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.nchc.org.tw/api/interpreter",
];
const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 600;
const GAMA_BBOX = [-16.03, -48.095, -15.96, -48.03];
const HIGHWAY_FILTER =
  "primary|secondary|tertiary|residential|unclassified|living_street";

function addUndirectedEdge(adjacency, fromId, toId, distanceKm) {
  if (!adjacency.has(fromId)) {
    adjacency.set(fromId, new Map());
  }

  const neighbors = adjacency.get(fromId);
  const existing = neighbors.get(toId);

  if (existing == null || distanceKm < existing) {
    neighbors.set(toId, distanceKm);
  }
}

function buildAdjacency(ways, nodeMap) {
  const adjacency = new Map();

  ways.forEach((way) => {
    const sequence = way.nodes;

    for (let i = 0; i < sequence.length - 1; i += 1) {
      const fromId = String(sequence[i]);
      const toId = String(sequence[i + 1]);
      const fromNode = nodeMap.get(fromId);
      const toNode = nodeMap.get(toId);

      if (!fromNode || !toNode) continue;

      const distanceKm = haversineKm(
        fromNode.lat,
        fromNode.lng,
        toNode.lat,
        toNode.lng,
      );

      addUndirectedEdge(adjacency, fromId, toId, distanceKm);
      addUndirectedEdge(adjacency, toId, fromId, distanceKm);
    }
  });

  return adjacency;
}

function simplifyGraph(nodeMap, adjacency) {
  const anchors = new Set();

  adjacency.forEach((neighbors, nodeId) => {
    if (neighbors.size !== 2) {
      anchors.add(nodeId);
    }
  });

  if (anchors.size === 0 && adjacency.size > 0) {
    const first = adjacency.keys().next().value;
    anchors.add(first);
  }

  const edges = {};
  const visited = new Set();

  anchors.forEach((anchorId) => {
    const neighbors = adjacency.get(anchorId);
    if (!neighbors) return;

    neighbors.forEach((distance, neighborId) => {
      const initialKey = [anchorId, neighborId].sort().join("|");
      if (visited.has(initialKey)) return;

      let totalDistance = distance;
      let previous = anchorId;
      let current = neighborId;

      while (!anchors.has(current)) {
        const currentNeighbors = adjacency.get(current);
        if (!currentNeighbors || currentNeighbors.size !== 2) {
          break;
        }

        const [first, second] = Array.from(currentNeighbors.keys());
        const next = first === previous ? second : first;
        if (!next) break;

        totalDistance += currentNeighbors.get(next);
        previous = current;
        current = next;

        if (current === anchorId) break;
      }

      const endId = current;
      if (endId === anchorId) return;
      const edgeKey = [anchorId, endId].sort().join("|");
      if (visited.has(edgeKey)) return;

      visited.add(edgeKey);

      if (!edges[anchorId]) edges[anchorId] = [];
      if (!edges[endId]) edges[endId] = [];

      edges[anchorId].push({ to: endId, distanceKm: totalDistance });
      edges[endId].push({ to: anchorId, distanceKm: totalDistance });
    });
  });

  const nodeIds = new Set();
  Object.entries(edges).forEach(([from, list]) => {
    nodeIds.add(from);
    list.forEach((edge) => nodeIds.add(edge.to));
  });

  const nodes = Array.from(nodeIds)
    .map((id) => {
      const node = nodeMap.get(id);
      if (!node) return null;

      return {
        id,
        label: `No ${id}`,
        lat: node.lat,
        lng: node.lng,
      };
    })
    .filter(Boolean);

  return { nodes, edges };
}

function buildGraphFromOverpass(data) {
  const nodeMap = new Map();
  const ways = [];

  data.elements.forEach((element) => {
    if (element.type === "node") {
      if (typeof element.lat !== "number" || typeof element.lon !== "number") {
        return;
      }

      const id = String(element.id);
      nodeMap.set(id, { id, lat: element.lat, lng: element.lon });
      return;
    }

    if (element.type === "way" && Array.isArray(element.nodes)) {
      ways.push(element);
    }
  });

  const adjacency = buildAdjacency(ways, nodeMap);
  return simplifyGraph(nodeMap, adjacency);
}

async function fetchFromOverpass(url, query) {
  let response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: query,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Overpass fetch failed", {
      url,
      message: error?.message,
      cause: error?.cause?.message,
    });
    return { ok: false, error };
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    // eslint-disable-next-line no-console
    console.error("Overpass error", {
      url,
      status: response.status,
      statusText: response.statusText,
      body: errorBody.slice(0, 800),
    });
    return { ok: false };
  }

  const data = await response.json();
  if (!data?.elements?.length) {
    // eslint-disable-next-line no-console
    console.error("Overpass empty response", { url });
    return { ok: false };
  }

  return { ok: true, data };
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchGamaGraph() {
  const query = `
[out:json][timeout:25];
(
  way["highway"~"${HIGHWAY_FILTER}"](${GAMA_BBOX.join(",")});
);
(._;>;);
out body;
`;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    for (const url of OVERPASS_URLS) {
      const result = await fetchFromOverpass(url, query);
      if (result.ok) {
        return buildGraphFromOverpass(result.data);
      }
    }

    if (attempt < MAX_ATTEMPTS) {
      const delay = BASE_BACKOFF_MS * 2 ** (attempt - 1);
      // eslint-disable-next-line no-console
      console.warn(`Overpass retry in ${delay}ms (attempt ${attempt + 1}).`);
      await wait(delay);
    }
  }

  throw new Error("Falha ao carregar dados do Overpass.");
}
