import { useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../api";
import type { Room,Reservation } from "../api";
export default function BookingsPage({rooms,reservations,onSaved}:{rooms:Room[];reservations:Reservation[];onSaved:()=>Promise<void>}){
 const [room,setRoom]=useState(0),[arrival,setArrival]=useState(""),[departure,setDeparture]=useState("");
 const [first,setFirst]=useState(""),[last,setLast]=useState(""),[total,setTotal]=useState("0");
 const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
 async function submit(e:FormEvent){e.preventDefault();setMessage("");if(!room||!arrival||!departure||departure<=arrival){setMessage("Controlla camera e date.");return;}
 setBusy(true);try{const {data,error}=await supabase.rpc("create_hotel_reservation",{p_room_id:room,p_arrival:arrival,p_departure:departure,p_first_name:first,p_last_name:last,p_total:Number(total)});if(error)throw error;await onSaved();setMessage("Prenotazione creata: "+data);setFirst("");setLast("");}catch(e){setMessage(e instanceof Error?e.message:String(e));}finally{setBusy(false);}}
 return <><section><h2>Nuova prenotazione</h2><p>Il sistema impedisce automaticamente la doppia assegnazione della stessa camera nelle stesse date. Il giorno di partenza non è occupato.</p>
 <form onSubmit={submit} className="booking-form"><label>Camera<select required value={room} onChange={e=>setRoom(Number(e.target.value))}><option value={0}>Seleziona camera</option>{rooms.filter(r=>r.active).map(r=><option key={r.id} value={r.id}>{r.number}</option>)}</select></label>
 <label>Arrivo<input required type="date" value={arrival} onChange={e=>setArrival(e.target.value)}/></label><label>Partenza<input required type="date" min={arrival||undefined} value={departure} onChange={e=>setDeparture(e.target.value)}/></label>
 <label>Nome ospite<input required maxLength={100} value={first} onChange={e=>setFirst(e.target.value)}/></label><label>Cognome ospite<input required maxLength={100} value={last} onChange={e=>setLast(e.target.value)}/></label>
 <label>Totale previsto (€)<input required type="number" min={0} step="0.01" value={total} onChange={e=>setTotal(e.target.value)}/></label>
 <button disabled={busy||!room}>{busy?"Salvataggio…":"Conferma prenotazione"}</button></form>{message&&<p role="status">{message}</p>}</section>
 <section><h2>Prenotazioni recenti</h2><div className="table-scroll"><table><thead><tr><th>Codice</th><th>Arrivo</th><th>Partenza</th><th>Stato</th></tr></thead><tbody>{reservations.map(r=><tr key={r.id}><td>{r.code}</td><td>{r.arrival}</td><td>{r.departure}</td><td>{r.status}</td></tr>)}</tbody></table></div></section></>;
}
