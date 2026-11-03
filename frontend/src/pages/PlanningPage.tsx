import { useState } from "react";
import DailyServicesEditor from "../components/DailyServicesEditor";
import StayCost from "../components/StayCost";
import GuestEditor from "../components/GuestEditor";
import type { Assignment, DailyService, RoomType, ServicePrice, Reservation, Room } from "../api";

function addDays(day: string, count: number) {
  const d = new Date(day + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + count);
  return d.toISOString().slice(0, 10);
}
function guestName(booking: Reservation | undefined) {
  return booking?.guest ? `${booking.guest.first_name} ${booking.guest.last_name}` : "Ospite";
}
export default function PlanningPage({ rooms, reservations, assignments, dailyServices, types, prices, onSaved, start, setStart }: {
  rooms: Room[]; reservations: Reservation[]; assignments: Assignment[]; dailyServices: DailyService[]; types: RoomType[]; prices: ServicePrice[]; onSaved: () => Promise<void>;
  start: string; setStart: (s: string) => void;
}) {
  const [selected, setSelected] = useState<Reservation | null>(null);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const bookings = new Map(reservations.map(r => [r.id, r]));
  return <>
    <section className="metrics">
      <article><strong>{rooms.filter(r => r.active).length}</strong><span>Camere attive</span></article>
      <article><strong>{reservations.filter(r => !["cancelled", "no_show"].includes(r.status)).length}</strong><span>Prenotazioni</span></article>
    </section>
    <section>
      <div className="toolbar"><div><h2>Planning settimanale</h2><p className="planning-hint">Nome dell'ospite nelle giornate occupate. Seleziona una prenotazione per i dettagli.</p></div>
        <label>Dal giorno<input type="date" value={start} onChange={e => setStart(e.target.value)} /></label>
      </div>
      <div className="planning-legend" aria-label="Legenda planning"><span>🍽️ Solo pernottamento: nessuna sigla</span><span>🍽️ MP Mezza pensione</span><span>🍽️ PC Pensione completa</span><span>🏖️½ Mattina</span><span>🌤️½ Pomeriggio</span><span>🏖️ Giornata intera</span></div>
      <div className="table-scroll">
        <table className="planning-table">
          <thead><tr><th>Camera</th>{days.map(d => <th key={d}>{d.slice(8, 10)}/{d.slice(5, 7)}</th>)}</tr></thead>
          <tbody>{rooms.filter(r => r.active).map(room => <tr key={room.id}>
            <th>{room.number}</th>
            {days.map(day => {
              const assignment = assignments.find(a => a.room_id === room.id && a.status === "active" && a.arrival <= day && a.departure > day);
              const booking = assignment ? bookings.get(assignment.reservation_id) : undefined;
              const name = guestName(booking);
              const service = booking ? dailyServices.find(s => s.reservation_id === booking.id && s.service_date === day) : undefined;
              return <td key={day} className={assignment ? "occupied" : "free-cell"}>
                {assignment ? <button type="button" className="planning-booking" disabled={!booking}
                  title={booking ? `selected · ${booking.arrival} → ${booking.departure} · ${booking.code}` : "Camera occupata"}
                  onClick={() => booking && setSelected(booking)}>
                  <span className="planning-guest">{name}</span>
                  <span className="planning-icons">{service?.meal_plan === "half_board" ? "🍽️ MP" : service?.meal_plan === "full_board" ? "🍽️ PC" : ""}{service?.beach_use === "morning" ? " 🏖️½" : service?.beach_use === "afternoon" ? " 🌤️½" : service?.beach_use === "full_day" ? " 🏖️" : ""}</span>
                  <span className="planning-sub">{assignment.arrival === day ? "Arrivo" : assignment.departure === addDays(day, 1) ? "Partenza domani" : "Soggiorno"}</span>
                </button> : <span aria-label="Libera">—</span>}
              </td>;
            })}
          </tr>)}</tbody>
        </table>
      </div>
      {!rooms.length && <p>Nessuna camera configurata.</p>}
    </section>
    {selected && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setSelected(null); }}>
      <div className="modal booking-detail" role="dialog" aria-modal="true" aria-labelledby="planning-detail-title">
        <div className="toolbar"><h2 id="planning-detail-title">Prenotazione {selected.code}</h2><button className="secondary" onClick={() => setSelected(null)} aria-label="Chiudi">✕</button></div>
        <p><strong>Ospite:</strong> {guestName(selected)}</p>
        <GuestEditor booking={selected} onSaved={onSaved}/>
        <p><strong>Arrivo:</strong> {selected.arrival}</p>
        <p><strong>Partenza:</strong> {selected.departure}</p>
        <p><strong>Stato:</strong> {selected.status}</p>
        <p><strong>Totale:</strong> € {selected.total}</p>
        <DailyServicesEditor booking={selected} services={dailyServices} onSaved={onSaved}/>
        <StayCost booking={selected} rooms={rooms} types={types} assignments={assignments} daily={dailyServices} prices={prices}/>
        <label>Email originale<textarea readOnly rows={8} value={selected.original_email ?? ""} placeholder="Nessuna email salvata." /></label>
        <div className="actions"><button onClick={() => setSelected(null)}>Chiudi</button></div>
      </div>
    </div>}
  </>;
}
