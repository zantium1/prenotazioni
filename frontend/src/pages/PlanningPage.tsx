import type { Assignment,Reservation,Room } from "../api";
function addDays(day:string,count:number){const d=new Date(day+"T12:00:00Z");d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
export default function PlanningPage({rooms,reservations,assignments,start,setStart}:{rooms:Room[];reservations:Reservation[];assignments:Assignment[];start:string;setStart:(s:string)=>void}){
 const days=Array.from({length:7},(_,i)=>addDays(start,i));
 return <><section className="metrics"><article><strong>{rooms.filter(r=>r.active).length}</strong><span>Camere attive</span></article><article><strong>{reservations.filter(r=>!["cancelled","no_show"].includes(r.status)).length}</strong><span>Prenotazioni</span></article></section>
 <section><div className="toolbar"><h2>Planning settimanale</h2><label>Dal giorno<input type="date" value={start} onChange={e=>setStart(e.target.value)}/></label></div>
 <div className="table-scroll"><table><thead><tr><th>Camera</th>{days.map(d=><th key={d}>{d.slice(5)}</th>)}</tr></thead><tbody>{rooms.filter(r=>r.active).map(r=><tr key={r.id}><th>{r.number}</th>{days.map(d=>{const a=assignments.find(a=>a.room_id===r.id&&a.status==="active"&&a.arrival<=d&&a.departure>d);return <td key={d} title={a?reservations.find(b=>b.id===a.reservation_id)?.code:"Libera"} className={a?"occupied":""}>{a?"Occupata":"—"}</td>;})}</tr>)}</tbody></table></div>{!rooms.length&&<p>Nessuna camera configurata.</p>}</section></>;
}
