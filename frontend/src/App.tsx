import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getOperator, getPlanning, saveRoom, supabase } from "./api";
import type { Assignment, Operator, Reservation, Room, RoomType } from "./api";

function addDays(day: string, count: number): string {
  const d = new Date(day + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + count);
  return d.toISOString().slice(0, 10);
}
const today = new Date().toLocaleDateString("en-CA");
export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [email, setEmail] = useState("zantium@tiscali.it");
  const [password, setPassword] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [start, setStart] = useState(today);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, value) => setSession(value));
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!session) { setOperator(null); setRooms([]); setReservations([]); setAssignments([]); return; }
    let active = true;
    setLoading(true);
    getOperator(session.user.id).then(async profile => {
      if (!active) return;
      setOperator(profile);
      const planning = await getPlanning();
      if (active) {
        setRooms(planning.rooms);
        setRoomTypes(planning.roomTypes);
        setReservations(planning.reservations);
        setAssignments(planning.assignments);
        setError("");
      }
    }).catch(e => { if (active) { setOperator(null); setError(String(e.message)); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [session?.access_token]);
  async function login(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) setError(authError.message);
    setLoading(false);
  }
  if (!session) return <main className="login"><h1>Gestionale alberghiero</h1><form onSubmit={login}>
    <h2>Accesso operatori</h2>
    <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
    <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
    <button disabled={loading}>{loading ? "Accesso…" : "Accedi"}</button>{error && <p role="alert" className="error">{error}</p>}
  </form></main>;
  if (!operator) return <main className="login"><h1>Gestionale alberghiero</h1><p>{loading ? "Verifica autorizzazione…" : error || "Accesso non autorizzato."}</p><button onClick={() => void supabase.auth.signOut()}>Esci</button></main>;
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const activeBookings = reservations.filter(r => !["cancelled", "no_show"].includes(r.status));
  return <main className="dashboard">
    <header><div><h1>Prenotazioni</h1><p>Planning settimanale · {operator.email} · {operator.role}</p></div>
      <button className="secondary" onClick={() => void supabase.auth.signOut()}>Esci</button></header>
    <section className="metrics"><article><strong>{rooms.length}</strong><span>Camere</span></article>
      <article><strong>{activeBookings.length}</strong><span>Prenotazioni nell'elenco</span></article></section>
    <section><div className="toolbar"><h2>Calendario camere</h2>
      <label>Dal giorno <input type="date" value={start} onChange={e => setStart(e.target.value)} /></label></div>
      {loading ? <p>Caricamento…</p> : <div className="table-scroll"><table><thead><tr><th>Camera</th>{days.map(day => <th key={day}>{day.slice(5)}</th>)}</tr></thead>
      <tbody>{rooms.map(room => <tr key={room.id}><th>{room.number}</th>{days.map(day => {
        const booking = assignments.find(a => a.room_id === room.id && a.status === "active" && a.arrival <= day && a.departure > day);
        return <td key={day} title={booking ? "Prenotazione " + (reservations.find(r => r.id === booking.reservation_id)?.code || booking.reservation_id) : "Libera"}>{booking ? "●" : "—"}</td>;
      })}</tr>)}</tbody></table></div>}
      {!rooms.length && !loading && <p>Nessuna camera configurata. Il collegamento al database è attivo se non compaiono errori.</p>}
      <p className="hint">Prima versione di prova: consultazione planning. Inserimento e modifica prenotazioni saranno aggiunti dopo il collaudo.</p>
    </section>{operator.role === 'admin' && <RoomSettings rooms={rooms} types={roomTypes} onSaved={async () => { const p = await getPlanning(); setRooms(p.rooms); setRoomTypes(p.roomTypes); }} />}{error && <p role="alert" className="error">{error}</p>}
  </main>;
}

function RoomSettings({ rooms, types, onSaved }: { rooms: Room[]; types: RoomType[]; onSaved: () => Promise<void> }) {
  const [id, setId] = useState<number | undefined>();
  const [number, setNumber] = useState("");
  const [typeId, setTypeId] = useState(0);
  const [beds, setBeds] = useState(1);
  const [active, setActive] = useState(true);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  function select(room?: Room) {
    setId(room?.id); setNumber(room?.number ?? "");
    setTypeId(room?.room_type_id ?? 0); setBeds(room?.bed_count ?? 1);
    setActive(room?.active ?? true); setMessage("");
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (rooms.some(r => r.number === number.trim() && r.id !== id)) { setMessage("Numero camera già esistente."); return; }
    setBusy(true); setMessage("");
    try {
      await saveRoom({ ...(id ? { id } : {}), number: number.trim(), room_type_id: typeId, bed_count: beds, active });
      await onSaved(); select(); setMessage("Camera salvata.");
    } catch (e) { setMessage(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }
  return <section><h2>Configurazione camere</h2>
    <p>Gestisci numeri, tipologie e letti. Disattivando una camera conservi lo storico.</p>
    <div className="table-scroll"><table><thead><tr><th>Camera</th><th>Tipologia</th><th>Letti</th><th>Stato</th><th>Azione</th></tr></thead><tbody>
      {rooms.map(room => <tr key={room.id}><td>{room.number}</td><td>{types.find(t => t.id === room.room_type_id)?.name ?? "—"}</td><td>{room.bed_count}</td><td>{room.active ? "Attiva" : "Non attiva"}</td><td><button type="button" className="secondary" onClick={() => select(room)}>Modifica</button></td></tr>)}
    </tbody></table></div>
    <h3>{id ? "Modifica camera" : "Aggiungi camera"}</h3>
    <form className="room-form" onSubmit={submit}>
      <label>Numero<input required value={number} onChange={e => setNumber(e.target.value)} placeholder="Es. 206" /></label>
      <label>Tipologia<select required value={typeId} onChange={e => setTypeId(Number(e.target.value))}><option value={0}>Seleziona</option>{types.map(t => <option key={t.id} value={t.id}>{t.name} ({t.capacity} ospiti)</option>)}</select></label>
      <label>Numero letti<input required type="number" min={1} max={20} value={beds} onChange={e => setBeds(Number(e.target.value))} /></label>
      <label className="check"><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Camera attiva</label>
      <button disabled={busy || !typeId}>{busy ? "Salvataggio…" : id ? "Salva modifiche" : "Aggiungi camera"}</button>
      {id && <button type="button" className="secondary" onClick={() => select()}>Annulla</button>}
    </form>{message && <p role="status">{message}</p>}
  </section>;
}
