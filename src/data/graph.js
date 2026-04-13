export const nodes = [
  { id: "fcte", label: "UnB FCTE", lat: -15.989636, lng: -48.046315 },
  {
    id: "terminal",
    label: "Terminal BRT Gama",
    lat: -15.991203,
    lng: -48.048704,
  },
  {
    id: "setor-central",
    label: "Setor Central",
    lat: -15.9935,
    lng: -48.0608,
  },
  {
    id: "setor-leste",
    label: "Setor Leste",
    lat: -15.9864,
    lng: -48.0398,
  },
  {
    id: "setor-oeste",
    label: "Setor Oeste",
    lat: -16.0039,
    lng: -48.0785,
  },
  {
    id: "parque-urbano",
    label: "Parque Urbano do Gama",
    lat: -15.9991,
    lng: -48.0582,
  },
  {
    id: "estadio-bezerrao",
    label: "Estadio Bezerrao",
    lat: -16.0032,
    lng: -48.0666,
  },
  {
    id: "hospital-gama",
    label: "Hospital Regional do Gama",
    lat: -15.9956,
    lng: -48.0748,
  },
  {
    id: "feira-gama",
    label: "Feira do Gama",
    lat: -15.9872,
    lng: -48.0725,
  },
  {
    id: "praca-pioneiros",
    label: "Praca dos Pioneiros",
    lat: -15.9919,
    lng: -48.0642,
  },
  {
    id: "delegacia-gama",
    label: "Delegacia do Gama",
    lat: -15.9998,
    lng: -48.0702,
  },
  {
    id: "admin-regional",
    label: "Administracao Regional do Gama",
    lat: -15.9926,
    lng: -48.0665,
  },
  {
    id: "ponte-alta",
    label: "Ponte Alta",
    lat: -16.0312,
    lng: -48.0901,
  },
];

export const edges = {
  fcte: [
    { to: "terminal", distanceKm: 0.36 },
    { to: "setor-leste", distanceKm: 0.9 },
    { to: "parque-urbano", distanceKm: 1.2 },
  ],
  terminal: [
    { to: "fcte", distanceKm: 0.36 },
    { to: "praca-pioneiros", distanceKm: 1.0 },
    { to: "setor-central", distanceKm: 1.2 },
    { to: "estadio-bezerrao", distanceKm: 1.4 },
  ],
  "setor-central": [
    { to: "terminal", distanceKm: 1.2 },
    { to: "feira-gama", distanceKm: 1.1 },
    { to: "admin-regional", distanceKm: 0.8 },
    { to: "hospital-gama", distanceKm: 1.3 },
    { to: "setor-oeste", distanceKm: 1.5 },
  ],
  "setor-leste": [
    { to: "fcte", distanceKm: 0.9 },
    { to: "parque-urbano", distanceKm: 1.3 },
    { to: "ponte-alta", distanceKm: 3.2 },
  ],
  "setor-oeste": [
    { to: "setor-central", distanceKm: 1.5 },
    { to: "estadio-bezerrao", distanceKm: 1.6 },
    { to: "hospital-gama", distanceKm: 1.7 },
    { to: "ponte-alta", distanceKm: 2.9 },
  ],
  "parque-urbano": [
    { to: "fcte", distanceKm: 1.2 },
    { to: "estadio-bezerrao", distanceKm: 1.1 },
    { to: "feira-gama", distanceKm: 1.6 },
    { to: "setor-leste", distanceKm: 1.3 },
  ],
  "estadio-bezerrao": [
    { to: "terminal", distanceKm: 1.4 },
    { to: "parque-urbano", distanceKm: 1.1 },
    { to: "setor-oeste", distanceKm: 1.6 },
  ],
  "hospital-gama": [
    { to: "setor-central", distanceKm: 1.3 },
    { to: "delegacia-gama", distanceKm: 1.4 },
    { to: "setor-oeste", distanceKm: 1.7 },
    { to: "ponte-alta", distanceKm: 2.8 },
  ],
  "feira-gama": [
    { to: "setor-central", distanceKm: 1.1 },
    { to: "praca-pioneiros", distanceKm: 0.9 },
    { to: "delegacia-gama", distanceKm: 1.0 },
    { to: "parque-urbano", distanceKm: 1.6 },
  ],
  "praca-pioneiros": [
    { to: "terminal", distanceKm: 1.0 },
    { to: "feira-gama", distanceKm: 0.9 },
    { to: "estadio-bezerrao", distanceKm: 1.2 },
    { to: "admin-regional", distanceKm: 0.7 },
  ],
  "delegacia-gama": [
    { to: "admin-regional", distanceKm: 1.1 },
    { to: "feira-gama", distanceKm: 1.0 },
    { to: "hospital-gama", distanceKm: 1.4 },
  ],
  "admin-regional": [
    { to: "praca-pioneiros", distanceKm: 0.7 },
    { to: "setor-central", distanceKm: 0.8 },
    { to: "delegacia-gama", distanceKm: 1.1 },
  ],
  "ponte-alta": [
    { to: "setor-oeste", distanceKm: 2.9 },
    { to: "hospital-gama", distanceKm: 2.8 },
    { to: "setor-leste", distanceKm: 3.2 },
  ],
};
