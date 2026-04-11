export function findShortestPath({ edges, startId, endId, weightFn }) {
  const nodeIds = new Set(Object.keys(edges));

  Object.values(edges).forEach((list) => {
    list.forEach((edge) => {
      nodeIds.add(edge.to);
    });
  });

  const unvisited = new Set(nodeIds);
  const distances = {};
  const previous = {};

  nodeIds.forEach((nodeId) => {
    distances[nodeId] = Number.POSITIVE_INFINITY;
  });

  if (!nodeIds.has(startId) || !nodeIds.has(endId)) {
    return { path: [], cost: Number.POSITIVE_INFINITY };
  }

  distances[startId] = 0;

  while (unvisited.size > 0) {
    let current = null;
    let smallest = Number.POSITIVE_INFINITY;

    for (const nodeId of unvisited) {
      if (distances[nodeId] < smallest) {
        smallest = distances[nodeId];
        current = nodeId;
      }
    }

    if (current === null || smallest === Number.POSITIVE_INFINITY) {
      break;
    }

    if (current === endId) {
      break;
    }

    unvisited.delete(current);

    for (const edge of edges[current] ?? []) {
      if (!unvisited.has(edge.to)) continue;

      const candidate = distances[current] + weightFn(edge);
      if (candidate < distances[edge.to]) {
        distances[edge.to] = candidate;
        previous[edge.to] = current;
      }
    }
  }

  if (distances[endId] === Number.POSITIVE_INFINITY) {
    return { path: [], cost: Number.POSITIVE_INFINITY };
  }

  const path = [];
  let cursor = endId;

  while (cursor !== undefined) {
    path.unshift(cursor);
    cursor = previous[cursor];
  }

  return { path, cost: distances[endId] };
}
