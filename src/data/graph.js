export const nodes = [
  { id: "rodoviaria", label: "Rodoviaria", lat: -15.9995, lng: -48.0518 },
  { id: "setor-central", label: "Setor Central", lat: -15.998, lng: -48.0605 },
  { id: "setor-leste", label: "Setor Leste", lat: -15.9925, lng: -48.044 },
  { id: "setor-oeste", label: "Setor Oeste", lat: -16.0025, lng: -48.0705 },
  {
    id: "parque-alvorada",
    label: "Parque Alvorada",
    lat: -15.9905,
    lng: -48.059,
  },
  { id: "santa-rita", label: "Santa Rita", lat: -15.9855, lng: -48.0675 },
  { id: "ponte-alta", label: "Ponte Alta", lat: -16.022, lng: -48.0805 },
  { id: "vila-uniao", label: "Vila Uniao", lat: -16.0105, lng: -48.0735 },
];

export const edges = {
  rodoviaria: [
    { to: "setor-central", distanceKm: 1.2, traffic: 1.2 },
    { to: "setor-leste", distanceKm: 1.6, traffic: 1.35 },
    { to: "setor-oeste", distanceKm: 1.8, traffic: 1.1 },
  ],
  "setor-central": [
    { to: "rodoviaria", distanceKm: 1.2, traffic: 1.2 },
    { to: "setor-oeste", distanceKm: 1.4, traffic: 1.1 },
    { to: "parque-alvorada", distanceKm: 2.2, traffic: 1.15 },
    { to: "santa-rita", distanceKm: 2.8, traffic: 1.25 },
  ],
  "setor-leste": [
    { to: "rodoviaria", distanceKm: 1.6, traffic: 1.35 },
    { to: "parque-alvorada", distanceKm: 1.5, traffic: 1.05 },
    { to: "santa-rita", distanceKm: 2.1, traffic: 1.25 },
  ],
  "setor-oeste": [
    { to: "rodoviaria", distanceKm: 1.8, traffic: 1.1 },
    { to: "setor-central", distanceKm: 1.4, traffic: 1.1 },
    { to: "ponte-alta", distanceKm: 4.1, traffic: 1.2 },
    { to: "vila-uniao", distanceKm: 2.6, traffic: 1.15 },
  ],
  "parque-alvorada": [
    { to: "setor-central", distanceKm: 2.2, traffic: 1.15 },
    { to: "setor-leste", distanceKm: 1.5, traffic: 1.05 },
    { to: "santa-rita", distanceKm: 1.9, traffic: 1.1 },
    { to: "ponte-alta", distanceKm: 3.2, traffic: 1.05 },
  ],
  "santa-rita": [
    { to: "setor-central", distanceKm: 2.8, traffic: 1.25 },
    { to: "setor-leste", distanceKm: 2.1, traffic: 1.25 },
    { to: "parque-alvorada", distanceKm: 1.9, traffic: 1.1 },
    { to: "ponte-alta", distanceKm: 2.4, traffic: 1.3 },
    { to: "vila-uniao", distanceKm: 1.7, traffic: 1.2 },
  ],
  "ponte-alta": [
    { to: "setor-oeste", distanceKm: 4.1, traffic: 1.2 },
    { to: "parque-alvorada", distanceKm: 3.2, traffic: 1.05 },
    { to: "santa-rita", distanceKm: 2.4, traffic: 1.3 },
    { to: "vila-uniao", distanceKm: 2.8, traffic: 1.1 },
  ],
  "vila-uniao": [
    { to: "setor-oeste", distanceKm: 2.6, traffic: 1.15 },
    { to: "santa-rita", distanceKm: 1.7, traffic: 1.2 },
    { to: "ponte-alta", distanceKm: 2.8, traffic: 1.1 },
  ],
};
