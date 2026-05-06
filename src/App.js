import React, { useState, useRef, useEffect, useCallback } from "react";

const SUPABASE_URL = "https://urufyzjaodhclbptpoxc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVydWZ5emphb2RoY2xicHRwb3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDgyNjYsImV4cCI6MjA5MzI4NDI2Nn0.ZY-rHey4EKoyehhp56FeY-ZFFxrZugF2qViYv4ohf5k";
const H = { "Content-Type":"application/json", "apikey":SUPABASE_KEY, "Authorization":`Bearer ${SUPABASE_KEY}`, "Prefer":"resolution=merge-duplicates" };

async function dbGet(table) { const r=await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`,{headers:H}); return r.ok?r.json():[]; }
async function dbUpsert(table,row) { await fetch(`${SUPABASE_URL}/rest/v1/${table}`,{method:"POST",headers:H,body:JSON.stringify(row)}); }
async function dbDelete(table,id) { await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`,{method:"DELETE",headers:H}); }

const ROLES={DL:"dl",IMPRESA:"impresa"};
const PASS={dl:"Dl01",impresa:"Impresa01"};
const genId=()=>Math.random().toString(36).slice(2,10);
const today=()=>new Date().toISOString().slice(0,10);
const QUALIFICHE=["Operaio comune","Operaio specializzato","Caposquadra","Gruista","Carpentiere","Ferraiolo","Muratore","Elettricista","Idraulico","Topografo"];
const TIPI_MEZZO=["Escavatore","Gru","Camion","Bobcat/Minipala","Autocarro","Dumper","Betoniera","Pompa calcestruzzo","Compressore","Rullo compattatore","Piattaforma aerea","Carrello elevatore","Trattore","Motopompa","Altro"];
const VISITATORI=["DL","RUP","Collaudatore","Coordinatore Sicurezza (CSE)","Ispettorato del Lavoro","Tecnici Enti Erogatori","Altro"];
const ESITI=["Positivo","Positivo con riserve","Negativo/Sospensione"];
const METEO_OPTIONS=["Sereno","Parzialmente nuvoloso","Nuvoloso","Pioggia leggera","Pioggia intensa","Temporale","Neve","Nebbia","Vento forte"];

