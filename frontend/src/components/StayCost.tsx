import type { Assignment, DailyService, Reservation, Room, RoomType, ServicePrice } from "../api";
import { datesBetween } from "./DailyServicesEditor";
const euro = (v:number)=>new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR"}).format(v);
export function calculateStay(booking:Reservation,rooms:Room[],types:RoomType[],assignments:Assignment[],daily:DailyService[],prices:ServicePrice[]){
 const assigned=assignments.filter(a=>a.reservation_id===booking.id&&a.status==="active");
 const days=datesBetween(booking.arrival,booking.departure);
 const rate=(day:string)=>{const a=assigned.find(a=>a.arrival<=day&&a.departure>day);const room=rooms.find(r=>r.id===a?.room_id);return Number(types.find(t=>t.id===room?.room_type_id)?.base_rate??0);};
 const price=(code:string)=>Number(prices.find(p=>p.code===code)?.price??0);
 const rows=days.map(day=>{
  const s=daily.find(x=>x.reservation_id===booking.id&&x.service_date===day);
  const room=rate(day);
  const meal=s?.meal_plan==="half_board"?price("half_board"):s?.meal_plan==="full_board"?price("full_board"):0;
  const beach=s?.beach_use==="full_day"?price("beach_full_day"):s?.beach_use==="morning"||s?.beach_use==="afternoon"?price("beach_half_day"):0;
  return {day,room,meal,beach,total:room+meal+beach};
 });
 return {rows,roomTotal:rows.reduce((n,r)=>n+r.room,0),mealTotal:rows.reduce((n,r)=>n+r.meal,0),beachTotal:rows.reduce((n,r)=>n+r.beach,0),total:rows.reduce((n,r)=>n+r.total,0)};
}
export default function StayCost({booking,rooms,types,assignments,daily,prices}:{booking:Reservation;rooms:Room[];types:RoomType[];assignments:Assignment[];daily:DailyService[];prices:ServicePrice[]}){
 const c=calculateStay(booking,rooms,types,assignments,daily,prices);
 return <section className="stay-cost"><h3>Preventivo soggiorno</h3><p>Calcolo automatico: una notte per ciascuna data dal giorno di arrivo al giorno precedente la partenza. I servizi si addebitano soltanto nei giorni in cui sono impostati.</p>
 <div className="table-scroll"><table><thead><tr><th>Giorno</th><th>Camera</th><th>Trattamento</th><th>Spiaggia</th><th>Totale</th></tr></thead><tbody>{c.rows.map(r=><tr key={r.day}><td>{r.day.slice(8)}/{r.day.slice(5,7)}</td><td>{euro(r.room)}</td><td>{euro(r.meal)}</td><td>{euro(r.beach)}</td><td><strong>{euro(r.total)}</strong></td></tr>)}</tbody></table></div>
 <div className="cost-summary"><span>Camere: {euro(c.roomTotal)}</span><span>Trattamento: {euro(c.mealTotal)}</span><span>Spiaggia: {euro(c.beachTotal)}</span><strong>Totale soggiorno: {euro(c.total)}</strong></div>
 <p className="cost-note">Prima bozza: importi calcolati sui listini attuali, senza sconti, acconti o tariffe storicizzate. Non costituisce ancora un conto definitivo.</p>
 </section>;
}
