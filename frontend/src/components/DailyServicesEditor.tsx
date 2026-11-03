import { useEffect, useState } from "react";
import { supabase } from "../api";
import type { DailyService, Reservation } from "../api";
export const meals = { room_only: "Solo pernottamento", half_board: "Mezza pensione", full_board: "Pensione completa" };
export const beaches = { none: "Nessuna spiaggia", morning: "Mezza giornata · mattina", afternoon: "Mezza giornata · pomeriggio", full_day: "Giornata intera" };
export function datesBetween(start: string, end: string) {
 const dates: string[] = [];
 const d = new Date(start + "T12:00:00Z"), until = new Date(end + "T12:00:00Z");
 while(d < until && dates.length < 366){ dates.push(d.toISOString().slice(0,10)); d.setUTCDate(d.getUTCDate()+1); }
 return dates;
}
export default function DailyServicesEditor({booking,services,onSaved}:{booking:Reservation;services:DailyService[];onSaved:()=>Promise<void>}){
 const days=datesBetween(booking.arrival,booking.departure);
 const [rows,setRows]=useState<Record<string,{meal_plan:DailyService["meal_plan"];beach_use:DailyService["beach_use"]}>>({});
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 useEffect(()=>{const next:typeof rows={};for(const d of days){const found=services.find(s=>s.reservation_id===booking.id&&s.service_date===d);next[d]={meal_plan:found?.meal_plan??"room_only",beach_use:found?.beach_use??"none"};}setRows(next);setNotice("");},[booking.id,booking.arrival,booking.departure,services]);
 function change(day:string,key:"meal_plan"|"beach_use",value:string){setRows(old=>({...old,[day]:{...old[day],[key]:value}}));}
 function applyFrom(day:string){setRows(old=>{const next={...old};for(const d of days.filter(d=>d>=day))next[d]={...old[day]};return next;});}
 async function save(){setBusy(true);setNotice("");try{
   for(const day of days){const v=rows[day];if(!v)continue;const original=services.find(s=>s.reservation_id===booking.id&&s.service_date===day);
   if(original?.meal_plan===v.meal_plan&&original?.beach_use===v.beach_use)continue;
   if(!original&&v.meal_plan==="room_only"&&v.beach_use==="none")continue;
   const {error}=await supabase.rpc("save_reservation_daily_services",{p_reservation_id:booking.id,p_day:day,p_meal_plan:v.meal_plan,p_beach_use:v.beach_use});
   if(error)throw error;
   }
   await onSaved();setNotice("Servizi giornalieri salvati.");
 }catch(e){setNotice(e instanceof Error?e.message:String(e));}finally{setBusy(false);}}
 return <div className="daily-editor"><h3>Trattamento e spiaggia per giorno</h3><p>Modifica un singolo giorno oppure applica la sua configurazione a tutti i giorni successivi. Le modifiche saranno salvate premendo il pulsante in fondo.</p>
 <div className="table-scroll"><table><thead><tr><th>Data</th><th>Trattamento</th><th>Spiaggia</th><th></th></tr></thead><tbody>{days.map(day=><tr key={day}><td>{day.slice(8)}/{day.slice(5,7)}</td><td><select aria-label={`Trattamento ${day}`} value={rows[day]?.meal_plan??"room_only"} onChange={e=>change(day,"meal_plan",e.target.value)}>{Object.entries(meals).map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></td><td><select aria-label={`Spiaggia ${day}`} value={rows[day]?.beach_use??"none"} onChange={e=>change(day,"beach_use",e.target.value)}>{Object.entries(beaches).map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></td><td><button type="button" className="secondary" onClick={()=>applyFrom(day)}>Da qui in poi</button></td></tr>)}</tbody></table></div>
 <div className="actions"><button type="button" disabled={busy} onClick={()=>void save()}>{busy?"Salvataggio…":"Salva servizi giornalieri"}</button></div>{notice&&<p role="status">{notice}</p>}</div>;
}
