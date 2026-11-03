import { useEffect,useState } from "react";
import { supabase } from "../api";
import type { Reservation } from "../api";
export default function OccupancyEditor({booking,onSaved}:{booking:Reservation;onSaved:()=>Promise<void>}){
 const [adults,setAdults]=useState(booking.adults_count),[children,setChildren]=useState(booking.children_count),[editing,setEditing]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 useEffect(()=>{setAdults(booking.adults_count);setChildren(booking.children_count);},[booking.id,booking.adults_count,booking.children_count]);
 async function save(){setBusy(true);setMessage("");try{const {error}=await supabase.rpc("update_reservation_occupancy",{p_reservation_id:booking.id,p_adults_count:adults,p_children_count:children});if(error)throw error;await onSaved();setEditing(false);setMessage("Numero ospiti aggiornato.");}catch(e){setMessage(e instanceof Error?e.message:String(e));}finally{setBusy(false);}}
 return <div className="guest-editor"><div className="toolbar"><h3>Occupanti della camera</h3>{!editing&&<button className="secondary" type="button" onClick={()=>setEditing(true)}>Modifica occupanti</button>}</div>
 {!editing?<p><strong>Adulti:</strong> {adults} · <strong>Bambini:</strong> {children}</p>:<div className="booking-form"><label>Ospiti adulti<input type="number" min={1} max={30} step={1} required value={adults} onChange={e=>setAdults(Number(e.target.value))}/></label><label>Ospiti bambini<input type="number" min={0} max={30} step={1} required value={children} onChange={e=>setChildren(Number(e.target.value))}/></label><div className="actions full-width"><button type="button" className="secondary" onClick={()=>setEditing(false)}>Annulla</button><button type="button" disabled={busy||!Number.isInteger(adults)||adults<1||!Number.isInteger(children)||children<0} onClick={()=>void save()}>Salva occupanti</button></div></div>}
 {message&&<p role="status">{message}</p>}</div>;
}