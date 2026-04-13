export function findShortestPath({
  edges: arestas,
  startId: inicioId,
  endId: fimId,
  weightFn: pesoFn,
}) {
  const idsNos = new Set(Object.keys(arestas));

  Object.values(arestas).forEach((lista) => {
    lista.forEach((aresta) => {
      idsNos.add(aresta.to);
    });
  });

  const naoVisitados = new Set(idsNos);
  const distancias = {};
  const anterior = {};

  idsNos.forEach((idNo) => {
    distancias[idNo] = Number.POSITIVE_INFINITY;
  });

  if (!idsNos.has(inicioId) || !idsNos.has(fimId)) {
    return { path: [], cost: Number.POSITIVE_INFINITY };
  }

  distancias[inicioId] = 0;

  while (naoVisitados.size > 0) {
    let atual = null;
    let menor = Number.POSITIVE_INFINITY;

    for (const idNo of naoVisitados) {
      if (distancias[idNo] < menor) {
        menor = distancias[idNo];
        atual = idNo;
      }
    }

    if (atual === null || menor === Number.POSITIVE_INFINITY) {
      break;
    }

    if (atual === fimId) {
      break;
    }

    naoVisitados.delete(atual);

    for (const aresta of arestas[atual] ?? []) {
      if (!naoVisitados.has(aresta.to)) continue;

      const candidato = distancias[atual] + pesoFn(aresta);
      if (candidato < distancias[aresta.to]) {
        distancias[aresta.to] = candidato;
        anterior[aresta.to] = atual;
      }
    }
  }

  if (distancias[fimId] === Number.POSITIVE_INFINITY) {
    return { path: [], cost: Number.POSITIVE_INFINITY };
  }

  const caminho = [];
  let cursor = fimId;

  while (cursor !== undefined) {
    caminho.unshift(cursor);
    cursor = anterior[cursor];
  }

  return { path: caminho, cost: distancias[fimId] };
}
