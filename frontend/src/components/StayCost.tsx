import type { Assignment, DailyService, Reservation, Room, RoomType, ServicePrice, Season, SeasonPeriod, SeasonOverride, SeasonRate, SeasonBeachRate, SeasonRoomPrice, SeasonMealPrice, SeasonGuestSupplement } from "../api";
import { datesBetween } from "./DailyServicesEditor";
const euro = (v:number)=>new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR"}).format(v);
export function calculateStay(booking:Reservation,rooms:Room[],types:RoomType[],assignments:Assignment[],daily:DailyService[],prices:ServicePrice[],seasonData?:{seasons:Season[];periods:SeasonPeriod[];overrides:SeasonOverride[];rates:SeasonRate[];beach:SeasonBeachRate[];roomPrices:SeasonRoomPrice[];mealPrices:SeasonMealPrice[];supplements:SeasonGuestSupplement[]}){
 const assigned=assignments.filter(a=>a.reservation_id===booking.id&&a.status==="active");
 const days=datesBetween(booking.arrival,booking.departure);
 const rate=(day:string)=>{const a=assigned.find(a=>a.arrival<=day&&a.departure>day);const room=rooms.find(r=>r.id===a?.room_id);return Number(types.find(t=>t.id===room?.room_type_id)?.base_rate??0);};
 const price=(code:string)=>Number(prices.find(p=>p.code===code)?.price??0);
 const rows=days.map(day=>{
  const s=daily.find(x=>x.reservation_id===booking.id&&x.service_date===day);
  let room=rate(day);
  let meal=s?.meal_plan==="half_board"?price("half_board"):s?.meal_plan==="full_board"?price("full_board"):0;
  let beach=s?.beach_use==="full_day"?price("beach_full_day"):s?.beach_use==="morning"||s?.beach_use==="afternoon"?price("beach_half_day"):0;
  const md=day.slice(5),year=Number(day.slice(0,4));
  const override=seasonData?.overrides.filter(o=>o.month_day===md&&(o.year===null||o.year===year)).sort((a,b)=>Number(b.year!==null)-Number(a.year!==null))[0];
  const seasonId=override?.season_id??seasonData?.periods.find(p=>p.start_md<=md&&p.end_md>=md)?.season_id;
  const seasonName=seasonData?.seasons.find(x=>x.id===seasonId)?.name??"—";
  const assignedRoom=assigned.find(a=>a.arrival<=day&&a.departure>day);
  const roomTypeId=rooms.find(r=>r.id===assignedRoom?.room_id)?.room_type_id;
  const mealPlan=s?.meal_plan??"room_only";
  const counts:[string,number][]=[["adult",booking.adults_count],["child_0_6",booking.children_0_6_count],["child_7_12",booking.children_7_12_count]];
  const relevant=counts.filter(([,n])=>n>0);
  const roomRate=seasonData?.roomPrices.find(r=>r.season_id===seasonId&&r.room_type_id===roomTypeId);
  if(roomRate)room=Number(roomRate.price);
  const missingGroups=relevant.filter(([group])=>!seasonData?.supplements.some(r=>r.season_id===seasonId&&r.guest_group===group)).map(([group])=>group);
  const supplements=relevant.reduce((sum,[group,count])=>sum+count*Number(seasonData?.supplements.find(r=>r.season_id===seasonId&&r.guest_group===group)?.price??0),0);
  room+=supplements;
  const mealRates=mealPlan==="room_only"?[]:relevant.map(([group,count])=>({count,rate:seasonData?.mealPrices.find(r=>r.season_id===seasonId&&r.guest_group===group&&r.meal_plan===mealPlan)}));
  const mealReady=mealPlan==="room_only"||mealRates.every(r=>r.rate!==undefined);
  if(mealPlan!=="room_only"&&mealReady)meal=mealRates.reduce((sum,x)=>sum+x.count*Number(x.rate?.price??0),0);
  const seasonReady=Boolean(roomRate&&mealReady&&missingGroups.length===0);
  const beachCode=s?.beach_use==="full_day"?"full_day":s?.beach_use==="morning"||s?.beach_use==="afternoon"?"half_day":null;
  if(beachCode&&seasonId){const bp=seasonData?.beach.find(b=>b.season_id===seasonId&&b.beach_use===beachCode);if(bp)beach=Number(bp.price);}
  return {day,room,meal,beach,total:room+meal+beach,seasonName,seasonReady,missingGroups};
 });
 return {rows,roomTotal:rows.reduce((n,r)=>n+r.room,0),mealTotal:rows.reduce((n,r)=>n+r.meal,0),beachTotal:rows.reduce((n,r)=>n+r.beach,0),total:rows.reduce((n,r)=>n+r.total,0)};
}
export default function StayCost({booking,rooms,types,assignments,daily,prices,seasonData}:{booking:Reservation;rooms:Room[];types:RoomType[];assignments:Assignment[];daily:DailyService[];prices:ServicePrice[];seasonData?:{seasons:Season[];periods:SeasonPeriod[];overrides:SeasonOverride[];rates:SeasonRate[];beach:SeasonBeachRate[];roomPrices:SeasonRoomPrice[];mealPrices:SeasonMealPrice[];supplements:SeasonGuestSupplement[]}}){
 const c=calculateStay(booking,rooms,types,assignments,daily,prices,seasonData);
 return <section className="stay-cost"><h3>Preventivo soggiorno</h3><p>Ospiti: {booking.adults_count} adulti, {booking.children_0_6_count} bambini 0–6, {booking.children_7_12_count} bambini 7–12.</p><p>Calcolo automatico: una notte per ciascuna data dal giorno di arrivo al giorno precedente la partenza. I servizi si addebitano soltanto nei giorni in cui sono impostati.</p>
 <div className="table-scroll"><table><thead><tr><th>Giorno</th><th>Stagione</th><th>Camera / trattamento</th><th>Trattamento</th><th>Spiaggia</th><th>Totale</th></tr></thead><tbody>{c.rows.map(r=><tr key={r.day}><td>{r.day.slice(8)}/{r.day.slice(5,7)}</td><td>{r.seasonName}{!r.seasonReady?" *":""}</td><td>{euro(r.room)}</td><td>{euro(r.meal)}</td><td>{euro(r.beach)}</td><td><strong>{euro(r.total)}</strong></td></tr>)}</tbody></table></div>
 {c.rows.some(r=>r.missingGroups.length>0)&&<p className="error" role="alert">Attenzione: supplementi per ospite non impostati per alcune giornate o fasce d’età. Il totale è provvisorio e non comprende queste quote. Inserisci i prezzi nel Listino prezzi → Supplementi pernottamento, anche 0 € se la fascia è gratuita.</p>}
 <div className="cost-summary"><span>Camere: {euro(c.roomTotal)}</span><span>Trattamento: {euro(c.mealTotal)}</span><span>Spiaggia: {euro(c.beachTotal)}</span><strong>Totale soggiorno: {euro(c.total)}</strong></div>
 <p className="cost-note">* Quando una tariffa stagionale per camera o trattamento non è impostata, si usa il relativo prezzo generale. Camera e trattamento sono voci separate. Prima bozza: importi calcolati sui listini attuali, senza sconti, acconti o tariffe storicizzate. Non costituisce ancora un conto definitivo.</p>
 </section>;
}
