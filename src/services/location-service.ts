import { api } from "./api-client";
import type { LocationSummary, LocationDetail, LocationFormData } from "@/types";

const BASE = "/api/v1/manage/locations";

export async function listLocations(): Promise<LocationSummary[]> {
  const data = await api.get<{ locations: LocationSummary[] }>(BASE);
  return data.locations;
}

export async function createLocation(location: LocationFormData): Promise<LocationDetail> {
  const data = await api.post<{ location: LocationDetail }>(BASE, { location });
  return data.location;
}

export async function updateLocation(id: string, location: Partial<LocationFormData>): Promise<LocationDetail> {
  const data = await api.put<{ location: LocationDetail }>(`${BASE}/${id}`, { location });
  return data.location;
}

export async function deleteLocation(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`);
}
