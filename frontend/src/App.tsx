import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { getOperator, getPlanning, supabase } from "./api";
import type { Assignment, Operator, Reservation, Room, RoomType } from "./api";
import PlanningPage from "./pages/PlanningPage";
import RoomsPage from "./pages/RoomsPage";
import BookingsPage from "./pages/BookingsPage";
import VersionLabel from "./components/VersionLabel";
type Page = "planning" | "rooms" | "bookings";
const today = new Date().toLocaleDateString("en-CA");
export default function App(){
 const [session,setSession]=useState<Session|null>(null);
 const [operator,setOperator]=useState<Operator|null>(null);
 const [email,setEmail]=useState("zantium@tiscali.it"),[password,setPassword]=useState("");
 const [page,setPage]=useState<Page>("planning"),[start,setStart]=useState(today);
 const [rooms,setRooms]=useState<Room[]>([]),[types,setTypes]=useState<RoomType[]>([]);
 const [reservations,setReservations]=useState<Reservation[]>([]),[assignments,setAssignments]=useState<Assignment[]>([]);
 const [loading,setLoading]=useState(true),[error,setError]=useState("");
 async function refresh(){
   const p=await getPlanning();
   setRooms(p.rooms);setTypes(p.roomTypes);setReservations(p.reservations);setAssignments(p.assignments);
 }
 useEffect(()=>{
   void supabase.auth.getSession().then(({data})=>setSession(data.session));
   const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,value)=>setSession(value));
   return ()=>subscription.unsubscribe();
 },[]);
 useEffect(()=>{
   if(!session){setOperator(null);setLoading(false);return;}
   let mounted=true;setLoading(true);
   getOperator(session.user.id).then(async profile=>{
     if(!mounted)return;
     setOperator(profile);
     const p=await getPlanning();
     if(mounted){setRooms(p.rooms);setTypes(p.roomTypes);setReservations(p.reservations);setAssignments(p.assignments);setError("");}
   }).catch(e=>{if(mounted){setError(e instanceof Error?e.message:String(e));setOperator(null);}})
   .finally(()=>{if(mounted)setLoading(false);});
   return ()=>{mounted=false;};
 },[session?.access_token]);
 async function login(e:FormEvent){e.preventDefault();setLoading(true);setError("");
   const {error:err}=await supabase.auth.signInWithPassword({email,password});
   if(err)setError(err.message);
   setLoading(false);
 }
 if(!session)return <main className="login"><VersionLabel/><h1>Gestionale alberghiero</h1><form onSubmit={login}><h2>Accesso operatori</h2><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button disabled={loading}>Accedi</button>{error&&<p role="alert" className="error">{error}</p>}</form></main>;
 if(!operator)return <main className="login"><h1>Gestionale alberghiero</h1><p>{loading?"Caricamento…":error||"Utente non autorizzato"}</p><button onClick={()=>void supabase.auth.signOut()}>Esci</button></main>;
 return <main className="dashboard"><VersionLabel/><header><div><h1>Gestionale prenotazioni</h1><p>{operator.email} · {operator.role}</p></div><button className="secondary" onClick={()=>void supabase.auth.signOut()}>Esci</button></header>
 <nav className="main-nav" aria-label="Menu principale">
   <button className={page==="planning"?"selected":"secondary"} onClick={()=>setPage("planning")}>Planning</button>
   {operator.role!=="housekeeping"&&<button className={page==="bookings"?"selected":"secondary"} onClick={()=>setPage("bookings")}>Prenotazioni</button>}
   {operator.role==="admin"&&<button className={page==="rooms"?"selected":"secondary"} onClick={()=>setPage("rooms")}>Anagrafica camere</button>}
 </nav>
 {loading?<p>Caricamento…</p>:<>
 {page==="planning"&&<PlanningPage rooms={rooms} reservations={reservations} assignments={assignments} start={start} setStart={setStart}/>}
 {page==="rooms"&&operator.role==="admin"&&<RoomsPage rooms={rooms} types={types} onSaved={refresh}/>}
 {page==="bookings"&&operator.role!=="housekeeping"&&<BookingsPage rooms={rooms} reservations={reservations} onSaved={refresh}/>}
 </>}
 {error&&<p className="error" role="alert">{error}</p>}
 </main>;
}
