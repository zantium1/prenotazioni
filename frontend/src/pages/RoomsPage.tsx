import { useState } from "react";
import type { FormEvent } from "react";
import { saveRoom } from "../api";
import type { Room, RoomType } from "../api";
export default function RoomsPage({rooms,types,onSaved}:{rooms:Room[];types:RoomType[];onSaved:()=>Promise<void>}) {
 const [editing,setEditing]=useState<Room|null|undefined>(undefined);
 const [number,setNumber]=useState(""); const [typeId,setTypeId]=useState(0);
 const [beds,setBeds]=useState(1); const [active,setActive]=useState(true);
 const [busy,setBusy]=useState(false); const [message,setMessage]=useState("");
 function open(room:Room|null){setEditing(room);setNumber(room?.number??"");setTypeId(room?.room_type_id??0);setBeds(room?.bed_count??1);setActive(room?.active??true);setMessage("");}
 async function submit(e:FormEvent){e.preventDefault();if(rooms.some(r=>r.number===number.trim()&&r.id!==editing?.id)){setMessage("Numero camera già presente");return;}
 setBusy(true);setMessage("");try{await saveRoom({...(editing ? {id:editing.id} : {}),number:number.trim(),room_type_id:typeId,bed_count:beds,active});await onSaved();setEditing(undefined);}catch(e){setMessage(e instanceof Error?e.message:String(e));}finally{setBusy(false);}}
 return <section><div className="toolbar"><div><h2>Anagrafica camere</h2><p>Numerazione, tipologia e letti delle camere.</p></div><button onClick={()=>open(null)}>+ Nuova camera</button></div>
 <div className="table-scroll"><table><thead><tr><th>Camera</th><th>Tipologia</th><th>Letti</th><th>Stato</th><th></th></tr></thead><tbody>{rooms.map(r=><tr key={r.id}><td>{r.number}</td><td>{types.find(t=>t.id===r.room_type_id)?.name??"—"}</td><td>{r.bed_count}</td><td>{r.active?"Attiva":"Disattivata"}</td><td><button className="secondary" onClick={()=>open(r)}>Modifica</button></td></tr>)}</tbody></table></div>
 {editing!==undefined&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setEditing(undefined);}}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="room-modal-title"><div className="toolbar"><h2 id="room-modal-title">{editing?"Modifica camera":"Nuova camera"}</h2><button className="secondary" onClick={()=>setEditing(undefined)} aria-label="Chiudi">✕</button></div>
 <form onSubmit={submit}><label>Numero camera<input autoFocus required value={number} onChange={e=>setNumber(e.target.value)} /></label><label>Tipologia<select required value={typeId} onChange={e=>setTypeId(Number(e.target.value))}><option value={0}>Seleziona</option>{types.map(t=><option key={t.id} value={t.id}>{t.name} ({t.capacity} ospiti)</option>)}</select></label><label>Numero letti<input required type="number" min={1} max={20} value={beds} onChange={e=>setBeds(Number(e.target.value))}/></label><label className="check"><input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)}/> Camera attiva</label>{message&&<p role="alert" className="error">{message}</p>}<div className="actions"><button type="button" className="secondary" onClick={()=>setEditing(undefined)}>Annulla</button><button disabled={busy||!typeId}>{busy?"Salvataggio…":"Salva"}</button></div></form></div></div>}
 </section>;
}
