import React, { useState, useRef, useEffect, useCallback } from "react";

/* ─── SUPABASE ─────────────────────────────── */
const SB_URL = "https://urufyzjaodhclbptpoxc.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVydWZ5emphb2RoY2xicHRwb3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDgyNjYsImV4cCI6MjA5MzI4NDI2Nn0.ZY-rHey4EKoyehhp56FeY-ZFFxrZugF2qViYv4ohf5k";
const SBH = { "Content-Type":"application/json", "apikey":SB_KEY, "Authorization":`Bearer ${SB_KEY}`, "Prefer":"resolution=merge-duplicates" };

async function sbGet(table) {
  try { const r=await fetch(`${SB_URL}/rest/v1/${table}?select=*`,{headers:SBH}); return r.ok?r.json():[]; } catch { return []; }
}
async function sbUpsert(table,row) {
  try { await fetch(`${SB_URL}/rest/v1/${table}`,{method:"POST",headers:SBH,body:JSON.stringify(row)}); } catch(e) { console.error(e); }
}
async function sbDelete(table,id) {
  try { await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}`,{method:"DELETE",headers:SBH}); } catch(e) { console.error(e); }
}

/* ─── COSTANTI ─────────────────────────────── */
const genId = () => Math.random().toString(36).slice(2,10);
const todayStr = () => new Date().toISOString().slice(0,10);
const QUALIFICHE = ["Operaio comune","Operaio specializzato","Caposquadra","Gruista","Carpentiere","Ferraiolo","Muratore","Elettricista","Idraulico","Topografo"];
const TIPI_MEZZO = ["Escavatore","Gru","Camion","Bobcat/Minipala","Autocarro","Dumper","Betoniera","Pompa calcestruzzo","Compressore","Rullo compattatore","Piattaforma aerea","Carrello elevatore","Trattore","Motopompa","Altro"];
const VISITATORI = ["DL","RUP","Collaudatore","CSE","Ispettorato del Lavoro","Tecnici Enti Erogatori","Altro"];
const ESITI = ["Positivo","Positivo con riserve","Negativo/Sospensione"];
const METEO_OPT = ["Sereno","Parzialmente nuvoloso","Nuvoloso","Pioggia leggera","Pioggia intensa","Temporale","Neve","Nebbia","Vento forte"];
const METEO_ICON = {"Sereno":"☀️","Parzialmente nuvoloso":"⛅","Nuvoloso":"☁️","Pioggia leggera":"🌦","Pioggia intensa":"🌧","Temporale":"⛈","Neve":"❄️","Nebbia":"🌫","Vento forte":"💨"};

/* ─── DESIGN ───────────────────────────────── */
const C = {
  bg:"var(--color-background-tertiary)", surf:"var(--color-background-primary)",
  bord:"var(--color-border-tertiary)", txt:"var(--color-text-primary)",
  txt2:"var(--color-text-secondary)", txt3:"var(--color-text-tertiary)",
  acc:"#2563EB", accL:"#EFF6FF", accT:"#1D4ED8",
  warn:"#D97706", warnL:"#FFFBEB", danger:"#DC2626",
  ok:"#16A34A", okL:"#F0FDF4",
};
const cardS = { background:C.surf, borderRadius:"var(--border-radius-lg)", border:`0.5px solid ${C.bord}`, padding:"14px 16px" };
const iF = { width:"100%", boxSizing:"border-box" };

function useIsMobile() {
  const [m,setM] = useState(window.innerWidth<700);
  useEffect(()=>{ const h=()=>setM(window.innerWidth<700); window.addEventListener("resize",h); return()=>window.removeEventListener("resize",h); },[]);
  return m;
}

/* ─── MICRO COMPONENTS ─────────────────────── */
function Btn({ children, onClick, v="pri", sm, full, disabled, style }) {
  const base = { borderRadius:"var(--border-radius-md)", cursor:disabled?"not-allowed":"pointer", fontWeight:500, border:"none", display:"inline-flex", alignItems:"center", justifyContent:"center", gap:5, opacity:disabled?.45:1, transition:"opacity .15s", whiteSpace:"nowrap" };
  const vs = { pri:{background:C.acc,color:"#fff"}, sec:{background:C.surf,color:C.txt,border:`0.5px solid ${C.bord}`}, ghost:{background:"transparent",color:C.txt2,border:`0.5px solid ${C.bord}`}, danger:{background:"#FEF2F2",color:C.danger,border:`0.5px solid #FECACA`} };
  return <button disabled={disabled} onClick={onClick} style={{ ...base, ...vs[v||"pri"], padding:sm?"6px 13px":"10px 16px", fontSize:sm?12:13, width:full?"100%":"auto", ...style }}>{children}</button>;
}
function Fld({ label, children, half }) { return <div style={{ marginBottom:10, flex:half?1:"unset" }}>{label&&<label style={{ fontSize:12, color:C.txt2, display:"block", marginBottom:4 }}>{label}</label>}{children}</div>; }
function Row2({ children, style }) { return <div style={{ display:"flex", gap:8, ...style }}>{children}</div>; }
function STit({ children }) { return <p style={{ fontSize:11, fontWeight:600, color:C.txt3, textTransform:"uppercase", letterSpacing:".06em", margin:"0 0 10px" }}>{children}</p>; }
function Crd({ children, style }) { return <div style={{ ...cardS, marginBottom:12, ...style }}>{children}</div>; }
function Emp({ children }) { return <p style={{ fontSize:13, color:C.txt3, textAlign:"center", padding:"20px 0", margin:0 }}>{children}</p>; }
function KV({ label, val }) { if(!val&&val!==0) return null; return <div style={{ display:"flex", gap:8, marginBottom:5, fontSize:13 }}><span style={{ color:C.txt2, minWidth:130, flexShrink:0 }}>{label}</span><span style={{ color:C.txt, fontWeight:500 }}>{val}</span></div>; }
function Bdg({ children, c="gray" }) {
  const m={blue:[C.accL,C.accT],green:[C.okL,C.ok],yellow:[C.warnL,C.warn],red:["#FEF2F2",C.danger],gray:["var(--color-background-secondary)","var(--color-text-secondary)"]};
  const [bg,fg]=m[c]||m.gray;
  return <span style={{ fontSize:11, background:bg, color:fg, padding:"2px 8px", borderRadius:10, fontWeight:500 }}>{children}</span>;
}
function Spinner() { return <div style={{ textAlign:"center", padding:40, color:C.txt3, fontSize:13 }}>⏳ Caricamento...</div>; }

