import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from "@zxing/library";
import { createWorker } from "tesseract.js";
type MRZ = { first: string; last: string; birth: string };
const val=(ch:string)=>/[0-9]/.test(ch)?Number(ch):/[A-Z]/.test(ch)?ch.charCodeAt(0)-55:0;
function check(s:string,cd:string){return /^\d$/.test(cd)&&s.split("").reduce((n,ch,i)=>n+val(ch)*[7,3,1][i%3],0)%10===Number(cd);}
function norm(s:string){return s.toUpperCase().replace(/[^A-Z0-9<]/g,"");}
export function parseMRZ(raw:string):MRZ|null{
 const lines=raw.toUpperCase().split(/\n/).map(norm).filter(s=>s.length>=27&&s.includes("<"));
 for(let i=0;i<lines.length-2;i++){
  const l1=lines[i].slice(0,30),l2=lines[i+1].slice(0,30),l3=lines[i+2].slice(0,30);
  if(l1.length<30||l2.length<30||l3.length<30)continue;
  const birth=l2.slice(0,6).replace(/[OQ]/g,"0");
  if(!/^\d{6}$/.test(birth)||!check(birth,l2[6]))continue;
  const doc=l1.slice(5,14);if(/^\d$/.test(l1[14])&&!check(doc,l1[14]))continue;
  const parts=l3.split("<<");if(parts.length<2)continue;
  const last=parts[0].replace(/</g," ").replace(/\s+/g," ").trim();
  const first=parts.slice(1).join(" ").replace(/</g," ").replace(/\s+/g," ").trim();
  if(!first||!last)continue;
  const yy=Number(birth.slice(0,2)),mm=Number(birth.slice(2,4)),dd=Number(birth.slice(4,6));
  const year=(yy>new Date().getFullYear()%100?1900:2000)+yy;
  const date=new Date(Date.UTC(year,mm-1,dd));
  if(date.getUTCFullYear()!==year||date.getUTCMonth()!==mm-1||date.getUTCDate()!==dd)continue;
  return {first,last,birth:`${year}-${String(mm).padStart(2,"0")}-${String(dd).padStart(2,"0")}`};
 }
 return null;
}
export default function IdentityScanner({onMRZ,onCF}:{onMRZ:(m:MRZ)=>void;onCF:(cf:string)=>void}){
 const [mode,setMode]=useState<"mrz"|"cf"|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const video=useRef<HTMLVideoElement>(null),reader=useRef<BrowserMultiFormatReader|null>(null),file=useRef<HTMLInputElement>(null);
 function stop(){reader.current?.reset();reader.current=null;if(video.current?.srcObject){(video.current.srcObject as MediaStream).getTracks().forEach(t=>t.stop());video.current.srcObject=null;}setMode(null);}
 useEffect(()=>()=>{reader.current?.reset();if(video.current?.srcObject)(video.current.srcObject as MediaStream).getTracks().forEach(t=>t.stop());},[]);
 async function scanCF(){
  stop();setMessage("");setMode("cf");
  try{
   const hints=new Map<DecodeHintType,unknown>();hints.set(DecodeHintType.POSSIBLE_FORMATS,[BarcodeFormat.CODE_39,BarcodeFormat.CODE_128]);
   const r=new BrowserMultiFormatReader(hints,350);reader.current=r;
   await new Promise(resolve=>setTimeout(resolve,50));
   if(!video.current)throw Error("Video non disponibile");
   await r.decodeFromVideoDevice(null,video.current,(result)=>{if(result){const value=result.getText().toUpperCase().replace(/[^A-Z0-9]/g,"");if(/^[A-Z0-9]{16}$/.test(value)){onCF(value);setMessage("Codice fiscale acquisito: verifica il dato.");stop();}}});
  }catch(e){setMessage("Fotocamera non disponibile: "+String(e));stop();}
 }
 async function scanMRZ(image:File){
  setBusy(true);setMessage("Lettura MRZ in corso…");
  let worker:Awaited<ReturnType<typeof createWorker>>|undefined;
  try{
   worker=await createWorker("ita");
   await worker.setParameters({tessedit_char_whitelist:"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<"});
   const result=await worker.recognize(image);
   const parsed=parseMRZ(result.data.text);
   if(!parsed)throw Error("MRZ non riconosciuta. Riprova con una foto nitida delle tre righe, oppure inserisci i dati a mano.");
   onMRZ(parsed);setMessage("MRZ letta: verifica nome, cognome e data di nascita.");
  }catch(e){setMessage(e instanceof Error?e.message:String(e));}
  finally{await worker?.terminate();setBusy(false);}
 }
 return <div className="identity-scanner">
  <div className="identity-actions"><button type="button" className="secondary" disabled={busy} onClick={()=>file.current?.click()}>📷 Leggi MRZ</button><button type="button" className="secondary" disabled={busy} onClick={()=>void scanCF()}>▥ Leggi codice fiscale</button></div>
  <input ref={file} type="file" accept="image/*" capture="environment" hidden onChange={e=>{const f=e.target.files?.[0];if(f)void scanMRZ(f);e.target.value="";}}/>
  {mode==="cf"&&<div className="scanner-preview"><video ref={video} autoPlay muted playsInline/><p>Inquadra il codice a barre della tessera sanitaria.</p><button type="button" onClick={stop}>Chiudi fotocamera</button></div>}
  {busy&&<p role="status">Riconoscimento del documento…</p>}
  {message&&<p role="status">{message}</p>}
  <p className="scanner-note">I dati riconosciuti sono modificabili. La foto viene elaborata nel browser e non viene salvata nel gestionale.</p>
 </div>;
}
