import { createClient } from "@supabase/supabase-js";
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);
export type Operator = { id: string; email: string; role: "admin" | "reception" | "housekeeping"; active: boolean };
export type Room = { id: number; number: string; room_type_id: number; housekeeping_status: string; active: boolean; bed_count: number };
export type RoomType = { id: number; name: string; capacity: number; base_rate: number };
export type Reservation = { id: number; code: string; lead_guest_id: number; arrival: string; departure: string; status: string; total: string };
export type Assignment = { id: number; room_id: number; reservation_id: number; arrival: string; departure: string; status: string };
export async function getOperator(id: string): Promise<Operator> {
  const { data, error } = await supabase.from("app_users").select("id,email,role,active").eq("id", id).single();
  if (error || !data?.active) throw new Error("Account non autorizzato per questo gestionale.");
  return data as Operator;
}
export async function getPlanning(): Promise<{ rooms: Room[]; roomTypes: RoomType[]; reservations: Reservation[]; assignments: Assignment[] }> {
  const [r, t, b, a] = await Promise.all([
    supabase.from("rooms").select("id,number,room_type_id,housekeeping_status,active,bed_count").order("number"),
    supabase.from("room_types").select("id,name,capacity,base_rate").order("name"),
    supabase.from("reservations").select("id,code,lead_guest_id,arrival,departure,status,total").order("arrival", { ascending: false }).limit(200),
    supabase.from("room_assignments").select("id,room_id,reservation_id,arrival,departure,status").limit(1000)
  ]);
  if (r.error) throw r.error;
  if (t.error) throw t.error;
  if (b.error) throw b.error;
  if (a.error) throw a.error;
  return { rooms: r.data || [], roomTypes: t.data || [], reservations: b.data || [], assignments: a.data || [] };
}

export async function saveRoom(room: { id?: number; number: string; room_type_id: number; bed_count: number; active: boolean }) {
  const { id, ...payload } = room;
  const result = id
    ? await supabase.from("rooms").update(payload).eq("id", id).select("id").single()
    : await supabase.from("rooms").insert(payload).select("id").single();
  if (result.error) throw result.error;
}
