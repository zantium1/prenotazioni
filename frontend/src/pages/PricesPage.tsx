import { useEffect, useState } from "react";
import { supabase } from "../api";
import type { RoomType, ServicePrice } from "../api";
const labels:Record<string,string>={half_board:"Mezza pensione · al giorno",full_board:"Pensione completa · al giorno",beach_half_day:"Spiaggia · mezza giornata (mattina o pomeriggio)",beach_full_day:"Spiaggia · giornata intera"};
export default function PricesPage({types,prices,onSaved}:{types:RoomType[];prices:ServicePrice[];onSaved:()=>Promise<void>}){
 const [values,setValues]=useState<Record<string,string>>({});
 const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
 useEffect(()=>{const next:Record<string,string>={};for(const t of types)next["room:"+t.id]=String(t.base_rate);for(const p of prices)next["service:"+p.code]=String(p.price);setValues(next);},[types,prices]);
 async function save(){setBusy(true);setMessage("");try{
 for(const [key,value] of Object.entries(values)){
 const [kind,code]=key.split(":");const original=kind==="room"?types.find(t=>String(t.id)===code)?.base_rate:prices.find(p=>p.code===code)?.price;
 const price=Number(value);
 if(value.trim()===""||!Number.isFinite(price)||price<0||Math.round(price*100)!==price*100)throw new Error("Inserisci importi validi con massimo due decimali.");
 if(Number(original)===price)continue;
 const {error}=await supabase.rpc("update_hotel_price",{p_kind:kind,p_code:code,p_price:price});if(error)throw error;
 }
 await onSaved();setMessage("Listino salvato.");
 }catch(e){setMessage(e instanceof Error?e.message:String(e));}finally{setBusy(false);}}
 function field(key:string,label:string){return <label key={key}>{label}<div className="price-input"><input type="number" min="0" step="0.01" value={values[key]??"0"} onChange={e=>setValues(v=>({...v,[key]:e.target.value}))}/><span>€</span></div></label>;}
 return <section><h2>Listino prezzi</h2><p>Configura i prezzi unitari. La tariffa della camera è per notte; i servizi sono addebitati soltanto per le giornate selezionate nel dettaglio prenotazione.</p>
 <h3>Camere · prezzo per notte</h3><div className="price-grid">{types.map(t=>field("room:"+t.id,t.name+" · "+t.capacity+" ospiti"))}</div>
 <h3>Trattamento e spiaggia · prezzo per giornata</h3><div className="price-grid">{prices.map(p=>field("service:"+p.code,labels[p.code]??p.code))}</div>
 <div className="actions"><button disabled={busy} onClick={()=>void save()}>{busy?"Salvataggio…":"Salva listino"}</button></div>{message&&<p role="status">{message}</p>}
 <p className="cost-note">Attenzione: modificando un prezzo cambiano anche i preventivi delle prenotazioni già registrate. Il blocco delle tariffe concordate sarà una funzione successiva.</p></section>;
}
