import { useState, useEffect, useRef } from "react";

if (!document.getElementById("jfont")) {
  const s = document.createElement("style");
  s.id = "jfont";
  s.textContent = "@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Patrick+Hand&display=swap');";
  document.head.appendChild(s);
}

const QUOTES = [
  "Not every day is productive, but I didn't quit.",
  "Small steps every day lead to big changes.",
  "Discipline is choosing what you want most over what you want now.",
  "Progress, not perfection.",
  "You are one decision away from a completely different life.",
  "Every day is a new beginning.",
  "Be consistent, not perfect.",
  "The only bad workout is the one that didn't happen.",
];

const ICONS = ["⏰","🧘","💪","✨","👣","💧","🥗","📚","📖","📝","🏃","🎯","🌅","🍎","😴","🧹","💻","🎵","🏋️","🙏","🧴","☕","🌿","🚿","🍽️","🧠","❤️","🌙","🎨","🏊"];

const dateKey = (d = new Date()) => {
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,"0"), dd = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${dd}`;
};
const load = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

const DEFAULT_CHALLENGE = {
  id: "c1", name: "21 Day Reset", totalDays: 21, startDate: dateKey(),
  routines: [
    { id: "r1", text: "Wake up @ 6am", icon: "⏰" },
    { id: "r2", text: "Meditation", icon: "🧘" },
    { id: "r3", text: "Exercise", icon: "💪" },
    { id: "r4", text: "Skin Care Routine", icon: "✨" },
    { id: "r5", text: "Complete 10K Steps", icon: "👣" },
    { id: "r6", text: "3L Water", icon: "💧" },
    { id: "r7", text: "No Junk & Sugar", icon: "🥗" },
    { id: "r8", text: "1 hr Study", icon: "📚" },
    { id: "r9", text: "Read Book", icon: "📖" },
    { id: "r10", text: "Plan Next Day", icon: "📝" },
  ],
  reminders: {},
};

export default function App() {
  const [dark, setDark] = useState(() => load("drk", false));
  const [challenges, setChallenges] = useState(() => load("chal", [DEFAULT_CHALLENGE]));
  const [activeId, setActiveId] = useState(() => load("aid", "c1"));
  const [completions, setCompletions] = useState(() => load("comp", {}));
  const [view, setView] = useState("today");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [editTarget, setEditTarget] = useState(null);
  const [noteOpen, setNoteOpen] = useState(null);
  const [notifPerm, setNotifPerm] = useState(() => (typeof Notification !== "undefined" ? Notification.permission : "default"));
  const quoteRef = useRef(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const noteInputRef = useRef(null);

  useEffect(() => save("drk", dark), [dark]);
  useEffect(() => save("chal", challenges), [challenges]);
  useEffect(() => save("aid", activeId), [activeId]);
  useEffect(() => save("comp", completions), [completions]);

  useEffect(() => {
    const tick = () => {
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
      const dk = dateKey();
      challenges.forEach(ch => {
        Object.entries(ch.reminders || {}).forEach(([rid, time]) => {
          if (time !== hhmm) return;
          const r = ch.routines.find(x => x.id === rid);
          if (r && !completions[dk]?.[ch.id]?.[rid]?.done) {
            try { new Notification(`${ch.name} — Reminder`, { body: `${r.icon} ${r.text}`, tag: `${ch.id}-${rid}` }); } catch(_) {}
          }
        });
      });
    };
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [challenges, completions]);

  useEffect(() => {
    if (noteOpen && noteInputRef.current) noteInputRef.current.focus();
  }, [noteOpen]);

  const ch = challenges.find(c => c.id === activeId) || challenges[0];
  const tk = dateKey();
  const now = new Date();

  const dayNum = ch ? Math.max(1, Math.min(Math.floor((now - new Date(ch.startDate)) / 86400000) + 1, ch.totalDays)) : 1;
  const comp = completions[tk]?.[ch?.id] || {};
  const doneCount = ch?.routines.filter(r => comp[r.id]?.done).length || 0;
  const totalCount = ch?.routines.length || 0;
  const scorePct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  const getStreak = (chal) => {
    let s = 0; const d = new Date();
    while (s < 366) {
      const k = dateKey(d);
      const c2 = completions[k]?.[chal.id] || {};
      const dn = chal.routines.filter(r => c2[r.id]?.done).length;
      if (chal.routines.length > 0 && dn === chal.routines.length) { s++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return s;
  };

  const getHistory = (chal) => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = dateKey(d);
      const c2 = completions[k]?.[chal.id] || {};
      const dn = chal.routines.filter(r => c2[r.id]?.done).length;
      const tot = chal.routines.length;
      days.push({ date: d, key: k, done: dn, total: tot, pct: tot ? dn / tot : 0 });
    }
    return days;
  };

  const toggle = (rid) => {
    setCompletions(p => ({
      ...p,
      [tk]: { ...p[tk], [activeId]: { ...(p[tk]?.[activeId] || {}), [rid]: { ...(p[tk]?.[activeId]?.[rid] || {}), done: !p[tk]?.[activeId]?.[rid]?.done } } }
    }));
  };

  const setNote = (rid, note) => {
    setCompletions(p => ({
      ...p,
      [tk]: { ...p[tk], [activeId]: { ...(p[tk]?.[activeId] || {}), [rid]: { ...(p[tk]?.[activeId]?.[rid] || {}), note } } }
    }));
  };

  const saveRoutine = () => {
    if (!form.text?.trim()) return;
    if (editTarget) {
      setChallenges(p => p.map(c => c.id === activeId ? { ...c, routines: c.routines.map(r => r.id === editTarget.id ? { ...r, text: form.text.trim(), icon: form.icon || r.icon } : r) } : c));
    } else {
      const nr = { id: `r${Date.now()}`, text: form.text.trim(), icon: form.icon || "✅" };
      setChallenges(p => p.map(c => c.id === activeId ? { ...c, routines: [...c.routines, nr] } : c));
    }
    closeModal();
  };

  const deleteRoutine = (rid) => setChallenges(p => p.map(c => c.id === activeId ? { ...c, routines: c.routines.filter(r => r.id !== rid) } : c));

  const saveChallenge = () => {
    if (!form.name?.trim()) return;
    if (editTarget) {
      setChallenges(p => p.map(c => c.id === editTarget.id ? { ...c, name: form.name.trim(), totalDays: parseInt(form.totalDays) || 21, startDate: form.startDate || c.startDate } : c));
    } else {
      const nc = { id: `c${Date.now()}`, name: form.name.trim(), totalDays: parseInt(form.totalDays) || 21, startDate: form.startDate || tk, routines: [], reminders: {} };
      setChallenges(p => [...p, nc]);
      setActiveId(nc.id);
    }
    closeModal();
  };

  const deleteChallenge = (cid) => {
    if (challenges.length <= 1) return;
    const rem = challenges.filter(c => c.id !== cid);
    setChallenges(rem);
    if (activeId === cid) setActiveId(rem[0].id);
  };

  const setReminder = (rid, time) => {
    setChallenges(p => p.map(c => c.id === activeId ? {
      ...c, reminders: time
        ? { ...c.reminders, [rid]: time }
        : Object.fromEntries(Object.entries(c.reminders || {}).filter(([k]) => k !== rid))
    } : c));
  };

  const requestNotif = async () => {
    if (typeof Notification === "undefined") return;
    const p = await Notification.requestPermission();
    setNotifPerm(p);
  };

  const closeModal = () => { setModal(null); setForm({}); setEditTarget(null); };
  const openEditRoutine = (r) => { setEditTarget(r); setForm({ text: r.text, icon: r.icon }); setModal("routine"); };
  const openEditChallenge = (c) => { setEditTarget(c); setForm({ name: c.name, totalDays: String(c.totalDays), startDate: c.startDate }); setModal("challenge"); };

  const T = dark ? {
    bg: "#0d1117", paper: "#161b27", text: "#e2d5c0", sub: "#7d6e58",
    line: "#1e2535", accent: "#ff6b6b", green: "#52d68a", blue: "#7eb8f7",
    card: "#1a2035", border: "#2a3050", btnBg: "#1e2840", mutedBg: "#111827",
    shadow: "0 4px 20px rgba(0,0,0,0.35)",
  } : {
    bg: "#f0e6d0", paper: "#fffdf5", text: "#1a1208", sub: "#8a7050",
    line: "#e0cfa8", accent: "#d93025", green: "#2d6a4f", blue: "#1a56b0",
    card: "#fff8ee", border: "#d4c4a8", btnBg: "#ede0c4", mutedBg: "#f5ecd8",
    shadow: "0 4px 20px rgba(0,0,0,0.08)",
  };

  const fullDate = `${String(now.getDate()).padStart(2,"0")} / ${String(now.getMonth()+1).padStart(2,"0")} / ${now.getFullYear()}`;

  const css = `
    *{box-sizing:border-box;margin:0;padding:0;}
    body{margin:0;background:${T.bg};}
    ::-webkit-scrollbar{width:3px;}
    ::-webkit-scrollbar-track{background:transparent;}
    ::-webkit-scrollbar-thumb{background:${T.border};border-radius:2px;}
    .app{font-family:'Caveat',cursive;min-height:100vh;background:${T.bg};color:${T.text};transition:background .3s,color .3s;}
    .hdr{background:${T.paper};border-bottom:2px solid ${T.line};padding:12px 14px 0;position:sticky;top:0;z-index:100;box-shadow:${T.shadow};}
    .paper{background:${T.paper};border:1px solid ${T.border};border-radius:14px;padding:16px;margin:10px;box-shadow:${T.shadow};position:relative;overflow:visible;}
    .paper::before{content:'';position:absolute;top:0;left:54px;bottom:0;width:1px;background:rgba(220,80,80,0.2);pointer-events:none;}
    .line{border-bottom:1px solid ${T.line};padding:10px 0 10px 62px;position:relative;display:flex;align-items:center;gap:8px;min-height:52px;}
    .line:last-child{border-bottom:none;}
    .lnum{position:absolute;left:10px;color:${T.sub};font-size:14px;width:38px;text-align:right;user-select:none;}
    .cbtn{width:30px;height:30px;border-radius:50%;border:2px solid ${T.border};background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:17px;transition:all .2s;flex-shrink:0;}
    .cbtn.done{border-color:${T.green};background:${T.green}22;color:${T.green};}
    .rtext{flex:1;font-size:19px;line-height:1.2;cursor:pointer;user-select:none;}
    .rtext.done{text-decoration:line-through;color:${T.sub};}
    .pill{font-size:12px;padding:3px 8px;border-radius:20px;cursor:pointer;white-space:nowrap;transition:all .15s;border:none;font-family:'Caveat',cursive;}
    .btn{font-family:'Caveat',cursive;cursor:pointer;border:none;border-radius:8px;padding:9px 16px;font-size:17px;transition:all .2s;}
    .btn-p{background:${T.text};color:${T.bg};}
    .btn-p:hover{opacity:.85;}
    .btn-s{background:${T.btnBg};color:${T.text};border:1px solid ${T.border};}
    .btn-s:hover{opacity:.8;}
    .btn-d{background:${T.accent}18;color:${T.accent};border:1px solid ${T.accent}35;}
    .btn-d:hover{background:${T.accent}30;}
    .tab{font-family:'Caveat',cursive;cursor:pointer;border:none;background:transparent;color:${T.sub};font-size:16px;padding:8px 12px;border-radius:8px 8px 0 0;transition:all .2s;}
    .tab.on{background:${T.bg};color:${T.text};font-weight:700;}
    .mbg{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:200;display:flex;align-items:flex-end;justify-content:center;}
    .mod{background:${T.paper};border-radius:20px 20px 0 0;padding:22px;width:100%;max-width:480px;max-height:82vh;overflow-y:auto;}
    .inp{font-family:'Caveat',cursive;width:100%;background:${T.mutedBg};border:1.5px solid ${T.border};border-radius:9px;padding:10px 13px;font-size:18px;color:${T.text};outline:none;}
    .inp:focus{border-color:${T.text};}
    .igrid{display:grid;grid-template-columns:repeat(10,1fr);gap:5px;margin-top:8px;}
    .ibtn{width:30px;height:30px;border-radius:6px;border:1px solid ${T.border};background:${T.mutedBg};cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;transition:all .15s;}
    .ibtn.sel{border-color:${T.text};background:${T.btnBg};transform:scale(1.18);}
    .chcard{background:${T.card};border:2px solid ${T.border};border-radius:13px;padding:14px;margin-bottom:10px;cursor:pointer;transition:all .2s;}
    .chcard:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgba(0,0,0,.12);}
    .chcard.on{border-color:${T.text};}
    .ntbox{position:absolute;top:calc(100% + 4px);left:60px;right:0;z-index:50;background:${T.paper};border:1.5px solid ${T.border};border-radius:10px;padding:8px;display:flex;gap:7px;box-shadow:${T.shadow};}
    @keyframes su{from{transform:translateY(18px);opacity:0}to{transform:translateY(0);opacity:1}}
    .su{animation:su .25s ease;}
    @keyframes cp{0%{transform:scale(1)}50%{transform:scale(1.28)}100%{transform:scale(1)}}
    .cp{animation:cp .22s ease;}
    select{font-family:'Caveat',cursive;background:${T.mutedBg};border:1.5px solid ${T.border};color:${T.text};border-radius:8px;padding:7px 10px;font-size:15px;outline:none;max-width:130px;}
    label{font-size:15px;color:${T.sub};display:block;margin-bottom:6px;}
    .prog{height:6px;background:${T.line};border-radius:3px;overflow:hidden;margin-top:10px;}
    .progbar{height:100%;background:linear-gradient(90deg,${T.green},${T.blue});border-radius:3px;transition:width .4s ease;}
    .hdot{border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;transition:transform .15s;cursor:default;}
    .hdot:hover{transform:scale(1.18);}
    .iconact{cursor:pointer;font-size:16px;transition:transform .15s;padding:2px;}
    .iconact:hover{transform:scale(1.2);}
  `;

  return (
    <>
      <style>{css}</style>
      <div className="app">
        {/* HEADER */}
        <div className="hdr">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div>
              <div style={{ fontSize:24, fontWeight:700, lineHeight:1 }}>📓 Daily Journal</div>
              <div style={{ fontSize:14, color:T.sub, marginTop:2 }}>
                {DAY_NAMES[now.getDay()]} · {fullDate}
              </div>
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              {challenges.length > 1 && (
                <select value={activeId} onChange={e => setActiveId(e.target.value)}>
                  {challenges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
              <button className="btn btn-s" style={{ padding:"7px 11px", fontSize:19 }} onClick={() => setDark(d => !d)}>
                {dark ? "☀️" : "🌙"}
              </button>
            </div>
          </div>
          <div style={{ display:"flex", gap:2 }}>
            {[["today","📋 Today"],["history","📅 History"],["challenges","🏆 Challenges"]].map(([v,l]) => (
              <button key={v} className={`tab ${view===v?"on":""}`} onClick={() => setView(v)}>{l}</button>
            ))}
          </div>
        </div>

        {/* ── TODAY VIEW ── */}
        {view === "today" && ch && (
          <div className="su">
            <div className="paper">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontSize:13, color:T.sub }}>Day {dayNum} of {ch.totalDays}</div>
                  <div style={{ fontSize:26, fontWeight:700, marginTop:2 }}>{ch.name}</div>
                  <div style={{ fontSize:14, color:T.accent, marginTop:2 }}>🔥 {getStreak(ch)} day streak</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:36, fontWeight:700, color: scorePct===100 ? T.green : scorePct>50 ? T.blue : T.text, lineHeight:1 }}>
                    {doneCount}/{totalCount}
                  </div>
                  <div style={{ fontSize:13, color:T.sub }}>{scorePct}% complete</div>
                </div>
              </div>
              <div className="prog"><div className="progbar" style={{ width:`${scorePct}%` }} /></div>
              <div style={{ marginTop:8, display:"flex", justifyContent:"space-between", fontSize:13, color:T.sub }}>
                <span>Challenge: {Math.round(dayNum/ch.totalDays*100)}% done</span>
                <span>Score: {doneCount}/{totalCount}</span>
              </div>
            </div>

            <div className="paper" style={{ marginTop:8 }}>
              {ch.routines.length === 0 && (
                <div style={{ textAlign:"center", color:T.sub, padding:"20px 0", fontSize:17 }}>
                  No routines yet. Add one below! 👇
                </div>
              )}
              {ch.routines.map((r, i) => {
                const done = !!comp[r.id]?.done;
                const note = comp[r.id]?.note || "";
                const reminder = ch.reminders?.[r.id];
                const isNoteOpen = noteOpen === r.id;
                return (
                  <div key={r.id} className="line" style={{ position:"relative" }}>
                    <span className="lnum">{i+1}</span>
                    <button
                      className={`cbtn${done?" done":""}`}
                      onClick={() => { toggle(r.id); }}
                    >
                      {done ? "✓" : ""}
                    </button>
                    <span
                      className={`rtext${done?" done":""}`}
                      onClick={() => toggle(r.id)}
                    >
                      {r.icon} {r.text}
                    </span>
                    {/* Note pill */}
                    <button
                      className="pill"
                      style={{ background: note ? T.blue+"20" : T.btnBg, color: note ? T.blue : T.sub, border:`1px solid ${note?T.blue+"40":T.border}` }}
                      onClick={() => setNoteOpen(isNoteOpen ? null : r.id)}
                    >
                      {note ? note.length > 8 ? note.slice(0,8)+"…" : note : "+note"}
                    </button>
                    {/* Reminder pill */}
                    <button
                      className="pill"
                      style={{ background: reminder ? T.accent+"18" : T.btnBg, color: reminder ? T.accent : T.sub, border:`1px solid ${reminder?T.accent+"35":T.border}` }}
                      onClick={() => { setEditTarget(r); setForm({ time: reminder||"" }); setModal("reminder"); }}
                      title="Set reminder"
                    >
                      {reminder ? `⏰ ${reminder}` : "⏰"}
                    </button>
                    <span className="iconact" onClick={() => openEditRoutine(r)} title="Edit">✏️</span>
                    <span className="iconact" style={{ color:T.accent }} onClick={() => deleteRoutine(r.id)} title="Delete">🗑</span>
                    {isNoteOpen && (
                      <div className="ntbox su">
                        <input
                          ref={noteInputRef}
                          className="inp"
                          style={{ fontSize:15, padding:"7px 11px" }}
                          placeholder="Add a note… (e.g. 7AM, 5km)"
                          value={note}
                          onChange={e => setNote(r.id, e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") setNoteOpen(null); }}
                        />
                        <button className="btn btn-p" style={{ padding:"7px 13px", fontSize:15 }} onClick={() => setNoteOpen(null)}>
                          Done
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              <div style={{ paddingTop:12, paddingLeft:62, paddingBottom:4 }}>
                <button className="btn btn-s" onClick={() => { setEditTarget(null); setForm({ icon:"✅" }); setModal("routine"); }}>
                  + Add Routine
                </button>
              </div>
            </div>

            {/* Quote */}
            <div className="paper" style={{ marginTop:8, borderLeft:`4px solid ${T.accent}`, padding:"14px 16px 14px 20px" }}>
              <div style={{ fontSize:13, color:T.sub, marginBottom:5 }}>
                Remarks: ({doneCount}/{totalCount}) · {DAY_NAMES[now.getDay()]}
              </div>
              <div style={{ fontSize:20, fontStyle:"italic", color:T.sub, lineHeight:1.4 }}>
                " {quoteRef.current} "
              </div>
            </div>
          </div>
        )}

        {/* ── HISTORY VIEW ── */}
        {view === "history" && ch && (
          <div className="su">
            <div className="paper">
              <div style={{ fontSize:22, fontWeight:700, marginBottom:14 }}>📅 {ch.name} — History</div>
              <div style={{ fontSize:14, color:T.sub, marginBottom:8 }}>Last 30 days heatmap</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                {getHistory(ch).map((d, i) => {
                  const isToday = d.key === tk;
                  const bg = d.total === 0 ? T.border+"60"
                    : d.pct === 1 ? T.green
                    : d.pct >= 0.5 ? T.blue
                    : d.pct > 0 ? T.accent
                    : T.border+"60";
                  return (
                    <div
                      key={i}
                      className="hdot"
                      title={`${d.date.toDateString()}: ${d.done}/${d.total} done`}
                      style={{ width:34, height:34, background:bg, border: isToday ? `2px solid ${T.text}` : "2px solid transparent" }}
                    >
                      <div style={{ fontSize:10, color:"#fff", fontWeight:700 }}>{d.date.getDate()}</div>
                      {d.total > 0 && <div style={{ fontSize:8, color:"rgba(255,255,255,.75)" }}>{d.done}/{d.total}</div>}
                    </div>
                  );
                })}
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:12, marginTop:12, fontSize:13, color:T.sub }}>
                {[["All done 💯", T.green],["≥ 50% ✓", T.blue],["Started 🔸", T.accent],["Empty", T.border]].map(([l,c]) => (
                  <span key={l} style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <span style={{ width:13, height:13, borderRadius:3, background:c, display:"inline-block" }} />{l}
                  </span>
                ))}
              </div>
            </div>

            <div className="paper" style={{ marginTop:8 }}>
              <div style={{ fontSize:20, fontWeight:700, marginBottom:10 }}>Last 7 Days</div>
              {getHistory(ch).slice(-7).reverse().map((d, i) => (
                <div key={i} className="line" style={{ paddingLeft:8 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:17 }}>
                      {d.key === tk ? "Today 📌" : d.date.toLocaleDateString("en-IN", { weekday:"short", month:"short", day:"numeric" })}
                    </div>
                  </div>
                  <div style={{ fontSize:16, color: d.pct===1 ? T.green : d.pct>0.5 ? T.blue : T.sub, minWidth:60, textAlign:"right" }}>
                    {d.done}/{d.total}
                  </div>
                  <div style={{ width:70, height:6, background:T.line, borderRadius:3, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${d.pct*100}%`, background: d.pct===1?T.green:d.pct>=0.5?T.blue:T.accent, borderRadius:3 }} />
                  </div>
                  <div style={{ fontSize:14, color:T.sub, minWidth:38, textAlign:"right" }}>
                    {Math.round(d.pct*100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CHALLENGES VIEW ── */}
        {view === "challenges" && (
          <div className="su">
            <div className="paper">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <div style={{ fontSize:22, fontWeight:700 }}>🏆 My Challenges</div>
                <button className="btn btn-p" onClick={() => { setEditTarget(null); setForm({ totalDays:"21", startDate:tk }); setModal("challenge"); }}>
                  + New
                </button>
              </div>
              {challenges.map(c => {
                const dn2 = Math.max(1, Math.min(Math.floor((now - new Date(c.startDate)) / 86400000) + 1, c.totalDays));
                const cdone = completions[tk]?.[c.id] || {};
                const cdoneCount = c.routines.filter(r => cdone[r.id]?.done).length;
                const str2 = getStreak(c);
                const pct2 = Math.round(dn2/c.totalDays*100);
                return (
                  <div key={c.id} className={`chcard${c.id===activeId?" on":""}`}
                    onClick={() => { setActiveId(c.id); setView("today"); }}
                  >
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ fontSize:20, fontWeight:700 }}>{c.name}</div>
                          {c.id === activeId && <span style={{ fontSize:12, background:T.green+"25", color:T.green, padding:"2px 8px", borderRadius:10, border:`1px solid ${T.green}40` }}>Active</span>}
                        </div>
                        <div style={{ fontSize:14, color:T.sub, marginTop:2 }}>
                          Day {dn2} of {c.totalDays} · {c.routines.length} habits
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:6 }}>
                        <button className="btn btn-s" style={{ padding:"4px 10px", fontSize:15 }}
                          onClick={e => { e.stopPropagation(); openEditChallenge(c); }}>✏️</button>
                        {challenges.length > 1 && (
                          <button className="btn btn-d" style={{ padding:"4px 10px", fontSize:15 }}
                            onClick={e => { e.stopPropagation(); deleteChallenge(c.id); }}>🗑</button>
                        )}
                      </div>
                    </div>
                    <div style={{ marginTop:10, display:"flex", gap:16, flexWrap:"wrap", fontSize:14, color:T.sub }}>
                      <span>🔥 {str2} streak</span>
                      <span>📋 {cdoneCount}/{c.routines.length} today</span>
                      <span>📅 {pct2}% of challenge done</span>
                    </div>
                    <div className="prog" style={{ marginTop:8 }}>
                      <div className="progbar" style={{ width:`${pct2}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="paper" style={{ marginTop:8 }}>
              <div style={{ fontSize:20, fontWeight:700, marginBottom:10 }}>🔔 Notification Reminders</div>
              {notifPerm === "granted" ? (
                <div style={{ color:T.green, fontSize:17 }}>
                  ✅ Notifications are enabled!<br />
                  <span style={{ color:T.sub, fontSize:15 }}>Set reminders per routine item from the Today view (⏰ button).</span>
                </div>
              ) : notifPerm === "denied" ? (
                <div style={{ color:T.accent, fontSize:16 }}>
                  ❌ Notifications are blocked by your browser.<br />
                  <span style={{ color:T.sub, fontSize:14 }}>Please enable in your browser/device settings and reload.</span>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize:16, color:T.sub, marginBottom:12, lineHeight:1.4 }}>
                    Enable notifications to get daily reminders for each routine. You can set a specific time per habit.
                  </div>
                  <button className="btn btn-p" onClick={requestNotif}>🔔 Enable Notifications</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── MODALS ── */}
        {modal && (
          <div className="mbg" onClick={closeModal}>
            <div className="mod su" onClick={e => e.stopPropagation()}>

              {/* Add/Edit Routine */}
              {modal === "routine" && (
                <>
                  <div style={{ fontSize:22, fontWeight:700, marginBottom:18 }}>
                    {editTarget ? "✏️ Edit Routine" : "➕ Add Routine"}
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label>Routine Name</label>
                    <input className="inp" placeholder="e.g. Morning Run 🏃" value={form.text||""} onChange={e => setForm(p => ({...p, text:e.target.value}))} autoFocus />
                  </div>
                  <div style={{ marginBottom:18 }}>
                    <label>Choose Icon</label>
                    <div className="igrid">
                      {ICONS.map(ic => (
                        <button key={ic} className={`ibtn${form.icon===ic?" sel":""}`} onClick={() => setForm(p => ({...p, icon:ic}))}>{ic}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:10 }}>
                    <button className="btn btn-p" style={{ flex:1 }} onClick={saveRoutine}>
                      {editTarget ? "Save Changes" : "Add Routine"}
                    </button>
                    <button className="btn btn-s" onClick={closeModal}>Cancel</button>
                  </div>
                </>
              )}

              {/* Add/Edit Challenge */}
              {modal === "challenge" && (
                <>
                  <div style={{ fontSize:22, fontWeight:700, marginBottom:18 }}>
                    {editTarget ? "✏️ Edit Challenge" : "🏆 New Challenge"}
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label>Challenge Name</label>
                    <input className="inp" placeholder="e.g. 30 Day Fitness" value={form.name||""} onChange={e => setForm(p => ({...p, name:e.target.value}))} autoFocus />
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label>Duration (days)</label>
                    <input className="inp" type="number" min="1" max="365" placeholder="21" value={form.totalDays||""} onChange={e => setForm(p => ({...p, totalDays:e.target.value}))} />
                  </div>
                  <div style={{ marginBottom:20 }}>
                    <label>Start Date</label>
                    <input className="inp" type="date" value={form.startDate||tk} onChange={e => setForm(p => ({...p, startDate:e.target.value}))} />
                  </div>
                  <div style={{ display:"flex", gap:10 }}>
                    <button className="btn btn-p" style={{ flex:1 }} onClick={saveChallenge}>
                      {editTarget ? "Save Changes" : "Create Challenge"}
                    </button>
                    <button className="btn btn-s" onClick={closeModal}>Cancel</button>
                  </div>
                </>
              )}

              {/* Set Reminder */}
              {modal === "reminder" && editTarget && (
                <>
                  <div style={{ fontSize:22, fontWeight:700, marginBottom:6 }}>⏰ Set Reminder</div>
                  <div style={{ fontSize:18, color:T.sub, marginBottom:18 }}>{editTarget.icon} {editTarget.text}</div>
                  {notifPerm !== "granted" ? (
                    <div>
                      <div style={{ color:T.accent, marginBottom:14, fontSize:16 }}>
                        {notifPerm === "denied" ? "❌ Notifications are blocked. Please enable in browser settings." : "Enable notifications first to set reminders."}
                      </div>
                      {notifPerm !== "denied" && (
                        <button className="btn btn-p" onClick={requestNotif}>🔔 Enable Notifications</button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div style={{ marginBottom:18 }}>
                        <label>Reminder Time</label>
                        <input className="inp" type="time" value={form.time||""} onChange={e => setForm(p => ({...p, time:e.target.value}))} />
                      </div>
                      <div style={{ display:"flex", gap:10 }}>
                        <button className="btn btn-p" style={{ flex:1 }} onClick={() => { setReminder(editTarget.id, form.time); closeModal(); }}>
                          Set Reminder
                        </button>
                        {ch?.reminders?.[editTarget.id] && (
                          <button className="btn btn-d" onClick={() => { setReminder(editTarget.id, null); closeModal(); }}>Remove</button>
                        )}
                        <button className="btn btn-s" onClick={closeModal}>Cancel</button>
                      </div>
                    </>
                  )}
                </>
              )}

            </div>
          </div>
        )}
      </div>
    </>
  );
}