function Tabs({ items, active, onChange }) {
  return (
    <div style={{ display:"flex", gap:6, padding:"8px 14px", overflowX:"auto", background:C.surf, borderBottom:`0.5px solid ${C.bord}`, scrollbarWidth:"none" }}>
      {items.map(([k,l])=>(
        <button key={k} onClick={()=>onChange(k)} style={{ padding:"5px 13px", borderRadius:20, fontSize:12, fontWeight:active===k?600:400, border:`0.5px solid ${active===k?C.acc:C.bord}`, background:active===k?C.accL:"transparent", color:active===k?C.accT:C.txt2, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>{l}</button>
      ))}
    </div>
  );
}

function TopBar({ title, onBack, onLogout, role, extra }) {
  return (
    <div style={{ background:C.surf, borderBottom:`0.5px solid ${C.bord}`, display:"flex", alignItems:"center", gap:10, padding:"0 14px", height:52, position:"sticky", top:0, zIndex:30 }}>
      {onBack&&<button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", color:C.txt2, fontSize:22, padding:"0 4px", lineHeight:1 }}>←</button>}
      <span style={{ fontSize:15, fontWeight:600, flex:1, color:C.txt, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{title}</span>
      {extra}
      <Bdg c={role==="dl"?"blue":"gray"}>{role==="dl"?"DL":role}</Bdg>
      {onLogout&&<button onClick={onLogout} style={{ background:"none", border:"none", cursor:"pointer", color:C.txt2, fontSize:12, padding:"0 4px" }}>Esci</button>}
    </div>
  );
}

function DittaAvatar({ nome, size=32 }) {
  const ini=(nome||"?").split(" ").slice(0,2).map(w=>w[0]?.toUpperCase()||"").join("");
  const hues=[214,38,160,0,270,330]; const h=hues[(nome||"").charCodeAt(0)%hues.length];
  return <div style={{ width:size, height:size, borderRadius:7, background:`hsl(${h},55%,90%)`, color:`hsl(${h},55%,32%)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*.36, fontWeight:600, flexShrink:0 }}>{ini}</div>;
}

function groupByDitta(items, ditte) {
  return [
    ...ditte.map(d=>({ label:d.nome, id:d.id, items:items.filter(o=>o.dittaId===d.id) })).filter(g=>g.items.length>0),
    { label:"Senza ditta", id:"__none__", items:items.filter(o=>!o.dittaId||!ditte.find(d=>d.id===o.dittaId)) }
  ].filter(g=>g.items.length>0);
}

function PageWrap({ children }) { return <div style={{ fontFamily:"var(--font-sans)", background:C.bg, minHeight:"100vh" }}>{children}</div>; }
function Pad({ children, desk }) {
  const isMobile = useIsMobile();
  return <div style={{ padding:isMobile?"14px":"24px", maxWidth:desk?"900px":"680px", margin:"0 auto" }}>{children}</div>;
}

/* ─── ROOT ─────────────────────────────────── */
export default function App() {
  const [session, setSession] = useState(null);
  const [view, setView] = useState("login");
  const [loading, setLoading] = useState(false);
  const [initLoaded, setInitLoaded] = useState(false);

  // Supabase state
  const [impostazioni, setImpostazioni] = useState({ dlPassword:"Dl01", firmaDL_img:"", firmeDitte:{} });
  const [ditte, setDitte] = useState([]);
  const [cantieri, setCantieri] = useState([]);
  const [operaiAna, setOperaiAna] = useState([]);
  const [mezziAna, setMezziAna] = useState([]);
  const [giornali, setGiornali] = useState([]);

  const [cantiereId, setCantiereId] = useState(null);
  const [targetGId, setTargetGId] = useState(null);

  const cantiere = cantieri.find(c=>c.id===cantiereId);
  const targetG  = giornali.find(g=>g.id===targetGId);
  const cantiereGiornali = giornali.filter(g=>g.cantiereId===cantiereId);
  const isDL = session?.role==="dl";
  const curDitta = ditte.find(d=>d.id===session?.dittaId);
  const roleLabel = isDL?"dl":(curDitta?.nome||"Ditta");

  const db = { ditte, cantieri, anagraficaOperai:operaiAna, anagraficaMezzi:mezziAna, giornali, firmaDL_img:impostazioni.firmaDL_img, firmeDitte:impostazioni.firmeDitte||{}, dlPassword:impostazioni.dlPassword };

  const loadAll = useCallback(async (isInit=false) => {
    if (isInit) setInitLoaded(false);
    else setLoading(true);
    const [imp, dit, can, ops, mzz, gio] = await Promise.all([
      sbGet("impostazioni"), sbGet("imprese"), sbGet("cantieri"),
      sbGet("operai_ana"), sbGet("mezzi_ana"), sbGet("giornali")
    ]);
    const impData = imp.find(x=>x.id==="global");
    if (impData) setImpostazioni(impData.data);
    setDitte(dit.map(x=>({id:x.id,...x.data})));
    setCantieri(can.map(x=>({id:x.id,...x.data})));
    setOperaiAna(ops.map(x=>({id:x.id,...x.data})));
    setMezziAna(mzz.map(x=>({id:x.id,...x.data})));
    setGiornali(gio.map(x=>({id:x.id,cantiereId:x.cantiere_id,...x.data})));
    if (isInit) setInitLoaded(true);
    else setLoading(false);
  }, []);

  // Carica impostazioni e ditte PRIMA del login
  useEffect(() => { loadAll(true); }, [loadAll]);
  // Ricarica tutto dopo il login
  useEffect(() => { if (session) loadAll(); }, [session, loadAll]);

  const saveImp = async (patch) => {
    const n = {...impostazioni,...patch};
    setImpostazioni(n);
    await sbUpsert("impostazioni", {id:"global", data:n});
  };
  const saveDitta = async (d) => { await sbUpsert("imprese",{id:d.id,data:d}); await loadAll(); };
  const delDitta  = async (id) => { await sbDelete("imprese",id); await loadAll(); };
  const saveCantiere = async (c) => { await sbUpsert("cantieri",{id:c.id,data:c}); await loadAll(); };
  const delCantiere  = async (id) => { await sbDelete("cantieri",id); await loadAll(); };
  const saveOp  = async (o) => { await sbUpsert("operai_ana",{id:o.id,data:o}); await loadAll(); };
  const delOp   = async (id) => { await sbDelete("operai_ana",id); await loadAll(); };
  const saveM   = async (m) => { await sbUpsert("mezzi_ana",{id:m.id,data:m}); await loadAll(); };
  const delM    = async (id) => { await sbDelete("mezzi_ana",id); await loadAll(); };
  const saveG   = async (g) => { await sbUpsert("giornali",{id:g.id,cantiere_id:g.cantiereId,data:g}); await loadAll(); };
  const delG    = async (id) => { await sbDelete("giornali",id); await loadAll(); };

  const nav = v => setView(v);
  const logout = () => { setSession(null); nav("login"); };
  const updateG = async (patch) => {
    const updated = {...targetG,...patch};
    await saveG(updated);
  };

  const visibleCantieri = isDL ? cantieri : cantieri.filter(c=>(curDitta?.cantieriIds||[]).includes(c.id));

  /* ── routing ── */
  if (view==="login") return <Login impostazioni={impostazioni} ditte={ditte} initLoaded={initLoaded} onLogin={s=>{setSession(s);nav("cantieri");}}/>;

  if (view==="impostazioni") return <Impostazioni
    db={db} saveImp={saveImp} saveDitta={saveDitta} delDitta={delDitta}
    onBack={()=>nav("cantieri")} isDL={isDL} role={roleLabel} onLogout={logout}/>;

  if (view==="anagrafica") return <Anagrafica
    db={db} saveOp={saveOp} delOp={delOp} saveM={saveM} delM={delM} saveDitta={saveDitta} delDitta={delDitta}
    onBack={()=>nav("cantieri")} role={roleLabel} onLogout={logout}/>;

  if (view==="form_cantiere") return <FormCantiere
    initial={targetGId?cantiere:undefined}
    onSave={async c=>{
      if (targetGId) await saveCantiere({...cantiere,...c});
      else await saveCantiere({...c,id:genId()});
      nav(targetGId?"dashboard":"cantieri");
    }}
    onCancel={()=>nav(targetGId?"dashboard":"cantieri")}
    role={roleLabel} onLogout={logout} isEdit={!!targetGId}/>;

  if (view==="form_giornale") {
    const existingN = cantiereGiornali.filter(g=>g.revisioneN===0).map(g=>g.numeroBase);
    return <FormGiornale key={targetGId||"new"}
      initial={targetGId?targetG:null}
      db={db} cantiereId={cantiereId} existingNumeri={existingN}
      onSave={async g=>{
        if (targetGId) await saveG({...targetG,...g,firmaDL:false});
        else await saveG({...g,id:genId(),cantiereId});
        nav("lista_giornali");
      }}
      onCancel={()=>nav("lista_giornali")} role={roleLabel} onLogout={logout}/>;
  }

  if (view==="form_revisione"&&targetG) return <FormGiornale key={"rev_"+targetGId}
    initial={null} isRevisione originalG={targetG}
    db={db} cantiereId={cantiereId} existingNumeri={[]}
    onSave={async g=>{
      const revN=(cantiereGiornali.filter(x=>x.numeroBase===targetG.numeroBase&&x.revisioneN>0).length)+1;
      const rev={...g,id:genId(),cantiereId,numeroBase:targetG.numeroBase,revisioneN:revN,displayNum:`${targetG.numeroBase}.${revN}`,bloccato:false,firmaDL:false,firmaImpresa:false,firmaImpresaDitta:"",firmaImpresaImg:"",riserve:[]};
      await saveG(rev); nav("lista_giornali");
    }}
    onCancel={()=>nav("view_giornale")} role={roleLabel} onLogout={logout}/>;

  if (view==="cantieri") return (
    <PageWrap>
      <TopBar title="Cantieri" role={roleLabel} onLogout={logout}
        extra={isDL&&<Btn v="ghost" sm onClick={()=>nav("impostazioni")}>⚙ Impostazioni</Btn>}/>
      {loading?<Spinner/>:
      <Pad>
        {isDL&&<Btn full onClick={()=>{setTargetGId(null);nav("form_cantiere");}} style={{marginBottom:12}}>+ Nuovo cantiere</Btn>}
        {visibleCantieri.length===0&&<Emp>Nessun cantiere disponibile.</Emp>}
        {visibleCantieri.map(c=>(
          <div key={c.id} onClick={()=>{setCantiereId(c.id);nav("dashboard");}} style={{...cardS,cursor:"pointer",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
              <span style={{fontSize:24,lineHeight:1,marginTop:2}}>🏗</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:14}}>{c.oggetto||"Cantiere senza nome"}</div>
                <div style={{fontSize:12,color:C.txt2,marginTop:2}}>{c.stazione||"—"}{c.cig?` • CIG: ${c.cig}`:""}</div>
                <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
                  {c.luogo&&<Bdg>📍 {c.luogo}</Bdg>}
                  <Bdg c="gray">{giornali.filter(g=>g.cantiereId===c.id).length} giornali</Bdg>
                </div>
              </div>
              <span style={{color:C.txt3,fontSize:18}}>›</span>
            </div>
          </div>
        ))}
        {isDL&&<Btn v="sec" full onClick={()=>nav("anagrafica")} style={{marginTop:8}}>👷 Anagrafica operai e mezzi</Btn>}
      </Pad>}
    </PageWrap>
  );

  if (view==="dashboard"&&cantiere) return (
    <PageWrap>
      <TopBar title={cantiere.oggetto||"Cantiere"} role={roleLabel} onBack={()=>nav("cantieri")} onLogout={logout}/>
      <Pad>
        <Crd><STit>Dati cantiere</STit>
          <KV label="Stazione appaltante" val={cantiere.stazione}/>
          <KV label="RUP" val={cantiere.rup}/><KV label="DL" val={cantiere.dl}/>
          <KV label="Impresa esecutrice" val={cantiere.impresa}/>
          {(cantiere.cig||cantiere.cup)&&<div style={{display:"flex",gap:8,marginTop:4}}>
            {cantiere.cig&&<Bdg c="blue">CIG: {cantiere.cig}</Bdg>}
            {cantiere.cup&&<Bdg>CUP: {cantiere.cup}</Bdg>}
          </div>}
        </Crd>
        {isDL&&<Row2 style={{marginBottom:10}}>
          <Btn v="ghost" sm onClick={()=>{setTargetGId(cantiere.id);nav("form_cantiere");}}>✏ Modifica</Btn>
          <Btn v="danger" sm onClick={async()=>{if(window.confirm("Eliminare cantiere e tutti i suoi giornali?")){for(const g of cantiereGiornali) await delG(g.id);await delCantiere(cantiere.id);nav("cantieri");}}}>🗑 Elimina</Btn>
        </Row2>}
        <Btn v="sec" full onClick={()=>nav("lista_giornali")} style={{marginBottom:8}}>Giornali dei lavori ({cantiereGiornali.length})</Btn>
        {isDL&&<Btn full onClick={()=>{setTargetGId(null);nav("form_giornale");}}>+ Nuovo giornale</Btn>}
      </Pad>
    </PageWrap>
  );

  if (view==="lista_giornali") {
    const originali = cantiereGiornali.filter(g=>g.revisioneN===0).sort((a,b)=>a.numeroBase?.localeCompare(b.numeroBase||"",undefined,{numeric:true}));
    return (
      <PageWrap>
        <TopBar title="Giornali dei lavori" role={roleLabel} onBack={()=>nav("dashboard")} onLogout={logout}/>
        <Pad>
          {originali.length===0&&<Emp>Nessun giornale ancora.</Emp>}
          {originali.map(orig=>{
            const revisioni = cantiereGiornali.filter(g=>g.numeroBase===orig.numeroBase&&g.revisioneN>0).sort((a,b)=>a.revisioneN-b.revisioneN);
            return (
              <div key={orig.id} style={{marginBottom:16}}>
                <GiornaleCard g={orig} label="Originale" onClick={()=>{setTargetGId(orig.id);nav("view_giornale");}}/>
                {revisioni.map(rev=>(
                  <div key={rev.id} style={{paddingLeft:20,borderLeft:`2px solid ${C.bord}`,marginTop:4}}>
                    <GiornaleCard g={rev} label={`Rev. ${rev.revisioneN}`} onClick={()=>{setTargetGId(rev.id);nav("view_giornale");}}/>
                  </div>
                ))}
              </div>
            );
          })}
        </Pad>
      </PageWrap>
    );
  }

  if (view==="view_giornale"&&targetG) return (
    <ViewGiornale g={targetG} cantiere={cantiere} isDL={isDL} db={db} role={roleLabel}
      cantiereGiornali={cantiereGiornali} session={session}
      onBack={()=>nav("lista_giornali")}
      onEdit={()=>{nav("form_giornale");}}
      onNuovaRevisione={()=>nav("form_revisione")}
      onUpdate={updateG} onLogout={logout}/>
  );

  return null;
}

function GiornaleCard({ g, label, onClick }) {
  return (
    <div onClick={onClick} style={{...cardS,cursor:"pointer",marginBottom:4}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:22}}>{METEO_ICON[g.meteo]||"📋"}</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
            <span style={{fontWeight:600,fontSize:14}}>N. {g.displayNum}</span>
            <Bdg c="gray">{label}</Bdg>
            <span style={{fontSize:12,color:C.txt2}}>{g.data}</span>
            {g.sospeso&&<Bdg c="yellow">Sospeso</Bdg>}
            {g.bloccato&&<Bdg c="green">Firmato ✓</Bdg>}
            {!g.bloccato&&(g.firmaDL||g.firmaImpresa)&&<Bdg c="yellow">Firma parziale</Bdg>}
          </div>
          <div style={{fontSize:12,color:C.txt2,marginTop:2}}>{g.operaiPresenti?.length||0} operai • {g.mezziUsati?.length||0} mezzi</div>
        </div>
        <span style={{color:C.txt3,fontSize:18}}>›</span>
      </div>
    </div>
  );
}

/* ─── LOGIN ─────────────────────────────────── */
function Login({ impostazioni, ditte, initLoaded, onLogin }) {
  const [pwd,setPwd]=useState(""); const [err,setErr]=useState("");
  const go=()=>{
    if(!initLoaded) return;
    if(!pwd.trim()) return setErr("Inserisci la password.");
    if(pwd===impostazioni.dlPassword){onLogin({role:"dl"});return;}
    const d=ditte.find(x=>x.password===pwd);
    if(d){onLogin({role:"ditta",dittaId:d.id});return;}
    setErr("Password non riconosciuta.");
  };
  return (
    <div style={{fontFamily:"var(--font-sans)",minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{...cardS,width:"100%",maxWidth:380,padding:32}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:44,marginBottom:10}}>🏗</div>
          <div style={{fontSize:20,fontWeight:700,color:C.txt}}>Giornale dei Lavori</div>
          <div style={{fontSize:13,color:C.txt2,marginTop:6}}>Inserisci la tua password per accedere</div>
        </div>
        {!initLoaded
          ? <div style={{textAlign:"center",padding:"16px 0",color:C.txt3,fontSize:13}}>⏳ Connessione in corso...</div>
          : <>
              <Fld label="Password">
                <input type="password" value={pwd} onChange={e=>{setPwd(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&go()} style={iF} placeholder="••••••••" autoFocus/>
              </Fld>
              {err&&<div style={{fontSize:12,color:C.danger,marginBottom:10,padding:"8px 12px",background:"#FEF2F2",borderRadius:"var(--border-radius-md)"}}>{err}</div>}
              <Btn full onClick={go} style={{marginTop:4}}>Accedi</Btn>
            </>}
      </div>
    </div>
  );
}

/* ─── IMPOSTAZIONI ──────────────────────────── */
function Impostazioni({ db, saveImp, saveDitta, delDitta, onBack, isDL, role, onLogout }) {
  const [tab,setTab]=useState("account");
  const [newP,setNewP]=useState(""); const [confP,setConfP]=useState(""); const [msg,setMsg]=useState(null);
  const [nNome,setNNome]=useState(""); const [nPiva,setNPiva]=useState(""); const [nRef,setNRef]=useState(""); const [nPwd,setNPwd]=useState(""); const [nCant,setNCant]=useState([]);
  const [editId,setEditId]=useState(null); const [editD,setEditD]=useState({});
  const dlFileRef=useRef(); const ditteFileRefs=useRef({});
  const ditte=db.ditte||[];

  const savePass=()=>{
    if(!newP.trim()) return setMsg({ok:false,t:"Inserisci la nuova password."});
    if(newP!==confP) return setMsg({ok:false,t:"Le password non corrispondono."});
    saveImp({dlPassword:newP}); setNewP(""); setConfP(""); setMsg({ok:true,t:"Password aggiornata ✓"});
  };
  const loadImg=(file,cb)=>{const r=new FileReader();r.onload=e=>cb(e.target.result);r.readAsDataURL(file);};
  const addDitta=async()=>{
    if(!nNome.trim()||!nPwd.trim()) return;
    await saveDitta({id:genId(),nome:nNome.trim(),piva:nPiva.trim(),referente:nRef.trim(),password:nPwd.trim(),cantieriIds:nCant});
    setNNome(""); setNPiva(""); setNRef(""); setNPwd(""); setNCant([]);
  };
  const startEdit=d=>{setEditId(d.id);setEditD({nome:d.nome,piva:d.piva||"",referente:d.referente||"",password:d.password,cantieriIds:d.cantieriIds||[]});};
  const saveEdit=async()=>{await saveDitta({...ditte.find(d=>d.id===editId),...editD});setEditId(null);};
  const togNC=id=>setNCant(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const togEC=id=>setEditD(p=>({...p,cantieriIds:p.cantieriIds?.includes(id)?p.cantieriIds.filter(x=>x!==id):[...(p.cantieriIds||[]),id]}));

  return (
    <PageWrap>
      <TopBar title="Impostazioni" role={role} onBack={onBack} onLogout={onLogout}/>
      <Tabs items={[["account","Account"],["firme","Firme"],["ditte","Ditte e accessi"]]} active={tab} onChange={setTab}/>
      <Pad>
        {tab==="account"&&<Crd>
          <STit>Cambia password DL</STit>
          <Fld label="Nuova password"><input type="password" value={newP} onChange={e=>setNewP(e.target.value)} style={iF}/></Fld>
          <Fld label="Conferma password"><input type="password" value={confP} onChange={e=>setConfP(e.target.value)} style={iF}/></Fld>
          {msg&&<div style={{fontSize:12,color:msg.ok?C.ok:C.danger,marginBottom:8,padding:"8px 12px",background:msg.ok?C.okL:"#FEF2F2",borderRadius:"var(--border-radius-md)"}}>{msg.t}</div>}
          <Btn onClick={savePass}>Salva password</Btn>
        </Crd>}

        {tab==="firme"&&<>
          <p style={{fontSize:13,color:C.txt2,marginTop:0,marginBottom:16,lineHeight:1.6}}>Carica le firme una sola volta. Verranno applicate automaticamente al momento della firma su qualsiasi dispositivo.</p>
          <Crd>
            <STit>Firma Direzione Lavori</STit>
            <input ref={dlFileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{if(e.target.files[0])loadImg(e.target.files[0],img=>saveImp({firmaDL_img:img}));}}/>
            {db.firmaDL_img
              ?<><img src={db.firmaDL_img} alt="Firma DL" style={{maxHeight:70,maxWidth:200,border:`1px solid ${C.bord}`,borderRadius:"var(--border-radius-md)",background:"#f9f9f9",display:"block",marginBottom:10}}/>
                 <Row2><Bdg c="green">Registrata ✓</Bdg><button onClick={()=>dlFileRef.current.click()} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:C.accT}}>Sostituisci</button><button onClick={()=>saveImp({firmaDL_img:""})} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:C.danger}}>Elimina</button></Row2></>
              :<Btn v="sec" onClick={()=>dlFileRef.current.click()}>📎 Carica firma DL</Btn>}
          </Crd>
          {ditte.length===0&&<Emp>Nessuna ditta — aggiungila nella sezione "Ditte e accessi".</Emp>}
          {ditte.map(d=>{
            if(!ditteFileRefs.current[d.id]) ditteFileRefs.current[d.id]=React.createRef();
            const fImg=db.firmeDitte?.[d.id];
            return (
              <Crd key={d.id}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <DittaAvatar nome={d.nome} size={28}/><span style={{fontWeight:600,fontSize:14}}>{d.nome}</span>
                </div>
                <input ref={ditteFileRefs.current[d.id]} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{if(e.target.files[0])loadImg(e.target.files[0],img=>saveImp({firmeDitte:{...db.firmeDitte,[d.id]:img}}));}}/>
                {fImg
                  ?<><img src={fImg} alt={`Firma ${d.nome}`} style={{maxHeight:70,maxWidth:200,border:`1px solid ${C.bord}`,borderRadius:"var(--border-radius-md)",background:"#f9f9f9",display:"block",marginBottom:10}}/>
                     <Row2><Bdg c="green">Registrata ✓</Bdg><button onClick={()=>ditteFileRefs.current[d.id].current.click()} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:C.accT}}>Sostituisci</button><button onClick={()=>{const f={...db.firmeDitte};delete f[d.id];saveImp({firmeDitte:f});}} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:C.danger}}>Elimina</button></Row2></>
                  :<Btn v="sec" onClick={()=>ditteFileRefs.current[d.id].current.click()}>📎 Carica firma {d.nome}</Btn>}
              </Crd>
            );
          })}
        </>}

        {tab==="ditte"&&<>
          <Crd>
            <STit>Nuova ditta</STit>
            <Fld label="Nome / Ragione sociale"><input value={nNome} onChange={e=>setNNome(e.target.value)} style={iF} placeholder="Es. Rossi Costruzioni Srl"/></Fld>
            <Row2>
              <Fld label="P. IVA" half><input value={nPiva} onChange={e=>setNPiva(e.target.value)} style={iF}/></Fld>
              <Fld label="Referente" half><input value={nRef} onChange={e=>setNRef(e.target.value)} style={iF}/></Fld>
            </Row2>
            <Fld label="Password di accesso"><input value={nPwd} onChange={e=>setNPwd(e.target.value)} style={iF} placeholder="Password per questa ditta"/></Fld>
            {db.cantieri.length>0&&<><p style={{fontSize:12,color:C.txt2,margin:"4px 0 8px"}}>Cantieri visibili:</p>
              {db.cantieri.map(c=><label key={c.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,cursor:"pointer",fontSize:13}}><input type="checkbox" checked={nCant.includes(c.id)} onChange={()=>togNC(c.id)}/>{c.oggetto||"Cantiere senza nome"}</label>)}
            </>}
            <Btn onClick={addDitta} style={{marginTop:6}}>Aggiungi ditta</Btn>
          </Crd>
          {ditte.length===0&&<Emp>Nessuna ditta ancora.</Emp>}
          {ditte.map(d=>(
            <Crd key={d.id}>
              {editId===d.id?<>
                <STit>Modifica {d.nome}</STit>
                <Fld label="Nome"><input value={editD.nome} onChange={e=>setEditD(p=>({...p,nome:e.target.value}))} style={iF}/></Fld>
                <Row2>
                  <Fld label="P. IVA" half><input value={editD.piva} onChange={e=>setEditD(p=>({...p,piva:e.target.value}))} style={iF}/></Fld>
                  <Fld label="Referente" half><input value={editD.referente} onChange={e=>setEditD(p=>({...p,referente:e.target.value}))} style={iF}/></Fld>
                </Row2>
                <Fld label="Password"><input value={editD.password} onChange={e=>setEditD(p=>({...p,password:e.target.value}))} style={iF}/></Fld>
                <p style={{fontSize:12,color:C.txt2,margin:"4px 0 8px"}}>Cantieri visibili:</p>
                {db.cantieri.map(c=><label key={c.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,cursor:"pointer",fontSize:13}}><input type="checkbox" checked={(editD.cantieriIds||[]).includes(c.id)} onChange={()=>togEC(c.id)}/>{c.oggetto||"Cantiere senza nome"}</label>)}
                <Row2><Btn onClick={saveEdit}>Salva</Btn><Btn v="ghost" onClick={()=>setEditId(null)}>Annulla</Btn></Row2>
              </>:<div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                <DittaAvatar nome={d.nome}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:14}}>{d.nome}</div>
                  {d.piva&&<div style={{fontSize:12,color:C.txt2}}>P.IVA: {d.piva}</div>}
                  {d.referente&&<div style={{fontSize:12,color:C.txt2}}>Ref.: {d.referente}</div>}
                  <div style={{fontSize:12,color:C.txt3,marginTop:2}}>🔑 {d.password}</div>
                  <div style={{display:"flex",gap:4,marginTop:6,flexWrap:"wrap"}}>
                    {!(d.cantieriIds?.length)?<Bdg c="red">Nessun cantiere</Bdg>
                      :d.cantieriIds.map(cid=>{const c=db.cantieri.find(x=>x.id===cid);return c?<Bdg key={cid} c="blue">{c.oggetto||"Cantiere"}</Bdg>:null;})}
                  </div>
                </div>
                <Row2>
                  <Btn v="ghost" sm onClick={()=>startEdit(d)}>✏</Btn>
                  <Btn v="danger" sm onClick={()=>{if(window.confirm(`Eliminare ${d.nome}?`))delDitta(d.id);}}>×</Btn>
                </Row2>
              </div>}
            </Crd>
          ))}
        </>}
      </Pad>
    </PageWrap>
  );
}

/* ─── ANAGRAFICA ────────────────────────────── */
function Anagrafica({ db, saveOp, delOp, saveM, delM, saveDitta, delDitta, onBack, role, onLogout }) {
  const [tab,setTab]=useState("operai");
  const [nNome,setNNome]=useState(""); const [nQual,setNQual]=useState(QUALIFICHE[0]); const [nOpD,setNOpD]=useState("");
  const [mNome,setMNome]=useState(""); const [mTipo,setMTipo]=useState(TIPI_MEZZO[0]); const [mMod,setMMod]=useState(""); const [mTarga,setMTarga]=useState(""); const [mDitta,setMDitta]=useState("");
  const ditte=db.ditte||[];

  const addOp=async()=>{
    if(!nNome.trim()) return;
    const d=ditte.find(x=>x.nome===nOpD);
    await saveOp({id:genId(),nome:nNome.trim(),qualifica:nQual,dittaId:d?.id||null,dittaNome:d?.nome||""});
    setNNome("");
  };
  const addM=async()=>{
    if(!mNome.trim()) return;
    const d=ditte.find(x=>x.nome===mDitta);
    await saveM({id:genId(),nome:mNome.trim(),tipo:mTipo,modello:mMod.trim(),targa:mTarga.trim().toUpperCase(),dittaId:d?.id||null,dittaNome:d?.nome||""});
    setMNome(""); setMMod(""); setMTarga("");
  };

  return (
    <PageWrap>
      <TopBar title="Anagrafica" role={role} onBack={onBack} onLogout={onLogout}/>
      <Tabs items={[["operai","Operai"],["mezzi","Mezzi"]]} active={tab} onChange={setTab}/>
      <Pad>
        {tab==="operai"&&<>
          <Crd><STit>Aggiungi operaio</STit>
            <Fld label="Nome e cognome"><input value={nNome} onChange={e=>setNNome(e.target.value)} style={iF} placeholder="Es. Mario Rossi"/></Fld>
            <Row2>
              <Fld label="Qualifica" half><select value={nQual} onChange={e=>setNQual(e.target.value)} style={iF}>{QUALIFICHE.map(q=><option key={q}>{q}</option>)}</select></Fld>
              <Fld label="Ditta" half><select value={nOpD} onChange={e=>setNOpD(e.target.value)} style={iF}><option value="">— Nessuna —</option>{ditte.map(d=><option key={d.id}>{d.nome}</option>)}</select></Fld>
            </Row2>
            <Btn onClick={addOp}>Aggiungi operaio</Btn>
          </Crd>
          {db.anagraficaOperai.length===0&&<Emp>Nessun operaio ancora.</Emp>}
          {groupByDitta(db.anagraficaOperai,ditte).map(g=><GruppoList key={g.id} g={g} type="op" onDel={id=>delOp(id)}/>)}
        </>}
        {tab==="mezzi"&&<>
          <Crd><STit>Aggiungi mezzo</STit>
            <Fld label="Nome / Descrizione"><input value={mNome} onChange={e=>setMNome(e.target.value)} style={iF} placeholder="Es. Escavatore principale"/></Fld>
            <Row2>
              <Fld label="Tipo" half><select value={mTipo} onChange={e=>setMTipo(e.target.value)} style={iF}>{TIPI_MEZZO.map(t=><option key={t}>{t}</option>)}</select></Fld>
              <Fld label="Targa" half><input value={mTarga} onChange={e=>setMTarga(e.target.value)} style={iF} placeholder="AB123CD"/></Fld>
            </Row2>
            <Row2>
              <Fld label="Modello" half><input value={mMod} onChange={e=>setMMod(e.target.value)} style={iF}/></Fld>
              <Fld label="Ditta" half><select value={mDitta} onChange={e=>setMDitta(e.target.value)} style={iF}><option value="">— Nessuna —</option>{ditte.map(d=><option key={d.id}>{d.nome}</option>)}</select></Fld>
            </Row2>
            <Btn onClick={addM}>Aggiungi mezzo</Btn>
          </Crd>
          {db.anagraficaMezzi.length===0&&<Emp>Nessun mezzo ancora.</Emp>}
          {groupByDitta(db.anagraficaMezzi,ditte).map(g=><GruppoList key={g.id} g={g} type="mezzo" onDel={id=>delM(id)}/>)}
        </>}
      </Pad>
    </PageWrap>
  );
}

function GruppoList({ g, type, onDel }) {
  return (
    <div style={{marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
        {g.id!=="__none__"&&<DittaAvatar nome={g.label} size={24}/>}
        <span style={{fontWeight:600,fontSize:13}}>{g.label}</span><Bdg c="blue">{g.items.length}</Bdg>
      </div>
      <Crd style={{padding:"4px 14px"}}>
        {g.items.map((item,i)=>(
          <div key={item.id} style={{display:"flex",alignItems:"center",borderBottom:i<g.items.length-1?`0.5px solid ${C.bord}`:"none",padding:"9px 0"}}>
            <span style={{fontSize:16,marginRight:10}}>{type==="op"?"👷":"🚜"}</span>
            <div style={{flex:1}}>
              <div style={{fontWeight:600,fontSize:13}}>{item.nome}</div>
              <div style={{fontSize:11,color:C.txt2}}>{type==="op"?item.qualifica:`${item.tipo}${item.targa?` • ${item.targa}`:""}`}</div>
            </div>
            <button onClick={()=>{if(window.confirm(`Eliminare ${item.nome}?`))onDel(item.id);}} style={{background:"none",border:"none",cursor:"pointer",color:C.danger,fontSize:18}}>×</button>
          </div>
        ))}
      </Crd>
    </div>
  );
}

/* ─── FORM CANTIERE ─────────────────────────── */
function FormCantiere({ initial={}, onSave, onCancel, role, onLogout, isEdit }) {
  const [f,setF]=useState({oggetto:"",stazione:"",rup:"",dl:"",impresa:"",cig:"",cup:"",luogo:"",...initial});
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  return (
    <PageWrap>
      <TopBar title={isEdit?"Modifica cantiere":"Nuovo cantiere"} role={role} onBack={onCancel} onLogout={onLogout}/>
      <Pad>
        <Crd><STit>Generale</STit>
          <Fld label="Oggetto del progetto"><input value={f.oggetto} onChange={e=>s("oggetto",e.target.value)} style={iF}/></Fld>
          <Fld label="Luogo dei lavori"><input value={f.luogo} onChange={e=>s("luogo",e.target.value)} style={iF}/></Fld>
        </Crd>
        <Crd><STit>Soggetti</STit>
          {[["stazione","Stazione appaltante"],["rup","RUP"],["dl","Direttore dei Lavori"],["impresa","Impresa esecutrice"]].map(([k,l])=>(
            <Fld key={k} label={l}><input value={f[k]} onChange={e=>s(k,e.target.value)} style={iF}/></Fld>
          ))}
        </Crd>
        <Crd><STit>Codici</STit>
          <Row2><Fld label="CIG" half><input value={f.cig} onChange={e=>s("cig",e.target.value)} style={iF}/></Fld><Fld label="CUP" half><input value={f.cup} onChange={e=>s("cup",e.target.value)} style={iF}/></Fld></Row2>
        </Crd>
        <Row2><Btn v="sec" onClick={onCancel} style={{flex:1}}>Annulla</Btn><Btn onClick={()=>onSave(f)} style={{flex:2}}>Salva cantiere</Btn></Row2>
      </Pad>
    </PageWrap>
  );
}

/* ─── FORM GIORNALE ─────────────────────────── */
function FormGiornale({ initial, isRevisione, originalG, db, cantiereId, existingNumeri, onSave, onCancel, role, onLogout }) {
  const src=initial||(isRevisione?originalG:null)||{};
  const [tab,setTab]=useState("generale");
  const [numeroBase,setNumeroBase]=useState(src.numeroBase||"");
  const [data,setData]=useState(src.data||todayStr());
  const [meteo,setMeteo]=useState(src.meteo||"Sereno");
  const [tempMin,setTempMin]=useState(src.tempMin||"");
  const [tempMax,setTempMax]=useState(src.tempMax||"");
  const [lavorazioni,setLavorazioni]=useState(src.lavorazioni||"");
  const [sospeso,setSospeso]=useState(src.sospeso||false);
  const [causaSosp,setCausa]=useState(src.causaSosp||"Causa meteorologica");
  const [altroMot,setAltroMot]=useState(src.altroMotivo||"");
  const [ripresa,setRipresa]=useState(src.ripresa||false);
  const [dataRip,setDataRip]=useState(src.dataRipresa||"");
  const [motRip,setMotRip]=useState(src.motivoRipresa||"");
  const [noteRip,setNoteRip]=useState(src.noteRipresa||"");
  const [operai,setOperai]=useState(src.operaiPresenti||[]);
  const [mezzi,setMezzi]=useState(src.mezziUsati||[]);
  const [sopra,setSopra]=useState(src.sopralluoghi||[]);
  const [photos,setPhotos]=useState(src.photos||[]);
  const fileRef=useRef();
  const ditte=db.ditte||[];
  const opG=groupByDitta(db.anagraficaOperai,ditte);
  const mG=groupByDitta(db.anagraficaMezzi,ditte);
  const togOp=o=>setOperai(p=>p.find(x=>x.id===o.id)?p.filter(x=>x.id!==o.id):[...p,{...o,ore:8}]);
  const togM=m=>setMezzi(p=>p.find(x=>x.id===m.id)?p.filter(x=>x.id!==m.id):[...p,m]);
  const addSp=()=>setSopra(p=>[...p,{id:genId(),soggetto:"DL",ente:"",oraIngresso:"",oraUscita:"",finalita:"",prescrizioni:"",esito:"Positivo"}]);
  const updSp=(id,k,v)=>setSopra(p=>p.map(s=>s.id===id?{...s,[k]:v}:s));
  const handlePh=e=>Array.from(e.target.files).forEach(f=>{const r=new FileReader();r.onload=ev=>setPhotos(p=>[...p,{id:genId(),name:f.name,data:ev.target.result}]);r.readAsDataURL(f);});
  const isEdit=!!initial&&!isRevisione;
  const save=()=>{
    if(!numeroBase.trim()) return alert("Inserisci il numero del giornale.");
    const displayNum=isRevisione?`${originalG.numeroBase}.x`:numeroBase.trim();
    onSave({numeroBase:numeroBase.trim(),revisioneN:isRevisione?1:0,displayNum,data,meteo,tempMin,tempMax,lavorazioni,sospeso,causaSosp,altroMotivo:altroMot,ripresa,dataRipresa:dataRip,motivoRipresa:motRip,noteRipresa:noteRip,operaiPresenti:operai,mezziUsati:mezzi,sopralluoghi:sopra,photos,riserve:src.riserve||[],firmaDL:false,firmaImpresa:false,firmaImpresaDitta:"",firmaImpresaImg:"",bloccato:false});
  };
  const TTABS=[["generale","Generale"],["operai","Operai"],["mezzi","Mezzi"],["sopralluoghi","Sopralluoghi"],["sospensione","Sosp./Ripresa"],["foto","Foto"]];

  return (
    <PageWrap>
      <TopBar title={isRevisione?`Revisione N. ${originalG?.numeroBase}`:isEdit?`Modifica N. ${initial?.displayNum}`:"Nuovo giornale"} role={role} onBack={onCancel} onLogout={onLogout}/>
      <Tabs items={TTABS} active={tab} onChange={setTab}/>
      <Pad>
        {tab==="generale"&&<>
          <Crd>
            <Fld label="Numero giornale"><input value={numeroBase} onChange={e=>setNumeroBase(e.target.value)} style={iF} placeholder="Es. 1, 2, 12 …" disabled={isRevisione}/></Fld>
            <Fld label="Data"><input type="date" value={data} onChange={e=>setData(e.target.value)} style={iF}/></Fld>
            <Fld label="Meteo"><select value={meteo} onChange={e=>setMeteo(e.target.value)} style={iF}>{METEO_OPT.map(m=><option key={m}>{METEO_ICON[m]} {m}</option>)}</select></Fld>
            <Row2>
              <Fld label="Temp. min °C" half><input type="number" value={tempMin} onChange={e=>setTempMin(e.target.value)} style={iF}/></Fld>
              <Fld label="Temp. max °C" half><input type="number" value={tempMax} onChange={e=>setTempMax(e.target.value)} style={iF}/></Fld>
            </Row2>
          </Crd>
          <Crd><STit>Lavorazioni eseguite</STit><textarea value={lavorazioni} onChange={e=>setLavorazioni(e.target.value)} rows={5} style={{...iF,resize:"vertical"}} placeholder="Descrivi le lavorazioni..."/></Crd>
        </>}

        {tab==="operai"&&<>
          <div style={{background:C.accL,borderRadius:"var(--border-radius-md)",padding:"9px 12px",marginBottom:12,fontSize:13,color:C.accT}}>{operai.length} / {db.anagraficaOperai.length} operai selezionati</div>
          {db.anagraficaOperai.length===0&&<Emp>Aggiungi operai in Anagrafica prima.</Emp>}
          {opG.map(g=>(
            <div key={g.id} style={{marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                {g.id!=="__none__"&&<DittaAvatar nome={g.label} size={24}/>}
                <span style={{fontWeight:600,fontSize:13}}>{g.label}</span>
                <Bdg c="blue">{g.items.filter(o=>operai.find(x=>x.id===o.id)).length}/{g.items.length}</Bdg>
              </div>
              {g.items.map(o=>{const p=operai.find(x=>x.id===o.id);return(
                <div key={o.id} style={{...cardS,marginBottom:6,border:`0.5px solid ${p?C.acc:C.bord}`}}>
                  <div style={{display:"flex",alignItems:"center"}}>
                    <input type="checkbox" checked={!!p} onChange={()=>togOp(o)} style={{marginRight:10}}/>
                    <span style={{flex:1,fontWeight:600,fontSize:13}}>{o.nome}</span>
                    <span style={{fontSize:12,color:C.txt2}}>{o.qualifica}</span>
                  </div>
                  {p&&<div style={{display:"flex",alignItems:"center",gap:8,marginTop:8,borderTop:`0.5px solid ${C.bord}`,paddingTop:8}}>
                    <span style={{fontSize:12,color:C.txt2}}>Ore:</span>
                    <input type="number" value={p.ore} min={0} max={24} onChange={e=>setOperai(ps=>ps.map(x=>x.id===o.id?{...x,ore:e.target.value}:x))} style={{width:60}}/>
                  </div>}
                </div>
              );})}
            </div>
          ))}
        </>}

        {tab==="mezzi"&&<>
          <div style={{background:C.okL,borderRadius:"var(--border-radius-md)",padding:"9px 12px",marginBottom:12,fontSize:13,color:C.ok}}>{mezzi.length} / {db.anagraficaMezzi.length} mezzi selezionati</div>
          {db.anagraficaMezzi.length===0&&<Emp>Aggiungi mezzi in Anagrafica prima.</Emp>}
          {mG.map(g=>(
            <div key={g.id} style={{marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                {g.id!=="__none__"&&<DittaAvatar nome={g.label} size={24}/>}
                <span style={{fontWeight:600,fontSize:13}}>{g.label}</span>
              </div>
              {g.items.map(m=>{const u=mezzi.find(x=>x.id===m.id);return(
                <div key={m.id} onClick={()=>togM(m)} style={{...cardS,marginBottom:6,border:`0.5px solid ${u?C.acc:C.bord}`,cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
                  <input type="checkbox" checked={!!u} readOnly/>
                  <div><div style={{fontWeight:600,fontSize:13}}>{m.nome}</div><div style={{fontSize:11,color:C.txt2}}>{m.tipo}{m.targa?` • ${m.targa}`:""}</div></div>
                </div>
              );})}
            </div>
          ))}
        </>}

        {tab==="sopralluoghi"&&<>
          <Btn v="sec" full onClick={addSp} style={{marginBottom:12}}>+ Aggiungi sopralluogo</Btn>
          {sopra.map(s=>(
            <Crd key={s.id}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <STit>Sopralluogo</STit>
                <button onClick={()=>setSopra(p=>p.filter(x=>x.id!==s.id))} style={{background:"none",border:"none",cursor:"pointer",color:C.danger,fontSize:18}}>×</button>
              </div>
              <Fld label="Soggetto"><select value={s.soggetto} onChange={e=>updSp(s.id,"soggetto",e.target.value)} style={iF}>{VISITATORI.map(v=><option key={v}>{v}</option>)}</select></Fld>
              <Fld label="Ente"><input value={s.ente} onChange={e=>updSp(s.id,"ente",e.target.value)} style={iF}/></Fld>
              <Row2>
                <Fld label="Ora ingresso" half><input type="time" value={s.oraIngresso} onChange={e=>updSp(s.id,"oraIngresso",e.target.value)} style={iF}/></Fld>
                <Fld label="Ora uscita" half><input type="time" value={s.oraUscita} onChange={e=>updSp(s.id,"oraUscita",e.target.value)} style={iF}/></Fld>
              </Row2>
              <Fld label="Finalità"><input value={s.finalita} onChange={e=>updSp(s.id,"finalita",e.target.value)} style={iF}/></Fld>
              <Fld label="Prescrizioni"><textarea value={s.prescrizioni} onChange={e=>updSp(s.id,"prescrizioni",e.target.value)} rows={2} style={{...iF,resize:"vertical"}}/></Fld>
              <Fld label="Esito"><select value={s.esito} onChange={e=>updSp(s.id,"esito",e.target.value)} style={iF}>{ESITI.map(e=><option key={e}>{e}</option>)}</select></Fld>
            </Crd>
          ))}
        </>}

        {tab==="sospensione"&&<>
          <Crd><STit>Sospensione</STit>
            <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",fontSize:13,padding:"6px 0"}}>
              <input type="checkbox" checked={sospeso} onChange={e=>setSospeso(e.target.checked)}/> Lavori sospesi in questa giornata
            </label>
            {sospeso&&<div style={{marginTop:10,borderTop:`0.5px solid ${C.bord}`,paddingTop:10}}>
              <Fld label="Causa"><select value={causaSosp} onChange={e=>setCausa(e.target.value)} style={iF}><option>Causa meteorologica</option><option>Altro</option></select></Fld>
              {causaSosp==="Altro"&&<Fld label="Specifica"><textarea value={altroMot} onChange={e=>setAltroMot(e.target.value)} rows={2} style={{...iF,resize:"vertical"}}/></Fld>}
            </div>}
          </Crd>
          <Crd><STit>Ripresa</STit>
            <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",fontSize:13,padding:"6px 0"}}>
              <input type="checkbox" checked={ripresa} onChange={e=>setRipresa(e.target.checked)}/> Lavori ripresi in questa giornata
            </label>
            {ripresa&&<div style={{marginTop:10,borderTop:`0.5px solid ${C.bord}`,paddingTop:10}}>
              <Fld label="Data ripresa"><input type="date" value={dataRip} onChange={e=>setDataRip(e.target.value)} style={iF}/></Fld>
              <Fld label="Motivazione"><input value={motRip} onChange={e=>setMotRip(e.target.value)} style={iF}/></Fld>
              <Fld label="Note"><textarea value={noteRip} onChange={e=>setNoteRip(e.target.value)} rows={2} style={{...iF,resize:"vertical"}}/></Fld>
            </div>}
          </Crd>
        </>}

        {tab==="foto"&&<>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handlePh} style={{display:"none"}}/>
          <Btn v="sec" full onClick={()=>fileRef.current.click()} style={{marginBottom:12}}>+ Aggiungi foto</Btn>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8}}>
            {photos.map(p=>(
              <div key={p.id} style={{position:"relative"}}>
                <img src={p.data} alt={p.name} style={{width:"100%",borderRadius:"var(--border-radius-md)",display:"block",aspectRatio:"4/3",objectFit:"cover"}}/>
                <button onClick={()=>setPhotos(ps=>ps.filter(x=>x.id!==p.id))} style={{position:"absolute",top:4,right:4,background:"rgba(0,0,0,0.55)",color:"#fff",border:"none",borderRadius:"50%",width:22,height:22,cursor:"pointer",fontSize:14,lineHeight:"22px",textAlign:"center",padding:0}}>×</button>
              </div>
            ))}
          </div>
        </>}

        <Row2 style={{marginTop:20}}>
          <Btn v="sec" onClick={onCancel} style={{flex:1}}>Annulla</Btn>
          <Btn onClick={save} style={{flex:2}}>{isEdit?"Salva modifiche":isRevisione?"Crea revisione":"Salva giornale"}</Btn>
        </Row2>
      </Pad>
    </PageWrap>
  );
}

/* ─── VIEW GIORNALE ─────────────────────────── */
function ViewGiornale({ g, cantiere, isDL, db, role, cantiereGiornali, onBack, onEdit, onNuovaRevisione, onUpdate, onLogout, session }) {
  const [tab,setTab]=useState("riepilogo");
  const [riserva,setRiserva]=useState("");
  const ditte=db?.ditte||[];
  const curDitta=ditte.find(d=>d.id===session?.dittaId);
  const ditFirmaImg=curDitta?db.firmeDitte?.[curDitta.id]:null;
  const opG=groupByDitta(g.operaiPresenti||[],ditte);
  const mG=groupByDitta(g.mezziUsati||[],ditte);
  const bloccato=g.bloccato;
  const canEdit=isDL&&!bloccato;
  const canRevision=isDL&&bloccato;

  const checkLock=patch=>{
    const updated={...g,...patch};
    if(updated.firmaDL&&updated.firmaImpresa&&!updated.bloccato) patch.bloccato=true;
    onUpdate(patch);
  };
  const applyFirmaDL=()=>{if(!db.firmaDL_img)return alert("Prima registra la firma DL nelle Impostazioni → Firme.");checkLock({firmaDL:true});};
  const applyFirmaImpresa=()=>{if(!ditFirmaImg)return alert("Firma non registrata. Contatta la DL.");checkLock({firmaImpresa:true,firmaImpresaDitta:curDitta?.nome||"",firmaImpresaImg:ditFirmaImg});};
  const exportPDF=()=>{const w=window.open("","_blank");w.document.write(buildPDF(g,cantiere,ditte,db.firmaDL_img,db.firmeDitte||{}));w.document.close();w.focus();setTimeout(()=>w.print(),600);};

  const TTABS=[["riepilogo","Riepilogo"],["operai","Operai"],["mezzi","Mezzi"],["sopralluoghi","Sopralluoghi"],["sosp","Sosp./Ripresa"],["riserve","Riserve"],["firme","Firme"]];

  return (
    <PageWrap>
      <TopBar title={`N. ${g.displayNum} — ${g.data}`} role={role} onBack={onBack} onLogout={onLogout}
        extra={<div style={{display:"flex",gap:6}}>
          {canEdit&&<Btn v="ghost" sm onClick={onEdit}>✏</Btn>}
          {canRevision&&<Btn v="ghost" sm onClick={onNuovaRevisione}>⊕ Rev.</Btn>}
          {isDL&&<button onClick={exportPDF} style={{background:"none",border:"none",cursor:"pointer",color:C.txt2,fontSize:18,padding:"0 4px"}} title="Esporta PDF">⬇</button>}
        </div>}/>
      <Tabs items={TTABS} active={tab} onChange={setTab}/>
      <Pad>
        {tab==="riepilogo"&&<>
          <div style={{...cardS,marginBottom:12,display:"flex",gap:14,alignItems:"center"}}>
            <span style={{fontSize:38}}>{METEO_ICON[g.meteo]||"📋"}</span>
            <div>
              <div style={{fontWeight:600,fontSize:15}}>{g.meteo}</div>
              <div style={{fontSize:13,color:C.txt2}}>{g.data}{(g.tempMin||g.tempMax)?` • ${g.tempMin||"?"}°/${g.tempMax||"?"}°C`:""}</div>
              <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
                {g.revisioneN>0&&<Bdg c="yellow">Rev. {g.revisioneN}</Bdg>}
                {g.sospeso&&<Bdg c="yellow">Sospeso</Bdg>}
                {bloccato&&<Bdg c="green">Firmato ✓</Bdg>}
                <Bdg>{g.operaiPresenti?.length||0} operai</Bdg>
                <Bdg>{g.mezziUsati?.length||0} mezzi</Bdg>
              </div>
            </div>
          </div>
          {bloccato&&<div style={{background:C.okL,borderRadius:"var(--border-radius-md)",padding:"10px 14px",marginBottom:12,fontSize:13,color:C.ok}}>📌 Giornale bloccato. Per modifiche crea una revisione.</div>}
          <Crd><STit>Cantiere</STit>
            <KV label="Oggetto" val={cantiere?.oggetto}/><KV label="Stazione" val={cantiere?.stazione}/>
            <KV label="DL" val={cantiere?.dl}/><KV label="Impresa" val={cantiere?.impresa}/>
          </Crd>
          {g.lavorazioni&&<Crd><STit>Lavorazioni</STit><p style={{fontSize:13,margin:0,whiteSpace:"pre-wrap"}}>{g.lavorazioni}</p></Crd>}
          {g.photos?.length>0&&<Crd><STit>Foto ({g.photos.length})</STit>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:8}}>
              {g.photos.map(p=><img key={p.id} src={p.data} alt={p.name} style={{width:"100%",borderRadius:"var(--border-radius-md)",aspectRatio:"4/3",objectFit:"cover"}}/>)}
            </div>
          </Crd>}
        </>}

        {tab==="operai"&&<>
          {opG.length===0&&<Emp>Nessun operaio registrato.</Emp>}
          {opG.map(grp=>(
            <div key={grp.id} style={{marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                {grp.id!=="__none__"&&<DittaAvatar nome={grp.label} size={24}/>}
                <span style={{fontWeight:600,fontSize:13}}>{grp.label}</span><Bdg c="blue">{grp.items.length}</Bdg>
              </div>
              <Crd style={{padding:"4px 14px"}}>
                {grp.items.map((o,i)=>(
                  <div key={o.id} style={{display:"flex",alignItems:"center",borderBottom:i<grp.items.length-1?`0.5px solid ${C.bord}`:"none",padding:"9px 0"}}>
                    <span style={{flex:1,fontWeight:600,fontSize:13}}>{o.nome}</span>
                    <span style={{fontSize:12,color:C.txt2,marginRight:12}}>{o.qualifica}</span>
                    <Bdg>{o.ore}h</Bdg>
                  </div>
                ))}
              </Crd>
            </div>
          ))}
        </>}

        {tab==="mezzi"&&<>
          {mG.length===0&&<Emp>Nessun mezzo registrato.</Emp>}
          {mG.map(grp=>(
            <div key={grp.id} style={{marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                {grp.id!=="__none__"&&<DittaAvatar nome={grp.label} size={24}/>}
                <span style={{fontWeight:600,fontSize:13}}>{grp.label}</span><Bdg>{grp.items.length}</Bdg>
              </div>
              <Crd style={{padding:"4px 14px"}}>
                {grp.items.map((m,i)=>(
                  <div key={m.id} style={{padding:"9px 0",borderBottom:i<grp.items.length-1?`0.5px solid ${C.bord}`:"none"}}>
                    <div style={{fontWeight:600,fontSize:13}}>{m.nome}</div>
                    <div style={{fontSize:11,color:C.txt2}}>{m.tipo}{m.modello?` • ${m.modello}`:""}{m.targa?` • ${m.targa}`:""}</div>
                  </div>
                ))}
              </Crd>
            </div>
          ))}
        </>}

        {tab==="sopralluoghi"&&<>
          {!g.sopralluoghi?.length&&<Emp>Nessun sopralluogo registrato.</Emp>}
          {g.sopralluoghi?.map(s=>(
            <Crd key={s.id}>
              <div style={{fontWeight:600,marginBottom:8}}>{s.soggetto}{s.ente?` — ${s.ente}`:""}</div>
              <KV label="Ingresso" val={s.oraIngresso}/><KV label="Uscita" val={s.oraUscita}/>
              <KV label="Finalità" val={s.finalita}/>
              {s.prescrizioni&&<p style={{fontSize:13,margin:"8px 0 0",whiteSpace:"pre-wrap"}}>{s.prescrizioni}</p>}
              <div style={{marginTop:8}}>
                {s.esito==="Positivo"&&<Bdg c="green">Positivo</Bdg>}
                {s.esito==="Positivo con riserve"&&<Bdg c="yellow">Positivo con riserve</Bdg>}
                {s.esito==="Negativo/Sospensione"&&<Bdg c="red">Negativo/Sospensione</Bdg>}
              </div>
            </Crd>
          ))}
        </>}

        {tab==="sosp"&&<>
          <Crd><STit>Sospensione</STit>{g.sospeso?<><KV label="Stato" val="Sospeso"/><KV label="Causa" val={g.causaSosp==="Altro"?g.altroMotivo:g.causaSosp}/></>:<Emp>Nessuna sospensione.</Emp>}</Crd>
          <Crd><STit>Ripresa</STit>{g.ripresa?<><KV label="Data" val={g.dataRipresa}/><KV label="Motivazione" val={g.motivoRipresa}/></>:<Emp>Nessuna ripresa.</Emp>}</Crd>
        </>}

        {tab==="riserve"&&<>
          <Crd><STit>Riserve dell'impresa</STit>
            {!g.riserve?.length&&<p style={{fontSize:13,color:C.txt3,margin:0}}>Nessuna riserva.</p>}
            {g.riserve?.map(r=>(
              <div key={r.id} style={{borderBottom:`0.5px solid ${C.bord}`,padding:"8px 0"}}>
                <div style={{fontSize:11,color:C.txt3}}>{r.data}</div>
                <div style={{fontSize:13,marginTop:2}}>{r.testo}</div>
              </div>
            ))}
          </Crd>
          {!isDL&&!g.firmaImpresa&&<>
            <textarea value={riserva} onChange={e=>setRiserva(e.target.value)} rows={3} placeholder="Scrivi una riserva..." style={{...iF,marginBottom:8,resize:"vertical"}}/>
            <Btn full onClick={()=>{if(!riserva.trim())return;onUpdate({riserve:[...(g.riserve||[]),{id:genId(),testo:riserva.trim(),data:todayStr()}]});setRiserva("");}}>Aggiungi riserva</Btn>
          </>}
          {isDL&&<p style={{fontSize:12,color:C.txt3}}>Solo la ditta può aggiungere riserve.</p>}
        </>}

        {tab==="firme"&&<>
          <Crd><STit>Stato firme</STit>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",padding:"12px 0",borderBottom:`0.5px solid ${C.bord}`,gap:10}}>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600}}>Direzione Lavori</div>
                {g.firmaDL&&db.firmaDL_img&&<img src={db.firmaDL_img} alt="Firma DL" style={{maxHeight:50,maxWidth:140,marginTop:8,display:"block",border:`0.5px solid ${C.bord}`,borderRadius:"var(--border-radius-md)"}}/>}
              </div>
              {g.firmaDL?<Bdg c="green">Firmato ✓</Bdg>
                :isDL?<Btn sm onClick={applyFirmaDL} disabled={!db.firmaDL_img}>Firma</Btn>
                :<span style={{fontSize:12,color:C.txt3}}>In attesa</span>}
            </div>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",padding:"12px 0",gap:10}}>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600}}>Impresa{g.firmaImpresaDitta?` (${g.firmaImpresaDitta})`:""}</div>
                {g.firmaImpresa&&g.firmaImpresaImg&&<img src={g.firmaImpresaImg} alt="Firma impresa" style={{maxHeight:50,maxWidth:140,marginTop:8,display:"block",border:`0.5px solid ${C.bord}`,borderRadius:"var(--border-radius-md)"}}/>}
              </div>
              {g.firmaImpresa?<Bdg c="green">Firmato ✓</Bdg>
                :!isDL&&curDitta?<Btn sm onClick={applyFirmaImpresa} disabled={!ditFirmaImg}>Firma</Btn>
                :isDL?<span style={{fontSize:12,color:C.txt3}}>In attesa impresa</span>
                :<span style={{fontSize:12,color:C.warn}}>Firma non registrata</span>}
            </div>
          </Crd>
          {!db.firmaDL_img&&isDL&&<div style={{background:C.warnL,borderRadius:"var(--border-radius-md)",padding:"10px 14px",marginBottom:12,fontSize:13,color:C.warn}}>⚠ Prima registra la firma DL nelle Impostazioni → Firme.</div>}
          {bloccato&&<>
            <div style={{background:C.okL,borderRadius:"var(--border-radius-md)",padding:"10px 14px",marginBottom:12,fontSize:13,color:C.ok,textAlign:"center"}}>✅ Firmato da entrambe le parti</div>
            {isDL&&<Btn full onClick={exportPDF}>⬇ Esporta PDF</Btn>}
          </>}
          {!bloccato&&isDL&&<p style={{fontSize:12,color:C.txt3,textAlign:"center"}}>Il PDF sarà disponibile dopo la firma di entrambe le parti.</p>}
        </>}
      </Pad>
    </PageWrap>
  );
}

/* ─── PDF ───────────────────────────────────── */
function buildPDF(g, c, ditte, firmaDLImg, firmeDitte) {
  const sec=(t,b)=>`<div class="s"><h3>${t}</h3><div class="sb">${b}</div></div>`;
  const row=(l,v)=>v?`<tr><td class="l">${l}</td><td>${v}</td></tr>`:"";
  const opG=groupByDitta(g.operaiPresenti||[],ditte);
  const mG=groupByDitta(g.mezziUsati||[],ditte);
  const opH=opG.map(gr=>`<b>${gr.label}</b><table><tr><th>Nome</th><th>Qualifica</th><th>Ore</th></tr>${gr.items.map(o=>`<tr><td>${o.nome}</td><td>${o.qualifica}</td><td>${o.ore}h</td></tr>`).join("")}</table>`).join("")||"<p>Nessuno</p>";
  const mH=mG.map(gr=>`<b>${gr.label}</b><table>${gr.items.map(m=>`<tr><td>${m.nome}</td><td>${m.tipo}</td><td>${m.modello||""}</td><td>${m.targa||""}</td></tr>`).join("")}</table>`).join("")||"<p>Nessuno</p>";
  const soH=g.sopralluoghi?.map(s=>`<b>${s.soggetto}${s.ente?` — ${s.ente}`:""}</b><table>${row("Ingresso",s.oraIngresso)+row("Uscita",s.oraUscita)+row("Finalità",s.finalita)+row("Esito",s.esito)}</table>${s.prescrizioni?`<p>${s.prescrizioni}</p>`:""}`).join("")||"<p>Nessuno</p>";
  const rH=g.riserve?.map(r=>`<p><small>${r.data}</small><br>${r.testo}</p>`).join("")||"<p>Nessuna.</p>";
  const pH=g.photos?.map(p=>`<img src="${p.data}" style="max-width:100%;height:auto;margin:8px 0;border-radius:4px;max-height:280px" alt=""/>`).join("")||"";
  const fBox=(lbl,nome,firmato,img)=>`<div class="fb"><b>${lbl}</b><br><small>${nome||""}</small><div class="fsig">${img?`<img src="${img}" alt="" style="max-height:55px;max-width:160px;display:block;margin-top:6px"/>`:firmato?"<b>FIRMATO</b>":""}</div></div>`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Giornale N.${g.displayNum}</title>
<style>*{box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:12px;color:#222;margin:20px}
h1{text-align:center;font-size:16px;margin-bottom:4px}h2{text-align:center;font-size:13px;color:#555;margin-bottom:16px}
h3{background:#2563EB;color:#fff;font-size:13px;padding:5px 10px;margin:0}
.s{border:1px solid #ccc;border-radius:4px;margin-bottom:12px;overflow:hidden}.sb{padding:8px 10px}
table{width:100%;border-collapse:collapse}td,th{padding:4px 6px;border-bottom:1px solid #eee;text-align:left}td.l{color:#666;width:42%}
.firme{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.fb{border:1px solid #ccc;padding:10px;border-radius:4px;min-height:85px}
.fsig{margin-top:6px;min-height:55px}
@media print{body{margin:10px}.s{page-break-inside:avoid}}
</style></head><body>
<h1>Giornale dei Lavori Pubblici</h1>
<h2>N. ${g.displayNum} — ${g.data}${g.revisioneN>0?` (Revisione ${g.revisioneN})`:""}</h2>
${sec("Cantiere",`<table>${row("Oggetto",c?.oggetto)+row("Stazione",c?.stazione)+row("RUP",c?.rup)+row("DL",c?.dl)+row("Impresa",c?.impresa)+row("CIG",c?.cig)+row("CUP",c?.cup)+row("Luogo",c?.luogo)}</table>`)}
${sec("Meteo",`<table><tr><td class="l">Condizioni</td><td>${METEO_ICON[g.meteo]||""} ${g.meteo}</td></tr><tr><td class="l">Temperatura</td><td>${g.tempMin||"—"}° — ${g.tempMax||"—"}°C</td></tr></table>`)}
${sec("Lavorazioni",`<p style="white-space:pre-wrap">${g.lavorazioni||"—"}</p>`)}
${sec("Operai presenti",opH)}${sec("Mezzi utilizzati",mH)}
${g.sospeso?sec("Sospensione",`<table>${row("Causa",g.causaSosp==="Altro"?g.altroMotivo:g.causaSosp)}</table>`):""}
${g.ripresa?sec("Ripresa",`<table>${row("Data",g.dataRipresa)+row("Motivazione",g.motivoRipresa)}</table>`):""}
${sec("Sopralluoghi",soH)}${sec("Riserve",rH)}
${pH?sec("Foto",`<div>${pH}</div>`):""}
${sec("Firme",`<div class="firme">${fBox("Direzione Lavori",c?.dl,g.firmaDL,firmaDLImg||"")}${fBox("Impresa esecutrice",g.firmaImpresaDitta||c?.impresa,g.firmaImpresa,g.firmaImpresaImg||"")}</div>`)}
</body></html>`;
}
