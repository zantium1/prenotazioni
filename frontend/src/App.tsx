import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getOperator, getPlanning, supabase } from "./api";
import type { Assignment, Operator, Reservation, Room } from "./api";

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
    </section>{error && <p role="alert" className="error">{error}</p>}
  </main>;
}
