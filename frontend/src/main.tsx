import React from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

function App() {
  return <main><h1>Gestionale alberghiero</h1><p>Progetto Prenotazioni — prima versione in sviluppo.</p><section><h2>Moduli previsti</h2><ul><li>Planning camere</li><li>Prenotazioni</li><li>Clienti</li><li>Pagamenti</li></ul></section><p>Interfaccia dimostrativa: nessun dato reale è ancora collegato.</p></main>;
}

createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);
