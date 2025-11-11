/* Raumpsychologie – Mini-App (DE/EN, LocalStorage, PWA-ready) */
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// Register Service Worker for PWA (GitHub Pages will serve at root)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
  });
}

// UI refs
const scanSec = document.getElementById("scan");
const histSec = document.getElementById("history");
const areasSec = document.getElementById("areas");
const introSec = document.getElementById("intro");

const outs = {
  boden: document.getElementById("out-boden"),
  luft: document.getElementById("out-luft"),
  licht: document.getElementById("out-licht"),
  klang: document.getElementById("out-klang"),
  ordnung: document.getElementById("out-ordnung")
};
const sliders = {
  boden: document.getElementById("s-boden"),
  luft: document.getElementById("s-luft"),
  licht: document.getElementById("s-licht"),
  klang: document.getElementById("s-klang"),
  ordnung: document.getElementById("s-ordnung")
};

const i18n = {
  de: {
    intro: "Dein Zuhause spricht mit deinem Nervensystem – über Boden, Luft, Licht, Klang und Ordnung. Lerne zu „hören“, und du steuerst Ruhe aktiv.",
    scanHint: "Schiebe je Bereich: 1 = unruhig, 10 = sehr ruhig",
    saved: "Gespeichert. Du trainierst Ruhe.",
    empty: "Noch keine Einträge.",
    back: "Zurück",
    barsLabel: v => `${v}/50`
  },
  en: {
    intro: "Your home talks to your nervous system – via floor, air, light, sound and order. Learn to ‘listen’ and you can steer calm.",
    scanHint: "Slide each area: 1 = restless, 10 = very calm",
    saved: "Saved. You're training calm.",
    empty: "No entries yet.",
    back: "Back",
    barsLabel: v => `${v}/50`
  }
};

let lang = localStorage.getItem("rp_lang") || "de";
document.getElementById("lang").value = lang;
applyLang();

// nav
document.getElementById("btn-scan").addEventListener("click", () => showSection("scan"));
document.getElementById("btn-history").addEventListener("click", renderHistory);
document.getElementById("btn-back").addEventListener("click", () => showSection("home"));
document.getElementById("btn-clear").addEventListener("click", () => showSection("home"));

document.getElementById("btn-theme").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("rp_theme", document.body.classList.contains("dark") ? "dark" : "light");
});
if (localStorage.getItem("rp_theme") === "dark") document.body.classList.add("dark");

// sliders
Object.entries(sliders).forEach(([key, el]) => {
  el.addEventListener("input", e => {
    outs[key].textContent = e.target.value;
    calcScan();
  });
});
calcScan();

// save
document.getElementById("btn-save").addEventListener("click", () => {
  const total = sumValues();
  const day = new Date().toISOString().slice(0,10);
  const data = JSON.parse(localStorage.getItem("rp_history") || "[]");
  const exists = data.find(d => d.date === day);
  if (exists) exists.total = total;
  else data.push({ date: day, total });
  // keep last 14
  while (data.length > 14) data.shift();
  localStorage.setItem("rp_history", JSON.stringify(data));
  toast(i18n[lang].saved);
  renderHistory();
});

// language
document.getElementById("lang").addEventListener("change", e => {
  lang = e.target.value;
  localStorage.setItem("rp_lang", lang);
  applyLang();
});

// dialogs open/close
document.querySelectorAll("[data-open]").forEach(btn => {
  btn.addEventListener("click", () => document.getElementById(`dlg-${btn.dataset.open}`).showModal());
});
document.querySelectorAll("dialog [data-close]").forEach(btn => {
  btn.addEventListener("click", e => e.target.closest("dialog").close());
});

// history controls
document.getElementById("btn-reset").addEventListener("click", () => {
  if (!confirm("Verlauf wirklich löschen? / Really clear history?")) return;
  localStorage.removeItem("rp_history");
  renderHistory();
});

function showSection(which){
  // which: "scan" | "history" | "home"
  scanSec.classList.add("hidden");
  histSec.classList.add("hidden");
  if (which === "scan") {
    scanSec.classList.remove("hidden");
    introSec.classList.add("hidden");
  } else if (which === "history") {
    histSec.classList.remove("hidden");
    introSec.classList.add("hidden");
  } else {
    introSec.classList.remove("hidden");
  }
}

function sumValues(){
  return ["boden","luft","licht","klang","ordnung"].reduce((a,k)=>a+Number(sliders[k].value),0);
}

function calcScan(){
  const total = sumValues(); // 5..50
  const badge = document.getElementById("scan-result");
  const pct = Math.round(((total-5) / 45) * 100); // normalize to 0..100
  let color = "#ffd166", text = `Neutral · ${pct}%`;
  if (pct >= 70){ color = "#8ce0c0"; text = `Ruhig · ${pct}%`; }
  else if (pct <= 35){ color = "#ffc9c9"; text = `Unruhig · ${pct}%`; }
  badge.style.background = color;
  badge.textContent = text;
}

function renderHistory(){
  const wrap = document.getElementById("history-bars");
  const data = JSON.parse(localStorage.getItem("rp_history") || "[]");
  wrap.innerHTML = "";
  if (data.length === 0){
    wrap.innerHTML = `<div class="muted">${i18n[lang].empty}</div>`;
  } else {
    data.forEach(d => {
      const h = Math.max(12, Math.round((d.total/50)*56));
      const div = document.createElement("div");
      div.className = "bar";
      div.style.height = h + "px";
      div.title = `${d.date} · ${i18n[lang].barsLabel(d.total)}`;
      div.innerHTML = `<small>${new Date(d.date).toLocaleDateString()}</small>`;
      wrap.appendChild(div);
    });
  }
  showSection("history");
}

function toast(msg){
  const t = document.createElement("div");
  t.textContent = msg;
  t.style.position="fixed"; t.style.bottom="18px"; t.style.left="50%";
  t.style.transform="translateX(-50%)"; t.style.background="#111a";
  t.style.color="#fff"; t.style.padding="10px 14px"; t.style.borderRadius="10px";
  t.style.backdropFilter="blur(8px)"; t.style.zIndex="9999";
  document.body.appendChild(t);
  setTimeout(()=>t.remove(), 1800);
}

function applyLang(){
  document.getElementById("introText").textContent = i18n[lang].intro;
  document.getElementById("scanHint").textContent = i18n[lang].scanHint;
}
