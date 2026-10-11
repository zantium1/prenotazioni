import { createClient } from "@supabase/supabase-js";
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);
export type Operator = { id: string; email: string; role: "admin" | "reception" | "housekeeping"; active: boolean };
export type Room = { id: number; number: string; room_type_id: number; housekeeping_status: string; active: boolean };
export type Reservation = { id: number; code: string; lead_guest_id: number; arrival: string; departure: string; status: string; total: string };
export type Assignment = { id: number; room_id: number; reservation_id: number; arrival: string; departure: string; status: string };
export async function getOperator(id: string): Promise<Operator> {
  const { data, error } = await supabase.from("app_users").select("id,email,role,active").eq("id", id).single();
  if (error || !data?.active) throw new Error("Account non autorizzato per questo gestionale.");
  return data as Operator;
}
export async function getPlanning(): Promise<{ rooms: Room[]; reservations: Reservation[]; assignments: Assignment[] }> {
  const [r, b, a] = await Promise.all([
    supabase.from("rooms").select("id,number,room_type_id,housekeeping_status,active").order("number"),
    supabase.from("reservations").select("id,code,lead_guest_id,arrival,departure,status,total").order("arrival", { ascending: false }).limit(200),
    supabase.from("room_assignments").select("id,room_id,reservation_id,arrival,departure,status").limit(1000)
  ]);
  if (r.error) throw r.error;
  if (b.error) throw b.error;
  if (a.error) throw a.error;
  return { rooms: r.data || [], reservations: b.data || [], assignments: a.data || [] };
}
