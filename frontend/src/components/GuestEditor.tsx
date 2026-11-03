import { useEffect, useState } from "react";
import { supabase } from "../api";
import type { Reservation } from "../api";
import IdentityScanner from "./IdentityScanner";
export default function GuestEditor({booking,onSaved}:{booking:Reservation;onSaved:()=>Promise<void>}){
 const [editing,setEditing]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const [first,setFirst]=useState(""),[last,setLast]=useState(""),[birth,setBirth]=useState(""),[cf,setCF]=useState("");
 useEffect(()=>{setFirst(booking.guest?.first_name??"");setLast(booking.guest?.last_name??"");setBirth(booking.guest?.birth_date??"");setCF(booking.guest?.tax_code??"");setEditing(false);setMessage("");},[booking.id,booking.guest?.first_name,booking.guest?.last_name,booking.guest?.birth_date,booking.guest?.tax_code]);
 async function save(){setBusy(true);setMessage("");try{
  const {error}=await supabase.rpc("update_hotel_guest",{p_guest_id:booking.lead_guest_id,p_first_name:first,p_last_name:last,p_birth_date:birth||null,p_tax_code:cf.trim().toUpperCase()});
  if(error)throw error;
  await onSaved();setEditing(false);setMessage("Dati ospite aggiornati.");
 }catch(e){setMessage(e instanceof Error?e.message:String(e));}finally{setBusy(false);}}
 return <div className="guest-editor">
  <div className="toolbar"><h3>Anagrafica ospite</h3>{!editing&&<button type="button" className="secondary" onClick={()=>setEditing(true)}>✎ Modifica dati ospite</button>}</div>
  {!editing?<><p><strong>Nome e cognome:</strong> {first} {last}</p><p><strong>Data di nascita:</strong> {birth||"—"} · <strong>Codice fiscale:</strong> {cf||"—"}</p></>:
  <div className="booking-form"><label>Nome<input required maxLength={100} value={first} onChange={e=>setFirst(e.target.value)}/></label>
  <label>Cognome<input required maxLength={100} value={last} onChange={e=>setLast(e.target.value)}/></label>
  <label>Data di nascita<input type="date" value={birth} onChange={e=>setBirth(e.target.value)}/></label>
  <label>Codice fiscale<input maxLength={16} value={cf} onChange={e=>setCF(e.target.value.toUpperCase())}/></label>
  <div className="full-width"><IdentityScanner onMRZ={m=>{setFirst(m.first);setLast(m.last);setBirth(m.birth);}} onCF={setCF}/></div>
  <div className="actions full-width"><button type="button" className="secondary" onClick={()=>setEditing(false)}>Annulla</button><button type="button" disabled={busy||!first.trim()||!last.trim()} onClick={()=>void save()}>{busy?"Salvataggio…":"Salva dati ospite"}</button></div></div>}
  {message&&<p role="status">{message}</p>}
 </div>;
}