export default function App() {
  const [role,setRole]=useState(null);
  const [view,setView]=useState("login");
  const [cantieri,setCantieri]=useState([]);
  const [imprese,setImprese]=useState([]);
  const [giornali,setGiornali]=useState([]);
  const [impostazioni,setImpostazioni]=useState({firmaDLImmagine:null,firmeImprese:[]});
  const [cantiereId,setCantiereId]=useState(null);
  const [giornaleId,setGiornaleId]=useState(null);
  const [loading,setLoading]=useState(false);

  const loadAll=useCallback(async()=>{
    setLoading(true);
    const [c,i,g,imp]=await Promise.all([dbGet("cantieri"),dbGet("imprese"),dbGet("giornali"),dbGet("impostazioni")]);
    setCantieri(c.map(x=>({id:x.id,...x.data})));
    setImprese(i.map(x=>({id:x.id,...x.data})));
    setGiornali(g.map(x=>({id:x.id,cantiere_id:x.cantiere_id,...x.data})));
    const s=imp.find(x=>x.id==="global");
    if(s) setImpostazioni({firmaDLImmagine:null,firmeImprese:[],...s.data});
    setLoading(false);
  },[]);

  useEffect(()=>{if(role)loadAll();},[role,loadAll]);

  const saveCantiere=async(c)=>{await dbUpsert("cantieri",{id:c.id,data:c});await loadAll();};
  const delCantiere=async(id)=>{await dbDelete("cantieri",id);await loadAll();};
  const saveImpresa=async(i)=>{await dbUpsert("imprese",{id:i.id,data:i});await loadAll();};
  const delImpresa=async(id)=>{await dbDelete("imprese",id);await loadAll();};
  const saveGiornale=async(g)=>{await dbUpsert("giornali",{id:g.id,cantiere_id:g.cantiereId,data:g});await loadAll();};
  const saveImpostazioni=async(imp)=>{setImpostazioni(imp);await dbUpsert("impostazioni",{id:"global",data:imp});};

  const nav=(v)=>setView(v);
  const cantiere=cantieri.find(c=>c.id===cantiereId);
  const giornale=giornali.find(g=>g.id===giornaleId);
  const cantiereGiornali=giornali.filter(g=>g.cantiereId===cantiereId);

  // firma impresa precaricata per il cantiere corrente
  const firmaImpresaPrecaricata=(impostazioni.firmeImprese||[]).find(f=>f.impresaNome===cantiere?.impresa)?.immagine||null;

  if(view==="login") return <LoginScreen onLogin={(r)=>{setRole(r);nav("cantieri");}}/>;

  const Header=({title,back,extra})=>(
    <div style={{display:"flex",alignItems:"center",gap:8,padding:"12px 16px",borderBottom:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-primary)",position:"sticky",top:0,zIndex:10}}>
      {back&&<button onClick={()=>nav(back)} style={btnIcon}>←</button>}
      <span style={{fontWeight:500,fontSize:15,flex:1}}>{title}</span>
      {extra}
      {loading&&<span style={{fontSize:11,color:"var(--color-text-tertiary)"}}>⏳</span>}
      <span style={{fontSize:11,color:"var(--color-text-tertiary)",background:"var(--color-background-secondary)",padding:"2px 8px",borderRadius:12,border:"0.5px solid var(--color-border-tertiary)"}}>{role==="dl"?"DL":"Impresa"}</span>
      <button onClick={()=>{setRole(null);nav("login");}} style={{...btnIcon,fontSize:12}}>Esci</button>
    </div>
  );

  if(view==="cantieri") return (
    <div style={pageWrap}>
      <Header title="I miei cantieri"/>
      <div style={{padding:16}}>
        {role===ROLES.DL&&<DashedBtn onClick={()=>nav("nuovo_cantiere")}>+ Nuovo cantiere</DashedBtn>}
        {cantieri.length===0&&!loading&&<Empty>Nessun cantiere. Creane uno!</Empty>}
        {loading&&<Empty>Caricamento...</Empty>}
        {cantieri.map(c=>(
          <div key={c.id} onClick={()=>{setCantiereId(c.id);nav("dashboard");}} style={cardClickable}>
            <div style={{fontWeight:500,fontSize:15}}>{c.oggetto||"Cantiere senza nome"}</div>
            <div style={{fontSize:12,color:"var(--color-text-secondary)",marginTop:3}}>{c.stazione}{c.cig?` • CIG: ${c.cig}`:""}</div>
            <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginTop:2}}>Luogo: {c.luogo||"—"} • Giornali: {giornali.filter(g=>g.cantiereId===c.id).length}</div>
          </div>
        ))}
        {role===ROLES.DL&&<>
          <SecBtn onClick={()=>nav("imprese")} style={{marginTop:8}}>Gestione Imprese e Anagrafica</SecBtn>
          <SecBtn onClick={()=>nav("impostazioni_firma")} style={{marginTop:8}}>Impostazioni firme</SecBtn>
        </>}
      </div>
    </div>
  );

  if(view==="nuovo_cantiere") return <FormCantiere onSave={async c=>{await saveCantiere({...c,id:genId()});nav("cantieri");}} onCancel={()=>nav("cantieri")}/>;
  if(view==="modifica_cantiere") return <FormCantiere initial={cantiere} onSave={async c=>{await saveCantiere({...cantiere,...c});nav("dashboard");}} onCancel={()=>nav("dashboard")}/>;
  if(view==="imprese") return <ImpreseScreen imprese={imprese} onSave={saveImpresa} onDel={delImpresa} onBack={()=>nav("cantieri")}/>;
  if(view==="impostazioni_firma") return <ImpostazioniFirma impostazioni={impostazioni} imprese={imprese} onSave={saveImpostazioni} onBack={()=>nav("cantieri")}/>;

  if(view==="dashboard"&&cantiere) return (
    <div style={pageWrap}>
      <Header title={cantiere.oggetto||"Cantiere"} back="cantieri"/>
      <div style={{padding:16}}>
        <Card>
          <Row label="Stazione appaltante" value={cantiere.stazione}/>
          <Row label="RUP" value={cantiere.rup}/>
          <Row label="Direttore dei Lavori" value={cantiere.dl}/>
          <Row label="Impresa esecutrice" value={cantiere.impresa}/>
          <Row label="CIG" value={cantiere.cig}/>
          <Row label="CUP" value={cantiere.cup}/>
          <Row label="Luogo" value={cantiere.luogo}/>
        </Card>
        {role===ROLES.DL&&<SecBtn onClick={()=>nav("modifica_cantiere")} style={{marginBottom:8}}>Modifica dati cantiere</SecBtn>}
        {role===ROLES.DL&&<SecBtn onClick={async()=>{if(window.confirm("Eliminare questo cantiere e tutti i suoi giornali?")){await delCantiere(cantiere.id);const ids=cantiereGiornali.map(g=>g.id);for(const id of ids)await dbDelete("giornali",id);nav("cantieri");}}} style={{marginBottom:10,color:"var(--color-text-danger)",borderColor:"var(--color-text-danger)"}}>Elimina cantiere</SecBtn>}
        <SecBtn onClick={()=>nav("lista_giornali")}>Giornali dei lavori ({cantiereGiornali.length})</SecBtn>
        {role===ROLES.DL&&<PrimBtn onClick={()=>nav("nuovo_giornale")} style={{marginTop:10}}>+ Nuovo giornale</PrimBtn>}
      </div>
    </div>
  );

  if(view==="lista_giornali") return (
    <div style={pageWrap}>
      <Header title="Giornali dei lavori" back="dashboard"/>
      <div style={{padding:16}}>
        {cantiereGiornali.length===0&&<Empty>Nessun giornale ancora.</Empty>}
        {[...cantiereGiornali].reverse().map(g=>(
          <div key={g.id} onClick={()=>{setGiornaleId(g.id);nav("view_giornale");}} style={cardClickable}>
            <div style={{fontWeight:500}}>N. {g.numero} — {g.data}</div>
            <div style={{fontSize:12,color:"var(--color-text-secondary)",marginTop:3}}>{g.sospeso?"⏸ Sospeso":"▶ In corso"} • {g.operaiPresenti?.length||0} operai • {g.mezziUsati?.length||0} mezzi</div>
            <div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap"}}>
              {g.firmaDL&&<Badge color="blue">DL firmato</Badge>}
              {g.firmaImpresa&&<Badge color="green">Impresa firmata</Badge>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if(view==="nuovo_giornale") return <GiornaleForm cantiere={cantiere} imprese={imprese} numero={cantiereGiornali.length+1} onSave={async g=>{await saveGiornale({...g,id:genId(),cantiereId});nav("lista_giornali");}} onCancel={()=>nav("lista_giornali")}/>;
  if(view==="modifica_giornale"&&giornale) return <GiornaleForm cantiere={cantiere} imprese={imprese} initial={giornale} onSave={async g=>{await saveGiornale({...giornale,...g,firmaDL:false});nav("view_giornale");}} onCancel={()=>nav("view_giornale")}/>;
  if(view==="view_giornale"&&giornale) return <ViewGiornale g={giornale} cantiere={cantiere} role={role} impostazioni={impostazioni} firmaImpresaPrecaricata={firmaImpresaPrecaricata} onBack={()=>nav("lista_giornali")} onModifica={()=>nav("modifica_giornale")} onUpdate={async patch=>{await saveGiornale({...giornale,...patch});await loadAll();}}/>;

  return <div style={{padding:24}}>Vista non trovata</div>;
}

// ── LOGIN ─────────────────────────────────────────────────
function LoginScreen({onLogin}) {
  const [sel,setSel]=useState(null);const [pwd,setPwd]=useState("");const [err,setErr]=useState("");
  const doLogin=()=>{if(!sel)return setErr("Seleziona un ruolo.");if(!pwd)return setErr("Inserisci la password.");if(pwd!==PASS[sel])return setErr("Password errata.");onLogin(sel);};
  return (
    <div style={{fontFamily:"var(--font-sans)",minHeight:"100vh",background:"var(--color-background-tertiary)",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{background:"var(--color-background-primary)",borderRadius:"var(--border-radius-lg)",border:"0.5px solid var(--color-border-tertiary)",padding:32,width:"100%",maxWidth:360}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:36,marginBottom:10}}>🏗</div>
          <div style={{fontSize:18,fontWeight:500}}>Giornale dei Lavori Pubblici</div>
          <div style={{fontSize:13,color:"var(--color-text-secondary)",marginTop:4}}>Accedi al tuo profilo</div>
        </div>
        <p style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:8}}>Seleziona il tuo ruolo:</p>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          {[{k:"dl",l:"Direzione Lavori"},{k:"impresa",l:"Impresa"}].map(({k,l})=>(
            <button key={k} onClick={()=>{setSel(k);setErr("");}} style={{flex:1,padding:"11px 0",borderRadius:"var(--border-radius-md)",border:sel===k?"2px solid #185FA5":"0.5px solid var(--color-border-tertiary)",background:sel===k?"#E6F1FB":"var(--color-background-secondary)",cursor:"pointer",fontWeight:sel===k?500:400,fontSize:13,color:sel===k?"#185FA5":"var(--color-text-primary)"}}>{l}</button>
          ))}
        </div>
        <input type="password" placeholder="Password" value={pwd} onChange={e=>{setPwd(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&doLogin()} style={{width:"100%",boxSizing:"border-box",marginBottom:6}}/>
        {err&&<div style={{fontSize:12,color:"var(--color-text-danger)",marginBottom:8}}>{err}</div>}
        <button onClick={doLogin} style={{width:"100%",padding:"12px",borderRadius:"var(--border-radius-md)",background:"#185FA5",color:"#fff",border:"none",cursor:"pointer",fontSize:14,fontWeight:500,marginTop:4}}>Accedi</button>
      </div>
    </div>
  );
}

// ── IMPOSTAZIONI FIRME ────────────────────────────────────
function ImpostazioniFirma({impostazioni,imprese,onSave,onBack}) {
  const dlRef=useRef();
  const impRefs=useRef({});
  const firmeImprese=impostazioni.firmeImprese||[];

  const handleDL=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>onSave({...impostazioni,firmaDLImmagine:ev.target.result});r.readAsDataURL(f);};
  const handleImpresa=(nome,e)=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{const aggiornate=firmeImprese.filter(x=>x.impresaNome!==nome);onSave({...impostazioni,firmeImprese:[...aggiornate,{impresaNome:nome,immagine:ev.target.result}]});};r.readAsDataURL(f);};
  const rimuoviFirmaImpresa=(nome)=>onSave({...impostazioni,firmeImprese:firmeImprese.filter(x=>x.impresaNome!==nome)});

  return (
    <div style={pageWrap}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",borderBottom:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-primary)"}}>
        <button onClick={onBack} style={btnIcon}>←</button>
        <span style={{fontWeight:500,fontSize:15}}>Impostazioni firme</span>
      </div>
      <div style={{padding:16}}>
        {/* FIRMA DL */}
        <Card>
          <SectionTitle>Firma Direzione Lavori</SectionTitle>
          <p style={{fontSize:13,color:"var(--color-text-secondary)",marginBottom:12}}>Carica la firma della DL una sola volta. Verrà applicata automaticamente su tutti i dispositivi.</p>
          {impostazioni.firmaDLImmagine
            ? <>
                <img src={impostazioni.firmaDLImmagine} alt="Firma DL" style={{maxWidth:"100%",maxHeight:120,border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-md)",display:"block",marginBottom:12}}/>
                <div style={{display:"flex",gap:8}}>
                  <SecBtn onClick={()=>onSave({...impostazioni,firmaDLImmagine:null})} style={{flex:1}}>Rimuovi</SecBtn>
                  <PrimBtn onClick={()=>dlRef.current.click()} style={{flex:1}}>Sostituisci</PrimBtn>
                </div>
              </>
            : <>
                <div style={{border:"0.5px dashed var(--color-border-secondary)",borderRadius:"var(--border-radius-md)",padding:"24px 16px",textAlign:"center",marginBottom:12,color:"var(--color-text-tertiary)",fontSize:13}}>Nessuna firma caricata</div>
                <PrimBtn onClick={()=>dlRef.current.click()}>Carica firma DL (JPG, PNG…)</PrimBtn>
              </>}
          <input ref={dlRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleDL}/>
        </Card>

        {/* FIRME IMPRESE */}
        <p style={{fontWeight:500,fontSize:14,margin:"8px 0 12px"}}>Firme Imprese</p>
        {imprese.length===0&&<Empty>Nessuna impresa in anagrafica.</Empty>}
        {imprese.map(imp=>{
          const firmaEsistente=firmeImprese.find(f=>f.impresaNome===imp.nome);
          if(!impRefs.current[imp.id]) impRefs.current[imp.id]=React.createRef();
          return (
            <Card key={imp.id}>
              <SectionTitle>{imp.nome}</SectionTitle>
              {firmaEsistente
                ? <>
                    <img src={firmaEsistente.immagine} alt={`Firma ${imp.nome}`} style={{maxWidth:"100%",maxHeight:100,border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-md)",display:"block",marginBottom:10}}/>
                    <div style={{display:"flex",gap:8}}>
                      <SecBtn onClick={()=>rimuoviFirmaImpresa(imp.nome)} style={{flex:1}}>Rimuovi</SecBtn>
                      <PrimBtn onClick={()=>impRefs.current[imp.id].current.click()} style={{flex:1}}>Sostituisci</PrimBtn>
                    </div>
                  </>
                : <>
                    <div style={{border:"0.5px dashed var(--color-border-secondary)",borderRadius:"var(--border-radius-md)",padding:"20px 16px",textAlign:"center",marginBottom:10,color:"var(--color-text-tertiary)",fontSize:13}}>Nessuna firma caricata</div>
                    <PrimBtn onClick={()=>impRefs.current[imp.id].current.click()}>Carica firma {imp.nome}</PrimBtn>
                  </>}
              <input ref={impRefs.current[imp.id]} type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleImpresa(imp.nome,e)}/>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── IMPRESE ───────────────────────────────────────────────
function ImpreseScreen({imprese,onSave,onDel,onBack}) {
  const [view,setView]=useState("lista");
  const [impresaId,setImpresaId]=useState(null);
  const [nome,setNome]=useState("");
  const [editId,setEditId]=useState(null);const [editNome,setEditNome]=useState("");
  const impresa=imprese.find(i=>i.id===impresaId);
  if(view==="lista") return (
    <div style={pageWrap}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",borderBottom:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-primary)"}}>
        <button onClick={onBack} style={btnIcon}>←</button>
        <span style={{fontWeight:500,fontSize:15}}>Gestione Imprese</span>
      </div>
      <div style={{padding:16}}>
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          <input value={nome} onChange={e=>setNome(e.target.value)} placeholder="Nome impresa" style={{flex:1}}/>
          <button onClick={async()=>{if(!nome.trim())return;await onSave({id:genId(),nome:nome.trim(),operai:[],mezzi:[]});setNome("");}} style={addBtn}>+</button>
        </div>
        {imprese.length===0&&<Empty>Nessuna impresa.</Empty>}
        {imprese.map(i=>(
          <div key={i.id} style={{...card,marginBottom:10}}>
            {editId===i.id
              ? <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <input value={editNome} onChange={e=>setEditNome(e.target.value)} style={{flex:1}}/>
                  <button onClick={()=>setEditId(null)} style={btnIcon}>✕</button>
                  <button onClick={async()=>{await onSave({...i,nome:editNome});setEditId(null);}} style={{padding:"6px 14px",background:"#185FA5",color:"#fff",border:"none",borderRadius:"var(--border-radius-md)",cursor:"pointer",fontSize:13}}>Salva</button>
                </div>
              : <div style={{display:"flex",alignItems:"center",cursor:"pointer"}} onClick={()=>{setImpresaId(i.id);setView("dettaglio");}}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:500,fontSize:15}}>{i.nome}</div>
                    <div style={{fontSize:12,color:"var(--color-text-secondary)",marginTop:2}}>{i.operai?.length||0} operai • {i.mezzi?.length||0} mezzi</div>
                  </div>
                  <button onClick={e=>{e.stopPropagation();setEditId(i.id);setEditNome(i.nome);}} style={{...btnIcon,fontSize:14,marginRight:4}}>✏️</button>
                  <button onClick={e=>{e.stopPropagation();if(window.confirm(`Eliminare ${i.nome}?`))onDel(i.id);}} style={delBtn}>×</button>
                </div>}
          </div>
        ))}
      </div>
    </div>
  );
  if(view==="dettaglio"&&impresa) return <AnagraficaImpresa impresa={impresa} onBack={()=>setView("lista")} onUpdate={async patch=>{await onSave({...impresa,...patch});}}/>;
  return null;
}

function AnagraficaImpresa({impresa,onBack,onUpdate}) {
  const [tab,setTab]=useState("operai");
  const [nome,setNome]=useState("");const [qualifica,setQualifica]=useState(QUALIFICHE[0]);
  const [mNome,setMNome]=useState("");const [mModello,setMModello]=useState("");const [mTarga,setMTarga]=useState("");const [mTipo,setMTipo]=useState(TIPI_MEZZO[0]);
  const [editOpId,setEditOpId]=useState(null);const [editOpNome,setEditOpNome]=useState("");const [editOpQ,setEditOpQ]=useState(QUALIFICHE[0]);
  const [editMId,setEditMId]=useState(null);const [editMNome,setEditMNome]=useState("");const [editMTipo,setEditMTipo]=useState(TIPI_MEZZO[0]);const [editMModello,setEditMModello]=useState("");const [editMTarga,setEditMTarga]=useState("");
  const startEditOp=o=>{setEditOpId(o.id);setEditOpNome(o.nome);setEditOpQ(o.qualifica);};
  const saveEditOp=async()=>{await onUpdate({operai:impresa.operai.map(x=>x.id===editOpId?{...x,nome:editOpNome,qualifica:editOpQ}:x)});setEditOpId(null);};
  const startEditM=m=>{setEditMId(m.id);setEditMNome(m.nome);setEditMTipo(m.tipo);setEditMModello(m.modello||"");setEditMTarga(m.targa||"");};
  const saveEditM=async()=>{await onUpdate({mezzi:impresa.mezzi.map(x=>x.id===editMId?{...x,nome:editMNome,tipo:editMTipo,modello:editMModello,targa:editMTarga.toUpperCase()}:x)});setEditMId(null);};
  return (
    <div style={pageWrap}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",borderBottom:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-primary)"}}>
        <button onClick={onBack} style={btnIcon}>←</button>
        <span style={{fontWeight:500,fontSize:15}}>{impresa.nome}</span>
      </div>
      <div style={{display:"flex",gap:8,padding:"8px 16px",background:"var(--color-background-primary)",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
        {["operai","mezzi"].map(t=><TabPill key={t} active={tab===t} onClick={()=>setTab(t)}>{t==="operai"?"Operai":"Mezzi"}</TabPill>)}
      </div>
      <div style={{padding:16}}>
        {tab==="operai"&&<>
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            <input value={nome} onChange={e=>setNome(e.target.value)} placeholder="Nome operaio" style={{flex:1}}/>
            <select value={qualifica} onChange={e=>setQualifica(e.target.value)} style={{flex:1}}>{QUALIFICHE.map(q=><option key={q}>{q}</option>)}</select>
            <button onClick={async()=>{if(!nome.trim())return;await onUpdate({operai:[...(impresa.operai||[]),{id:genId(),nome:nome.trim(),qualifica,impresaId:impresa.id,impresaNome:impresa.nome}]});setNome("");}} style={addBtn}>+</button>
          </div>
          {(!impresa.operai||impresa.operai.length===0)&&<Empty>Nessun operaio.</Empty>}
          {impresa.operai?.map(o=>(
            <div key={o.id} style={{...card,marginBottom:8}}>
              {editOpId===o.id
                ?<><Field label="Nome"><input value={editOpNome} onChange={e=>setEditOpNome(e.target.value)} style={{width:"100%",boxSizing:"border-box"}}/></Field>
                   <Field label="Qualifica"><select value={editOpQ} onChange={e=>setEditOpQ(e.target.value)} style={{width:"100%",boxSizing:"border-box"}}>{QUALIFICHE.map(q=><option key={q}>{q}</option>)}</select></Field>
                   <div style={{display:"flex",gap:8}}><SecBtn onClick={()=>setEditOpId(null)} style={{flex:1}}>Annulla</SecBtn><PrimBtn onClick={saveEditOp} style={{flex:1}}>Salva</PrimBtn></div></>
                :<div style={{display:"flex",alignItems:"center"}}>
                   <span style={{flex:1,fontWeight:500,fontSize:14}}>{o.nome}</span>
                   <span style={{fontSize:12,color:"var(--color-text-secondary)",marginRight:8}}>{o.qualifica}</span>
                   <button onClick={()=>startEditOp(o)} style={{...btnIcon,fontSize:14,marginRight:4}}>✏️</button>
                   <button onClick={async()=>{if(window.confirm(`Eliminare ${o.nome}?`))await onUpdate({operai:impresa.operai.filter(x=>x.id!==o.id)});}} style={delBtn}>×</button>
                 </div>}
            </div>
          ))}
        </>}
        {tab==="mezzi"&&<>
          <div style={{...card,marginBottom:12}}>
            <p style={{fontWeight:500,fontSize:13,margin:"0 0 10px"}}>Aggiungi mezzo</p>
            <Field label="Nome / Descrizione"><input value={mNome} onChange={e=>setMNome(e.target.value)} style={{width:"100%",boxSizing:"border-box"}}/></Field>
            <Field label="Tipo"><select value={mTipo} onChange={e=>setMTipo(e.target.value)} style={{width:"100%",boxSizing:"border-box"}}>{TIPI_MEZZO.map(t=><option key={t}>{t}</option>)}</select></Field>
            <Field label="Modello"><input value={mModello} onChange={e=>setMModello(e.target.value)} style={{width:"100%",boxSizing:"border-box"}}/></Field>
            <Field label="Targa"><input value={mTarga} onChange={e=>setMTarga(e.target.value)} style={{width:"100%",boxSizing:"border-box",textTransform:"uppercase"}}/></Field>
            <button onClick={async()=>{if(!mNome.trim())return;await onUpdate({mezzi:[...(impresa.mezzi||[]),{id:genId(),nome:mNome.trim(),tipo:mTipo,modello:mModello.trim(),targa:mTarga.trim().toUpperCase(),impresaId:impresa.id,impresaNome:impresa.nome}]});setMNome("");setMModello("");setMTarga("");}} style={{width:"100%",padding:"10px",borderRadius:"var(--border-radius-md)",background:"#185FA5",color:"#fff",border:"none",cursor:"pointer",fontSize:13,fontWeight:500}}>Aggiungi mezzo</button>
          </div>
          {(!impresa.mezzi||impresa.mezzi.length===0)&&<Empty>Nessun mezzo.</Empty>}
          {impresa.mezzi?.map(m=>(
            <div key={m.id} style={{...card,marginBottom:8}}>
              {editMId===m.id
                ?<><Field label="Nome"><input value={editMNome} onChange={e=>setEditMNome(e.target.value)} style={{width:"100%",boxSizing:"border-box"}}/></Field>
                   <Field label="Tipo"><select value={editMTipo} onChange={e=>setEditMTipo(e.target.value)} style={{width:"100%",boxSizing:"border-box"}}>{TIPI_MEZZO.map(t=><option key={t}>{t}</option>)}</select></Field>
                   <Field label="Modello"><input value={editMModello} onChange={e=>setEditMModello(e.target.value)} style={{width:"100%",boxSizing:"border-box"}}/></Field>
                   <Field label="Targa"><input value={editMTarga} onChange={e=>setEditMTarga(e.target.value)} style={{width:"100%",boxSizing:"border-box",textTransform:"uppercase"}}/></Field>
                   <div style={{display:"flex",gap:8}}><SecBtn onClick={()=>setEditMId(null)} style={{flex:1}}>Annulla</SecBtn><PrimBtn onClick={saveEditM} style={{flex:1}}>Salva</PrimBtn></div></>
                :<div style={{display:"flex",alignItems:"flex-start"}}>
                   <div style={{flex:1}}>
                     <div style={{fontWeight:500,fontSize:14}}>{m.nome}</div>
                     <div style={{fontSize:12,color:"var(--color-text-secondary)",marginTop:2}}>{m.tipo}{m.modello?` • ${m.modello}`:""}{m.targa?` • ${m.targa}`:""}</div>
                   </div>
                   <button onClick={()=>startEditM(m)} style={{...btnIcon,fontSize:14,marginRight:4}}>✏️</button>
                   <button onClick={async()=>{if(window.confirm(`Eliminare ${m.nome}?`))await onUpdate({mezzi:impresa.mezzi.filter(x=>x.id!==m.id)});}} style={delBtn}>×</button>
                 </div>}
            </div>
          ))}
        </>}
      </div>
    </div>
  );
}

// ── FORM CANTIERE ─────────────────────────────────────────
function FormCantiere({initial={},onSave,onCancel}) {
  const [f,setF]=useState({oggetto:"",stazione:"",rup:"",dl:"",impresa:"",cig:"",cup:"",luogo:"",...initial});
  const fields=[["oggetto","Oggetto del progetto"],["stazione","Stazione appaltante"],["rup","RUP"],["dl","Direttore dei Lavori"],["impresa","Impresa esecutrice"],["cig","CIG"],["cup","CUP"],["luogo","Luogo dei lavori"]];
  return (
    <div style={pageWrap}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",borderBottom:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-primary)"}}>
        <button onClick={onCancel} style={btnIcon}>←</button>
        <span style={{fontWeight:500,fontSize:15}}>{initial.id?"Modifica cantiere":"Nuovo cantiere"}</span>
      </div>
      <div style={{padding:16}}>
        {fields.map(([k,l])=><Field key={k} label={l}><input value={f[k]} onChange={e=>setF(p=>({...p,[k]:e.target.value}))} style={{width:"100%",boxSizing:"border-box"}}/></Field>)}
        <PrimBtn onClick={()=>onSave(f)} style={{marginTop:8}}>Salva cantiere</PrimBtn>
      </div>
    </div>
  );
}

// ── GIORNALE FORM ─────────────────────────────────────────
function GiornaleForm({cantiere,imprese,numero,initial,onSave,onCancel}) {
  const isEdit=!!initial;
  const [tab,setTab]=useState("generale");
  const [data,setData]=useState(initial?.data||today());
  const [meteo,setMeteo]=useState(initial?.meteo||"Sereno");
  const [tempMin,setTempMin]=useState(initial?.tempMin||"");
  const [tempMax,setTempMax]=useState(initial?.tempMax||"");
  const [lavorazioni,setLavorazioni]=useState(initial?.lavorazioni||"");
  const [sospeso,setSospeso]=useState(initial?.sospeso||false);
  const [causaSosp,setCausaSosp]=useState(initial?.causaSosp||"Causa meteorologica");
  const [altroMotivo,setAltroMotivo]=useState(initial?.altroMotivo||"");
  const [ripresa,setRipresa]=useState(initial?.ripresa||false);
  const [dataRipresa,setDataRipresa]=useState(initial?.dataRipresa||"");
  const [motivoRipresa,setMotivoRipresa]=useState(initial?.motivoRipresa||"");
  const [noteRipresa,setNoteRipresa]=useState(initial?.noteRipresa||"");
  const [operaiPresenti,setOperaiPresenti]=useState(initial?.operaiPresenti||[]);
  const [mezziUsati,setMezziUsati]=useState(initial?.mezziUsati||[]);
  const [sopralluoghi,setSopralluoghi]=useState(initial?.sopralluoghi||[]);
  const [photos,setPhotos]=useState(initial?.photos||[]);
  const fileRef=useRef();
  const tabs=["generale","operai","mezzi","sopralluoghi","sospensione","foto"];
  const tabLabels={generale:"Generale",operai:"Operai",mezzi:"Mezzi",sopralluoghi:"Sopralluoghi",sospensione:"Sosp./Ripresa",foto:"Foto"};
  const toggleOp=o=>setOperaiPresenti(p=>p.find(x=>x.id===o.id)?p.filter(x=>x.id!==o.id):[...p,{...o,ore:8}]);
  const toggleM=m=>setMezziUsati(p=>p.find(x=>x.id===m.id)?p.filter(x=>x.id!==m.id):[...p,m]);
  const addSopr=()=>setSopralluoghi(p=>[...p,{id:genId(),soggetto:"DL",ente:"",oraIngresso:"",oraUscita:"",finalita:"",prescrizioni:"",esito:"Positivo",note:""}]);
  const updS=(id,k,v)=>setSopralluoghi(p=>p.map(s=>s.id===id?{...s,[k]:v}:s));
  const handlePhoto=e=>Array.from(e.target.files).forEach(f=>{const r=new FileReader();r.onload=ev=>setPhotos(p=>[...p,{id:genId(),name:f.name,data:ev.target.result}]);r.readAsDataURL(f);});
  const save=()=>onSave({numero:initial?.numero||numero,data,meteo,tempMin,tempMax,lavorazioni,sospeso,causaSosp,altroMotivo,ripresa,dataRipresa,motivoRipresa,noteRipresa,operaiPresenti,mezziUsati,sopralluoghi,photos,riserve:initial?.riserve||[],firmaImpresa:initial?.firmaImpresa||false});
  return (
    <div style={pageWrap}>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"12px 16px",borderBottom:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-primary)"}}>
        <button onClick={onCancel} style={btnIcon}>←</button>
        <span style={{fontWeight:500,fontSize:15}}>{isEdit?"Modifica giornale":"Giornale n. "+(initial?.numero||numero)}</span>
        {isEdit&&<Badge color="amber">Modifica</Badge>}
      </div>
      {isEdit&&<div style={{background:"#FAEEDA",padding:"10px 16px",fontSize:13,color:"#633806",borderBottom:"0.5px solid #FAC775"}}>La firma DL verrà rimossa al salvataggio. Firmare nuovamente.</div>}
      <div style={{display:"flex",gap:6,padding:"8px 12px",overflowX:"auto",background:"var(--color-background-primary)",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
        {tabs.map(t=><TabPill key={t} active={tab===t} onClick={()=>setTab(t)}>{tabLabels[t]}</TabPill>)}
      </div>
      <div style={{padding:16}}>
        {tab==="generale"&&<>
          <Field label="Data"><input type="date" value={data} onChange={e=>setData(e.target.value)} style={{width:"100%",boxSizing:"border-box"}}/></Field>
          <Field label="Meteo"><select value={meteo} onChange={e=>setMeteo(e.target.value)} style={{width:"100%",boxSizing:"border-box"}}>{METEO_OPTIONS.map(m=><option key={m}>{m}</option>)}</select></Field>
          <div style={{display:"flex",gap:8}}>
            <Field label="Temp. min (°C)" style={{flex:1}}><input type="number" value={tempMin} onChange={e=>setTempMin(e.target.value)} style={{width:"100%",boxSizing:"border-box"}}/></Field>
            <Field label="Temp. max (°C)" style={{flex:1}}><input type="number" value={tempMax} onChange={e=>setTempMax(e.target.value)} style={{width:"100%",boxSizing:"border-box"}}/></Field>
          </div>
          <Field label="Descrizione lavorazioni eseguite"><textarea value={lavorazioni} onChange={e=>setLavorazioni(e.target.value)} rows={5} style={{width:"100%",boxSizing:"border-box",resize:"vertical"}}/></Field>
        </>}
        {tab==="operai"&&<>
          <p style={{fontSize:13,color:"var(--color-text-secondary)",marginTop:0}}>Operai presenti per impresa:</p>
          {imprese.length===0&&<Empty>Nessuna impresa in anagrafica.</Empty>}
          {imprese.map(imp=>(
            <div key={imp.id} style={{marginBottom:16}}>
              <div style={{fontSize:13,fontWeight:600,color:"#185FA5",marginBottom:6,padding:"4px 0",borderBottom:"1.5px solid #185FA5"}}>{imp.nome}</div>
              {(!imp.operai||imp.operai.length===0)&&<p style={{fontSize:12,color:"var(--color-text-tertiary)",paddingLeft:4}}>Nessun operaio.</p>}
              {imp.operai?.map(o=>{const p=operaiPresenti.find(x=>x.id===o.id);return(
                <div key={o.id} style={{...card,border:`0.5px solid ${p?"#185FA5":"var(--color-border-tertiary)"}`,marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center"}}>
                    <input type="checkbox" checked={!!p} onChange={()=>toggleOp(o)} style={{marginRight:10}}/>
                    <span style={{flex:1,fontWeight:500,fontSize:14}}>{o.nome}</span>
                    <span style={{fontSize:12,color:"var(--color-text-secondary)"}}>{o.qualifica}</span>
                  </div>
                  {p&&<div style={{marginTop:8,display:"flex",alignItems:"center",gap:8}}>
                    <label style={{fontSize:12,color:"var(--color-text-secondary)"}}>Ore lavorate:</label>
                    <input type="number" value={p.ore} min={0} max={24} onChange={e=>setOperaiPresenti(ps=>ps.map(x=>x.id===o.id?{...x,ore:e.target.value}:x))} style={{width:60}}/>
                  </div>}
                </div>
              );})}
            </div>
          ))}
        </>}
        {tab==="mezzi"&&<>
          <p style={{fontSize:13,color:"var(--color-text-secondary)",marginTop:0}}>Mezzi per impresa:</p>
          {imprese.length===0&&<Empty>Nessuna impresa in anagrafica.</Empty>}
          {imprese.map(imp=>(
            <div key={imp.id} style={{marginBottom:16}}>
              <div style={{fontSize:13,fontWeight:600,color:"#185FA5",marginBottom:6,padding:"4px 0",borderBottom:"1.5px solid #185FA5"}}>{imp.nome}</div>
              {(!imp.mezzi||imp.mezzi.length===0)&&<p style={{fontSize:12,color:"var(--color-text-tertiary)",paddingLeft:4}}>Nessun mezzo.</p>}
              {imp.mezzi?.map(m=>{const u=mezziUsati.find(x=>x.id===m.id);return(
                <div key={m.id} onClick={()=>toggleM(m)} style={{...card,border:`0.5px solid ${u?"#185FA5":"var(--color-border-tertiary)"}`,marginBottom:8,cursor:"pointer"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <input type="checkbox" checked={!!u} readOnly/>
                    <div>
                      <div style={{fontWeight:500,fontSize:14}}>{m.nome}</div>
                      <div style={{fontSize:12,color:"var(--color-text-secondary)"}}>{m.tipo}{m.modello?` • ${m.modello}`:""}{m.targa?` • ${m.targa}`:""}</div>
                    </div>
                  </div>
                </div>
              );})}
            </div>
          ))}
        </>}
        {tab==="sopralluoghi"&&<>
          <DashedBtn onClick={addSopr}>+ Aggiungi sopralluogo</DashedBtn>
          {sopralluoghi.map(s=>(
            <div key={s.id} style={{...card,marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontWeight:500,fontSize:14}}>Sopralluogo</span>
                <button onClick={()=>setSopralluoghi(p=>p.filter(x=>x.id!==s.id))} style={delBtn}>×</button>
              </div>
              <Field label="Soggetto"><select value={s.soggetto} onChange={e=>updS(s.id,"soggetto",e.target.value)} style={{width:"100%",boxSizing:"border-box"}}>{VISITATORI.map(v=><option key={v}>{v}</option>)}</select></Field>
              <Field label="Ente"><input value={s.ente} onChange={e=>updS(s.id,"ente",e.target.value)} style={{width:"100%",boxSizing:"border-box"}}/></Field>
              <div style={{display:"flex",gap:8}}>
                <Field label="Ora ingresso" style={{flex:1}}><input type="time" value={s.oraIngresso} onChange={e=>updS(s.id,"oraIngresso",e.target.value)} style={{width:"100%",boxSizing:"border-box"}}/></Field>
                <Field label="Ora uscita" style={{flex:1}}><input type="time" value={s.oraUscita} onChange={e=>updS(s.id,"oraUscita",e.target.value)} style={{width:"100%",boxSizing:"border-box"}}/></Field>
              </div>
              <Field label="Finalità"><input value={s.finalita} onChange={e=>updS(s.id,"finalita",e.target.value)} style={{width:"100%",boxSizing:"border-box"}}/></Field>
              <Field label="Prescrizioni"><textarea value={s.prescrizioni} onChange={e=>updS(s.id,"prescrizioni",e.target.value)} rows={3} style={{width:"100%",boxSizing:"border-box",resize:"vertical"}}/></Field>
              <Field label="Esito"><select value={s.esito} onChange={e=>updS(s.id,"esito",e.target.value)} style={{width:"100%",boxSizing:"border-box"}}>{ESITI.map(e=><option key={e}>{e}</option>)}</select></Field>
              <Field label="Note"><input value={s.note} onChange={e=>updS(s.id,"note",e.target.value)} style={{width:"100%",boxSizing:"border-box"}}/></Field>
            </div>
          ))}
        </>}
        {tab==="sospensione"&&<>
          <Card>
            <p style={{fontWeight:500,margin:"0 0 12px"}}>Sospensione dei lavori</p>
            <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",fontSize:14}}><input type="checkbox" checked={sospeso} onChange={e=>setSospeso(e.target.checked)}/>Lavori sospesi in questa giornata</label>
            {sospeso&&<div style={{marginTop:12}}>
              <Field label="Causa"><select value={causaSosp} onChange={e=>setCausaSosp(e.target.value)} style={{width:"100%",boxSizing:"border-box"}}><option>Causa meteorologica</option><option>Altro</option></select></Field>
              {causaSosp==="Altro"&&<Field label="Specifica motivazione"><textarea value={altroMotivo} onChange={e=>setAltroMotivo(e.target.value)} rows={3} style={{width:"100%",boxSizing:"border-box"}}/></Field>}
            </div>}
          </Card>
          <Card>
            <p style={{fontWeight:500,margin:"0 0 12px"}}>Ripresa dei lavori</p>
            <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",fontSize:14}}><input type="checkbox" checked={ripresa} onChange={e=>setRipresa(e.target.checked)}/>Lavori ripresi in questa giornata</label>
            {ripresa&&<div style={{marginTop:12}}>
              <Field label="Data ripresa"><input type="date" value={dataRipresa} onChange={e=>setDataRipresa(e.target.value)} style={{width:"100%",boxSizing:"border-box"}}/></Field>
              <Field label="Motivazione"><input value={motivoRipresa} onChange={e=>setMotivoRipresa(e.target.value)} style={{width:"100%",boxSizing:"border-box"}}/></Field>
              <Field label="Note aggiuntive"><textarea value={noteRipresa} onChange={e=>setNoteRipresa(e.target.value)} rows={3} style={{width:"100%",boxSizing:"border-box"}}/></Field>
            </div>}
          </Card>
        </>}
        {tab==="foto"&&<>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handlePhoto} style={{display:"none"}}/>
          <DashedBtn onClick={()=>fileRef.current.click()}>+ Aggiungi foto</DashedBtn>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}>
            {photos.map(p=>(
              <div key={p.id} style={{position:"relative"}}>
                <img src={p.data} alt={p.name} style={{width:"100%",borderRadius:"var(--border-radius-md)",display:"block"}}/>
                <button onClick={()=>setPhotos(ps=>ps.filter(x=>x.id!==p.id))} style={{position:"absolute",top:4,right:4,background:"rgba(0,0,0,0.55)",color:"#fff",border:"none",borderRadius:"50%",width:22,height:22,cursor:"pointer",fontSize:14,lineHeight:"22px",textAlign:"center",padding:0}}>×</button>
              </div>
            ))}
          </div>
        </>}
        <div style={{display:"flex",gap:8,marginTop:24}}>
          <SecBtn onClick={onCancel} style={{flex:1}}>Annulla</SecBtn>
          <PrimBtn onClick={save} style={{flex:2}}>{isEdit?"Salva modifiche":"Salva giornale"}</PrimBtn>
        </div>
      </div>
    </div>
  );
}

// ── VIEW GIORNALE ─────────────────────────────────────────
function ViewGiornale({g,cantiere,role,impostazioni,firmaImpresaPrecaricata,onBack,onModifica,onUpdate}) {
  const [tab,setTab]=useState("riepilogo");
  const [riserva,setRiserva]=useState("");
  const isDL=role===ROLES.DL;
  const canEdit=isDL&&g.firmaDL&&!g.firmaImpresa;
  const tabs=["riepilogo","operai","mezzi","sopralluoghi","sosp_ripresa","riserve","firme"];
  const tabLabels={riepilogo:"Riepilogo",operai:"Operai",mezzi:"Mezzi",sopralluoghi:"Sopralluoghi",sosp_ripresa:"Sosp./Ripresa",riserve:"Riserve",firme:"Firme"};
  const addRiserva=()=>{if(!riserva.trim())return;onUpdate({riserve:[...(g.riserve||[]),{id:genId(),testo:riserva.trim(),data:today()}]});setRiserva("");};
  const firmaDL=()=>{if(!impostazioni.firmaDLImmagine){alert("Prima carica la firma DL in Impostazioni firme.");return;}onUpdate({firmaDL:impostazioni.firmaDLImmagine});};
  const firmaImpresa=()=>{if(!firmaImpresaPrecaricata){alert("Nessuna firma precaricata per questa impresa. Chiedi alla DL di caricarla in Impostazioni firme.");return;}onUpdate({firmaImpresa:firmaImpresaPrecaricata});};
  const exportPDF=()=>{const w=window.open("","_blank");w.document.write(buildPDFHtml(g,cantiere));w.document.close();w.focus();setTimeout(()=>w.print(),600);};
  return (
    <div style={pageWrap}>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"12px 16px",borderBottom:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-primary)",position:"sticky",top:0,zIndex:10}}>
        <button onClick={onBack} style={btnIcon}>←</button>
        <span style={{fontWeight:500,fontSize:15,flex:1}}>N. {g.numero} — {g.data}</span>
        {g.sospeso&&<Badge color="amber">Sospeso</Badge>}
        {g.firmaDL&&g.firmaImpresa&&<Badge color="green">Firmato</Badge>}
        {canEdit&&<button onClick={onModifica} style={{...btnIcon,fontSize:13,color:"#185FA5",border:"0.5px solid #185FA5",borderRadius:6,padding:"3px 8px"}}>Modifica</button>}
        {isDL&&<button onClick={exportPDF} title="Esporta PDF" style={{...btnIcon,fontSize:16}}>⬇</button>}
      </div>
      <div style={{display:"flex",gap:6,padding:"8px 12px",overflowX:"auto",background:"var(--color-background-primary)",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
        {tabs.map(t=><TabPill key={t} active={tab===t} onClick={()=>setTab(t)}>{tabLabels[t]}</TabPill>)}
      </div>
      <div style={{padding:16}}>
        {tab==="riepilogo"&&<>
          <Card><SectionTitle>Dati del cantiere</SectionTitle>
            <Row label="Oggetto" value={cantiere?.oggetto}/><Row label="Stazione appaltante" value={cantiere?.stazione}/>
            <Row label="RUP" value={cantiere?.rup}/><Row label="DL" value={cantiere?.dl}/><Row label="Impresa" value={cantiere?.impresa}/>
          </Card>
          <Card><SectionTitle>Dati della giornata</SectionTitle>
            <Row label="Data" value={g.data}/><Row label="Meteo" value={g.meteo}/>
            {(g.tempMin||g.tempMax)&&<Row label="Temperatura" value={`${g.tempMin||"—"}°C / ${g.tempMax||"—"}°C`}/>}
            <Row label="Operai presenti" value={g.operaiPresenti?.length}/><Row label="Mezzi utilizzati" value={g.mezziUsati?.length}/>
          </Card>
          {g.lavorazioni&&<Card><SectionTitle>Lavorazioni eseguite</SectionTitle><p style={{fontSize:14,margin:0,whiteSpace:"pre-wrap"}}>{g.lavorazioni}</p></Card>}
          {g.photos?.length>0&&<Card><SectionTitle>Foto ({g.photos.length})</SectionTitle><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{g.photos.map(p=><img key={p.id} src={p.data} alt={p.name} style={{width:"100%",borderRadius:"var(--border-radius-md)"}}/>)}</div></Card>}
        </>}
        {tab==="operai"&&<Card><SectionTitle>Operai presenti</SectionTitle>
          {!g.operaiPresenti?.length&&<Empty>Nessun operaio.</Empty>}
          {Object.entries((g.operaiPresenti||[]).reduce((a,o)=>{const k=o.impresaNome||"—";a[k]=a[k]||[];a[k].push(o);return a;},{})).map(([imp,ops])=>(
            <div key={imp} style={{marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:600,color:"#185FA5",borderBottom:"1px solid #185FA5",paddingBottom:2,marginBottom:4}}>{imp}</div>
              {ops.map(o=><div key={o.id} style={{display:"flex",padding:"6px 0",borderBottom:"0.5px solid var(--color-border-tertiary)"}}><span style={{flex:1,fontWeight:500,fontSize:14}}>{o.nome}</span><span style={{fontSize:12,color:"var(--color-text-secondary)",marginRight:12}}>{o.qualifica}</span><span style={{fontWeight:500}}>{o.ore}h</span></div>)}
            </div>
          ))}
        </Card>}
        {tab==="mezzi"&&<Card><SectionTitle>Mezzi utilizzati</SectionTitle>
          {!g.mezziUsati?.length&&<Empty>Nessun mezzo.</Empty>}
          {Object.entries((g.mezziUsati||[]).reduce((a,m)=>{const k=m.impresaNome||"—";a[k]=a[k]||[];a[k].push(m);return a;},{})).map(([imp,mz])=>(
            <div key={imp} style={{marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:600,color:"#185FA5",borderBottom:"1px solid #185FA5",paddingBottom:2,marginBottom:4}}>{imp}</div>
              {mz.map(m=><div key={m.id} style={{padding:"6px 0",borderBottom:"0.5px solid var(--color-border-tertiary)"}}><div style={{fontWeight:500}}>{m.nome}</div><div style={{fontSize:12,color:"var(--color-text-secondary)"}}>{m.tipo}{m.modello?` • ${m.modello}`:""}{m.targa?` • ${m.targa}`:""}</div></div>)}
            </div>
          ))}
        </Card>}
        {tab==="sopralluoghi"&&<>
          {!g.sopralluoghi?.length&&<Empty>Nessun sopralluogo.</Empty>}
          {g.sopralluoghi?.map(s=><Card key={s.id}><div style={{fontWeight:500,marginBottom:8}}>{s.soggetto}{s.ente?` — ${s.ente}`:""}</div><Row label="Ingresso" value={s.oraIngresso}/><Row label="Uscita" value={s.oraUscita}/><Row label="Finalità" value={s.finalita}/>{s.prescrizioni&&<><p style={{fontSize:12,color:"var(--color-text-secondary)",margin:"8px 0 4px"}}>Prescrizioni</p><p style={{fontSize:13,margin:0,whiteSpace:"pre-wrap"}}>{s.prescrizioni}</p></>}<div style={{marginTop:8}}><EsitoBadge esito={s.esito}/></div><Row label="Note" value={s.note}/></Card>)}
        </>}
        {tab==="sosp_ripresa"&&<>
          <Card><SectionTitle>Sospensione</SectionTitle>{g.sospeso?<><Row label="Stato" value="Sospeso"/><Row label="Causa" value={g.causaSosp==="Altro"?g.altroMotivo:g.causaSosp}/></>:<p style={{fontSize:13,color:"var(--color-text-tertiary)"}}>Nessuna sospensione.</p>}</Card>
          <Card><SectionTitle>Ripresa</SectionTitle>{g.ripresa?<><Row label="Data" value={g.dataRipresa}/><Row label="Motivazione" value={g.motivoRipresa}/>{g.noteRipresa&&<p style={{fontSize:13,margin:0}}>{g.noteRipresa}</p>}</>:<p style={{fontSize:13,color:"var(--color-text-tertiary)"}}>Nessuna ripresa.</p>}</Card>
        </>}
        {tab==="riserve"&&<>
          <Card><SectionTitle>Riserve dell'impresa</SectionTitle>
            {!g.riserve?.length&&<p style={{fontSize:13,color:"var(--color-text-tertiary)"}}>Nessuna riserva.</p>}
            {g.riserve?.map(r=><div key={r.id} style={{borderBottom:"0.5px solid var(--color-border-tertiary)",padding:"8px 0"}}><div style={{fontSize:11,color:"var(--color-text-tertiary)"}}>{r.data}</div><div style={{fontSize:14,marginTop:2}}>{r.testo}</div></div>)}
          </Card>
          {!isDL&&!g.firmaImpresa&&<div style={{marginTop:4}}><textarea value={riserva} onChange={e=>setRiserva(e.target.value)} rows={3} placeholder="Scrivi una riserva..." style={{width:"100%",boxSizing:"border-box",marginBottom:8}}/><PrimBtn onClick={addRiserva}>Aggiungi riserva</PrimBtn></div>}
          {isDL&&<p style={{fontSize:12,color:"var(--color-text-tertiary)"}}>Solo l'impresa può aggiungere riserve.</p>}
        </>}
        {tab==="firme"&&<>
          <Card><SectionTitle>Firma Direzione Lavori</SectionTitle>
            {g.firmaDL
              ?<><Badge color="green">Firmato</Badge><img src={g.firmaDL} alt="Firma DL" style={{maxWidth:"100%",maxHeight:100,border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-md)",display:"block",marginTop:10}}/></>
              :isDL
                ?impostazioni.firmaDLImmagine
                  ?<><img src={impostazioni.firmaDLImmagine} alt="Anteprima" style={{maxHeight:70,maxWidth:"100%",marginBottom:10,display:"block",opacity:0.6,border:"0.5px dashed var(--color-border-secondary)",borderRadius:4}}/><PrimBtn onClick={firmaDL}>Applica firma DL</PrimBtn></>
                  :<p style={{fontSize:13,color:"var(--color-text-secondary)"}}>Vai in <b>Impostazioni firme</b> per caricare la firma DL.</p>
                :<p style={{fontSize:13,color:"var(--color-text-tertiary)"}}>In attesa della firma DL.</p>}
          </Card>
          <Card><SectionTitle>Firma Impresa esecutrice</SectionTitle>
            {g.firmaImpresa
              ?<><Badge color="green">Firmato</Badge><img src={g.firmaImpresa} alt="Firma Impresa" style={{maxWidth:"100%",maxHeight:100,border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-md)",display:"block",marginTop:10}}/></>
              :!isDL&&g.firmaDL
                ?firmaImpresaPrecaricata
                  ?<><img src={firmaImpresaPrecaricata} alt="Anteprima firma" style={{maxHeight:70,maxWidth:"100%",marginBottom:10,display:"block",opacity:0.6,border:"0.5px dashed var(--color-border-secondary)",borderRadius:4}}/><PrimBtn onClick={firmaImpresa}>Applica firma Impresa</PrimBtn></>
                  :<p style={{fontSize:13,color:"var(--color-text-secondary)"}}>Nessuna firma precaricata per questa impresa. Chiedi alla DL di caricarla in Impostazioni firme.</p>
                :!isDL&&!g.firmaDL
                  ?<p style={{fontSize:13,color:"var(--color-text-tertiary)"}}>In attesa della firma DL.</p>
                  :<p style={{fontSize:13,color:"var(--color-text-tertiary)"}}>In attesa della firma impresa.</p>}
          </Card>
          {g.firmaDL&&g.firmaImpresa&&<><div style={{background:"#EAF3DE",borderRadius:"var(--border-radius-md)",padding:"12px 16px",marginBottom:12,fontSize:14,color:"#3B6D11",textAlign:"center"}}>Documento firmato da entrambe le parti</div>{isDL&&<PrimBtn onClick={exportPDF}>Esporta PDF completo</PrimBtn>}</>}
          {(!g.firmaDL||!g.firmaImpresa)&&isDL&&<p style={{fontSize:12,color:"var(--color-text-tertiary)",textAlign:"center",marginTop:8}}>Il PDF sarà disponibile dopo la firma di entrambe le parti.</p>}
        </>}
      </div>
    </div>
  );
}

// ── PDF ───────────────────────────────────────────────────
function buildPDFHtml(g,c) {
  const sec=(t,b)=>`<div class="section"><h3>${t}</h3><div class="sec-body">${b}</div></div>`;
  const row=(l,v)=>v?`<tr><td class="lbl">${l}</td><td>${v}</td></tr>`:"";
  const tbl=r=>`<table>${r}</table>`;
  const byImp=items=>Object.entries((items||[]).reduce((a,x)=>{const k=x.impresaNome||"—";a[k]=a[k]||[];a[k].push(x);return a;},{}));
  const opH=byImp(g.operaiPresenti).map(([i,ops])=>`<b>${i}</b><table><tr><th>Nome</th><th>Qualifica</th><th>Ore</th></tr>${ops.map(o=>`<tr><td>${o.nome}</td><td>${o.qualifica}</td><td>${o.ore}h</td></tr>`).join("")}</table>`).join("<br/>")||"<p>Nessuno</p>";
  const mzH=byImp(g.mezziUsati).map(([i,mz])=>`<b>${i}</b><table><tr><th>Nome</th><th>Tipo</th><th>Modello</th><th>Targa</th></tr>${mz.map(m=>`<tr><td>${m.nome}</td><td>${m.tipo||""}</td><td>${m.modello||""}</td><td>${m.targa||""}</td></tr>`).join("")}</table>`).join("<br/>")||"<p>Nessuno</p>";
  const spH=g.sopralluoghi?.map(s=>`<div class="sub"><b>${s.soggetto}${s.ente?` — ${s.ente}`:""}</b>${tbl(row("Ingresso",s.oraIngresso)+row("Uscita",s.oraUscita)+row("Finalità",s.finalita)+row("Esito",s.esito))}${s.prescrizioni?`<p>${s.prescrizioni}</p>`:""}</div>`).join("")||"<p>Nessuno</p>";
  const rH=g.riserve?.map(r=>`<div class="sub"><small>${r.data}</small><p>${r.testo}</p></div>`).join("")||"<p>Nessuna.</p>";
  const phH=g.photos?.map(p=>`<img src="${p.data}" style="max-width:45%;margin:4px;"/>`).join("")||"";
  const sosH=g.sospeso?tbl(row("Causa",g.causaSosp==="Altro"?g.altroMotivo:g.causaSosp)):"<p>Nessuna.</p>";
  const ripH=g.ripresa?tbl(row("Data",g.dataRipresa)+row("Motivazione",g.motivoRipresa)):"<p>Nessuna.</p>";
  const fDL=g.firmaDL?`<img src="${g.firmaDL}" style="max-height:70px;max-width:180px;display:block;margin-top:8px;" alt=""/>`:"-";
  const fImp=g.firmaImpresa?`<img src="${g.firmaImpresa}" style="max-height:70px;max-width:180px;display:block;margin-top:8px;" alt=""/>`:"-";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Giornale n.${g.numero}</title>
<style>body{font-family:Arial,sans-serif;font-size:12px;color:#222;margin:20px}h1{font-size:16px;text-align:center;margin-bottom:4px}h2{font-size:13px;text-align:center;color:#444;margin-bottom:16px}h3{font-size:13px;background:#185FA5;color:#fff;padding:6px 10px;margin:0;border-radius:3px 3px 0 0}.section{border:1px solid #ccc;border-radius:4px;margin-bottom:14px;overflow:hidden}.sec-body{padding:8px 10px}table{width:100%;border-collapse:collapse;font-size:12px}td,th{padding:4px 6px;border-bottom:1px solid #eee;text-align:left}td.lbl{color:#555;width:40%}.sub{border:1px solid #e0e0e0;border-radius:3px;padding:8px;margin-bottom:8px}.fg{display:grid;grid-template-columns:1fr 1fr;gap:12px}.fb{border:1px solid #999;padding:10px;border-radius:3px;min-height:90px}img{border:none;outline:none}@media print{body{margin:10px}}</style>
</head><body>
<h1>Giornale dei Lavori Pubblici</h1><h2>Giornale n. ${g.numero} — ${g.data}</h2>
${sec("Dati del cantiere",tbl(row("Oggetto",c?.oggetto)+row("Stazione appaltante",c?.stazione)+row("RUP",c?.rup)+row("Direttore dei Lavori",c?.dl)+row("Impresa esecutrice",c?.impresa)+row("CIG",c?.cig)+row("CUP",c?.cup)+row("Luogo",c?.luogo)))}
${sec("Dati della giornata",tbl(row("Meteo",g.meteo)+row("Temp. min",g.tempMin?g.tempMin+"°C":"")+row("Temp. max",g.tempMax?g.tempMax+"°C":"")))}
${sec("Lavorazioni eseguite",`<p style="white-space:pre-wrap">${g.lavorazioni||"—"}</p>`)}
${sec("Operai presenti",opH)}${sec("Mezzi utilizzati",mzH)}
${sec("Sospensione dei lavori",sosH)}${sec("Ripresa dei lavori",ripH)}
${sec("Sopralluoghi esterni",spH)}${sec("Riserve dell'impresa",rH)}
${phH?sec("Foto allegate",`<div style="display:flex;flex-wrap:wrap;gap:8px">${phH}</div>`):""}
${sec("Firme",`<div class="fg"><div class="fb"><b>Direzione Lavori</b><br/><small>${c?.dl||""}</small>${fDL}</div><div class="fb"><b>Impresa esecutrice</b><br/><small>${c?.impresa||""}</small>${fImp}</div></div>`)}
</body></html>`;
}

// ── UI HELPERS ────────────────────────────────────────────
const pageWrap={fontFamily:"var(--font-sans)",background:"var(--color-background-tertiary)",minHeight:"100vh"};
const card={background:"var(--color-background-primary)",borderRadius:"var(--border-radius-lg)",border:"0.5px solid var(--color-border-tertiary)",padding:"14px 16px"};
const cardClickable={...card,cursor:"pointer",marginBottom:10};
const btnIcon={background:"none",border:"none",cursor:"pointer",fontSize:18,color:"var(--color-text-secondary)",padding:"0 4px"};
const addBtn={padding:"0 14px",height:36,background:"#185FA5",color:"#fff",border:"none",borderRadius:"var(--border-radius-md)",cursor:"pointer",fontSize:18};
const delBtn={background:"none",border:"none",cursor:"pointer",color:"var(--color-text-danger)",fontSize:18,lineHeight:1};
function PrimBtn({onClick,children,style}){return <button onClick={onClick} style={{width:"100%",padding:"11px",borderRadius:"var(--border-radius-md)",background:"#185FA5",color:"#fff",border:"none",cursor:"pointer",fontSize:14,fontWeight:500,...style}}>{children}</button>;}
function SecBtn({onClick,children,style}){return <button onClick={onClick} style={{width:"100%",padding:"10px",borderRadius:"var(--border-radius-md)",border:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-secondary)",cursor:"pointer",fontSize:13,...style}}>{children}</button>;}
function DashedBtn({onClick,children}){return <button onClick={onClick} style={{width:"100%",padding:"11px",borderRadius:"var(--border-radius-md)",border:"0.5px dashed var(--color-border-secondary)",background:"var(--color-background-primary)",cursor:"pointer",fontSize:13,color:"var(--color-text-secondary)",marginBottom:12}}>{children}</button>;}
function TabPill({active,onClick,children}){return <button onClick={onClick} style={{padding:"6px 12px",borderRadius:20,border:active?"2px solid #185FA5":"0.5px solid var(--color-border-tertiary)",background:active?"#E6F1FB":"transparent",color:active?"#185FA5":"var(--color-text-secondary)",cursor:"pointer",fontSize:12,fontWeight:active?500:400,whiteSpace:"nowrap"}}>{children}</button>;}
function Field({label,children,style}){return <div style={{marginBottom:10,...style}}><label style={{fontSize:12,color:"var(--color-text-secondary)",display:"block",marginBottom:4}}>{label}</label>{children}</div>;}
function Card({children}){return <div style={{...card,marginBottom:12}}>{children}</div>;}
function Row({label,value}){if(!value&&value!==0)return null;return <div style={{display:"flex",gap:8,marginBottom:6,fontSize:13}}><span style={{color:"var(--color-text-secondary)",minWidth:130}}>{label}</span><span style={{fontWeight:500}}>{value}</span></div>;}
function SectionTitle({children}){return <p style={{fontWeight:500,fontSize:12,color:"var(--color-text-secondary)",margin:"0 0 10px",textTransform:"uppercase",letterSpacing:"0.04em"}}>{children}</p>;}
function Empty({children}){return <p style={{fontSize:13,color:"var(--color-text-tertiary)",textAlign:"center",padding:"16px 0"}}>{children}</p>;}
function Badge({color,children}){const cols={green:["#EAF3DE","#3B6D11"],amber:["#FAEEDA","#633806"],blue:["#E6F1FB","#0C447C"]};const[bg,fg]=cols[color]||cols.blue;return <span style={{fontSize:11,background:bg,color:fg,padding:"2px 10px",borderRadius:12,fontWeight:500}}>{children}</span>;}
function EsitoBadge({esito}){const c=esito==="Positivo"?"green":esito==="Negativo/Sospensione"?"red":"amber";const cols={green:["#EAF3DE","#3B6D11"],red:["#FCEBEB","#A32D2D"],amber:["#FAEEDA","#633806"]};const[bg,fg]=cols[c];return <span style={{fontSize:12,background:bg,color:fg,padding:"3px 10px",borderRadius:12}}>{esito}</span>;}
