import { createClient } from "@supabase/supabase-js";
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);
export type Operator = { id: string; email: string; role: "admin" | "reception" | "housekeeping"; active: boolean };
export type Room = { id: number; number: string; room_type_id: number; housekeeping_status: string; active: boolean; bed_count: number };
export type RoomType = { id: number; name: string; capacity: number; base_rate: number };
export type Reservation = { id: number; code: string; lead_guest_id: number; adults_count: number; children_count: number; children_0_6_count: number; children_7_12_count: number; arrival: string; departure: string; status: string; total: string; original_email: string | null; guest: { first_name: string; last_name: string; birth_date: string | null; tax_code: string | null } | null };
export type Season = {id:number;name:string;sort_order:number};
export type SeasonPeriod = {id:number;season_id:number;start_md:string;end_md:string};
export type SeasonOverride = {id:number;season_id:number;month_day:string;year:number|null};
export type SeasonRate = {season_id:number;room_type_id:number;guest_group:string;meal_plan:string;price:number};
export type SeasonGuestSupplement = {season_id:number;guest_group:string;price:number};
export type SeasonRoomPrice = {season_id:number;room_type_id:number;price:number};
export type SeasonMealPrice = {season_id:number;guest_group:string;meal_plan:string;price:number};
export type SeasonBeachRate = {season_id:number;beach_use:string;price:number};
export type ServicePrice = { code: string; price: number };
export type DailyService = { reservation_id: number; service_date: string; meal_plan: "room_only" | "half_board" | "full_board"; beach_use: "none" | "morning" | "afternoon" | "full_day" };
export type Assignment = { id: number; room_id: number; reservation_id: number; arrival: string; departure: string; status: string };
export async function getOperator(id: string): Promise<Operator> {
  const { data, error } = await supabase.from("app_users").select("id,email,role,active").eq("id", id).single();
  if (error || !data?.active) throw new Error("Account non autorizzato per questo gestionale.");
  return data as Operator;
}
export async function getPlanning(): Promise<{ rooms: Room[]; roomTypes: RoomType[]; reservations: Reservation[]; assignments: Assignment[]; dailyServices: DailyService[]; servicePrices: ServicePrice[]; seasons:Season[]; seasonPeriods:SeasonPeriod[]; seasonOverrides:SeasonOverride[]; seasonRates:SeasonRate[]; seasonBeachRates:SeasonBeachRate[]; seasonRoomPrices:SeasonRoomPrice[]; seasonMealPrices:SeasonMealPrice[]; seasonGuestSupplements:SeasonGuestSupplement[] }> {
  const [r, t, b, a, ds, sp, ss, pp, oo, rr, bb, sr, sm, sg] = await Promise.all([
    supabase.from("rooms").select("id,number,room_type_id,housekeeping_status,active,bed_count").order("number"),
    supabase.from("room_types").select("id,name,capacity,base_rate").order("name"),
    supabase.from("reservations").select("id,code,lead_guest_id,adults_count,children_count,children_0_6_count,children_7_12_count,arrival,departure,status,total,original_email,guest:guests!reservations_lead_guest_id_fkey(first_name,last_name,birth_date,tax_code)").order("arrival", { ascending: false }).limit(200),
    supabase.from("room_assignments").select("id,room_id,reservation_id,arrival,departure,status").limit(1000),
    supabase.from("reservation_daily_services").select("reservation_id,service_date,meal_plan,beach_use").limit(5000),
    supabase.from("service_prices").select("code,price"),
    supabase.from("hotel_seasons").select("id,name,sort_order"),
    supabase.from("hotel_season_periods").select("id,season_id,start_md,end_md"),
    supabase.from("hotel_season_overrides").select("id,season_id,month_day,year"),
    supabase.from("hotel_season_rates").select("season_id,room_type_id,guest_group,meal_plan,price"),
    supabase.from("hotel_season_beach_rates").select("season_id,beach_use,price"),
    supabase.from("hotel_season_room_prices").select("season_id,room_type_id,price"),
    supabase.from("hotel_season_meal_prices").select("season_id,guest_group,meal_plan,price"),
    supabase.from("hotel_season_guest_supplements").select("season_id,guest_group,price")
  ]);
  if (r.error) throw r.error;
  if (t.error) throw t.error;
  if (b.error) throw b.error;
  if (a.error) throw a.error;
  if (ds.error) throw ds.error;
  if (sp.error) throw sp.error;
  for(const x of [ss,pp,oo,rr,bb,sr,sm,sg])if(x.error)throw x.error;
  return { rooms: r.data || [], roomTypes: t.data || [], reservations: (b.data || []).map(row => ({ ...row, guest: Array.isArray(row.guest) ? (row.guest[0] ?? null) : row.guest })), assignments: a.data || [], dailyServices: (ds.data || []) as DailyService[], servicePrices: sp.data || [], seasons:ss.data||[], seasonPeriods:pp.data||[], seasonOverrides:oo.data||[], seasonRates:rr.data||[], seasonBeachRates:bb.data||[], seasonRoomPrices:sr.data||[],seasonMealPrices:sm.data||[],seasonGuestSupplements:sg.data||[] };
}

export async function saveRoom(room: { id?: number; number: string; room_type_id: number; bed_count: number; active: boolean }) {
  const { id, ...payload } = room;
  const result = id
    ? await supabase.from("rooms").update(payload).eq("id", id).select("id").single()
    : await supabase.from("rooms").insert(payload).select("id").single();
  if (result.error) throw result.error;
}
