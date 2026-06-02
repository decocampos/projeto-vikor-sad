// Edite aqui as URLs da API conforme necessário
export const API_BASE_URL =
  (import.meta.env.VITE_AVIATION_API_URL as string | undefined) ??
  "http://localhost:8000";

export const API_ENDPOINTS = {
  aircrafts: `${API_BASE_URL}/aircrafts`,
  vikor: `${API_BASE_URL}/vikor`,
};

export const ORIGIN = "Recife, PE";
