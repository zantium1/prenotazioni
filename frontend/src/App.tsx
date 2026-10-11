import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { api, supabase } from "./api";
import type { Room, Reservation } from "./api";

function addDays(day: string, count: number): string {
  const d = new Date(day + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + count);
  return d.toISOString().slice(0, 10);
}
const today = new Date().toISOString().slice(0, 10);

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [start, setStart] = useState(today);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, value) => setSession(value));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setRooms([]); setReservations([]); return; }
    let active = true;
    setLoading(true);
    Promise.all([api<Room[]>("/rooms"), api<Reservation[]>("/reservations")])
      .then(([r, b]) => { if (active) { setRooms(r); setReservations(b); setError(""); } })
      .catch(e => { if (active) setError(String(e.message)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [session?.access_token]);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
  }

  if (!session) return <main className="login"><h1>Gestionale alberghiero</h1><form onSubmit={login}>
    <h2>Accesso operatori</h2>
    <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
    <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
    <button>Accedi</button>{error && <p role="alert" className="error">{error}</p>}
  </form></main>;

  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const activeBookings = reservations.filter(r => !["cancelled", "no_show"].includes(r.status));
  // API reservations must expose room_id assignments before we can display actual occupancy.
  return <main className="dashboard">
    <header><div><h1>Prenotazioni</h1><p>Planning settimanale · dati dal database</p></div>
      <button className="secondary" onClick={() => void supabase.auth.signOut()}>Esci</button></header>
    <section className="metrics"><article><strong>{rooms.length}</strong><span>Camere</span></article>
      <article><strong>{activeBookings.length}</strong><span>Prenotazioni attive nell'elenco</span></article></section>
    <section><div className="toolbar"><h2>Calendario camere</h2>
      <label>Dal giorno <input type="date" value={start} onChange={e => setStart(e.target.value)} /></label></div>
      {loading ? <p>Caricamento…</p> : <div className="table-scroll"><table><thead><tr><th>Camera</th>{days.map(day => <th key={day}>{day.slice(5)}</th>)}</tr></thead>
      <tbody>{rooms.map(room => <tr key={room.id}><th>{room.number}</th>{days.map(day => <td key={day} title="Occupazione non ancora collegata">—</td>)}</tr>)}</tbody></table></div>}
      {!rooms.length && !loading && <p>Nessuna camera configurata.</p>}
      <p className="hint">La griglia è una base grafica: le assegnazioni camera/prenotazione saranno collegate nel prossimo passaggio.</p>
    </section>{error && <p role="alert" className="error">{error}</p>}
  </main>;
}
