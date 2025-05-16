import apiClient from "./axios";

export const fetcher = async (url: string) => {
  const response = await apiClient.get(url);
  return response.data; // SWR recibirá lo que devuelve esta promesa
};
