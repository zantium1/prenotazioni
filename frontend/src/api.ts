import { createClient } from "@supabase/supabase-js";
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);
export type Room = { id: number; number: string; room_type_id: number; housekeeping_status: string; active: boolean };
export type Reservation = { id: number; code: string; lead_guest_id: number; arrival: string; departure: string; status: string; total: string };
export async function api<T>(path: string): Promise<T> {
  const result = await supabase.auth.getSession();
  const accessToken = result.data.session?.access_token;
  if (!accessToken) throw new Error("Accesso richiesto");
  const response = await fetch(import.meta.env.VITE_API_URL + "/api/v1" + path, {
    headers: { Authorization: "Bearer " + accessToken }
  });
  if (!response.ok) throw new Error("Errore API " + response.status);
  return response.json();
}
