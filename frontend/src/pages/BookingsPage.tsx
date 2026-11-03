import { useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../api";
import DailyServicesEditor from "../components/DailyServicesEditor";
import type { Room, Reservation, Assignment, DailyService } from "../api";

export default function BookingsPage({ rooms, reservations, assignments, dailyServices, onSaved }: { rooms: Room[]; reservations: Reservation[]; assignments: Assignment[]; dailyServices: DailyService[]; onSaved: () => Promise<void> }) {
  const [room, setRoom] = useState(0);
  const [arrival, setArrival] = useState("");
  const [departure, setDeparture] = useState("");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [total, setTotal] = useState("0");
  const [originalEmail, setOriginalEmail] = useState("");
  const [detail, setDetail] = useState<Reservation | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    if (!room || !arrival || !departure || departure <= arrival) { setMessage("Controlla camera e date."); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("create_hotel_reservation", {
        p_room_id: room, p_arrival: arrival, p_departure: departure,
        p_first_name: first, p_last_name: last, p_total: Number(total),
        p_original_email: originalEmail
      });
      if (error) throw error;
      await onSaved();
      setMessage("Prenotazione creata: " + data);
      setFirst(""); setLast(""); setOriginalEmail("");
    } catch (e) { setMessage(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }
  function guestName(r: Reservation) {
    return r.guest ? r.guest.first_name + " " + r.guest.last_name : "—";
  }
  function roomNumber(r: Reservation) {
    const assignment = assignments.find(a => a.reservation_id === r.id && a.status === "active");
    return rooms.find(x => x.id === assignment?.room_id)?.number ?? "—";
  }
  return <>
    <section>
      <h2>Nuova prenotazione</h2>
      <p>Puoi incollare il testo originale della richiesta ricevuta via email. Verrà conservato insieme alla prenotazione, senza modificare automaticamente i dati inseriti.</p>
      <form onSubmit={submit} className="booking-form">
        <label>Camera<select required value={room} onChange={e => setRoom(Number(e.target.value))}><option value={0}>Seleziona camera</option>{rooms.filter(r => r.active).map(r => <option key={r.id} value={r.id}>{r.number}</option>)}</select></label>
        <label>Arrivo<input required type="date" value={arrival} onChange={e => setArrival(e.target.value)} /></label>
        <label>Partenza<input required type="date" min={arrival || undefined} value={departure} onChange={e => setDeparture(e.target.value)} /></label>
        <label>Nome ospite<input required maxLength={100} value={first} onChange={e => setFirst(e.target.value)} /></label>
        <label>Cognome ospite<input required maxLength={100} value={last} onChange={e => setLast(e.target.value)} /></label>
        <label>Totale previsto (€)<input required type="number" min={0} step="0.01" value={total} onChange={e => setTotal(e.target.value)} /></label>
        <label className="full-width">Testo originale dell'email<textarea rows={7} maxLength={50000} placeholder="Incolla qui il testo della mail del cliente…" value={originalEmail} onChange={e => setOriginalEmail(e.target.value)} /></label>
        <button disabled={busy || !room}>{busy ? "Salvataggio…" : "Conferma prenotazione"}</button>
      </form>
      {message && <p role="status">{message}</p>}
    </section>
    <section>
      <h2>Prenotazioni recenti</h2>
      <div className="table-scroll"><table><thead><tr><th>Codice</th><th>Ospite</th><th>Camera</th><th>Arrivo</th><th>Partenza</th><th>Stato</th><th>Dettaglio</th></tr></thead>
        <tbody>{reservations.map(r => <tr key={r.id}><td>{r.code}</td><td>{guestName(r)}</td><td>{roomNumber(r)}</td><td>{r.arrival}</td><td>{r.departure}</td><td>{r.status}</td><td><button className="secondary" type="button" onClick={() => setDetail(r)}>Apri</button></td></tr>)}</tbody></table></div>
      {!reservations.length && <p>Non ci sono ancora prenotazioni.</p>}
    </section>
    {detail && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setDetail(null); }}>
      <div className="modal booking-detail" role="dialog" aria-modal="true" aria-labelledby="booking-detail-title">
        <div className="toolbar"><h2 id="booking-detail-title">Dettaglio prenotazione</h2><button className="secondary" onClick={() => setDetail(null)} aria-label="Chiudi">✕</button></div>
        <p><strong>Codice:</strong> {detail.code}</p>
        <p><strong>Ospite:</strong> {guestName(detail)}</p>
        <p><strong>Camera:</strong> {roomNumber(detail)}</p>
        <p><strong>Arrivo:</strong> {detail.arrival} · <strong>Partenza:</strong> {detail.departure}</p>
        <p><strong>Stato:</strong> {detail.status} · <strong>Totale:</strong> € {detail.total}</p>
        <DailyServicesEditor booking={detail} services={dailyServices} onSaved={onSaved} />
        <label>Email originale del cliente<textarea readOnly rows={12} value={detail.original_email || ""} placeholder="Nessuna email registrata per questa prenotazione." /></label>
        <div className="actions"><button onClick={() => setDetail(null)}>Chiudi</button></div>
      </div>
    </div>}
  </>;
}
