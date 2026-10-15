// Flora — Herbário digital · protótipo navegável em JavaScript simples

// Ícones (SVG em linha)
const p = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const icon = {
  left: p('<path d="m12 19-7-7 7-7M19 12H5"/>'),
  right: p('<path d="M5 12h14M12 5l7 7-7 7"/>'),
  chevron: p('<path d="m9 18 6-6-6-6"/>'),
  leaf: p('<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/>'),
  bell: p('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>'),
  plus: p('<path d="M12 5v14M5 12h14"/>'),
  search: p('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>'),
  home: p('<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>'),
  sprout: p('<path d="M7 20h10M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>'),
  calendar: p('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
  heart: p('<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>'),
  sun: p('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/>'),
  drop: p('<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5S5 13 5 15a7 7 0 0 0 7 7z"/>'),
  eye: p('<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>'),
  flower: p('<circle cx="12" cy="12" r="3"/><path d="M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5"/>'),
  pin: p('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>'),
  settings: p('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),
  check: p('<path d="M20 6 9 17l-5-5"/>'),
};

const img = {
  cover: "images/botanical-cover.jpg",
  monstera: "images/monstera.jpg",
  collection: "images/plant-collection.jpg",
  care: "images/plant-care.jpg",
};

// Os sete ecrãs, pela ordem do fluxograma
const screens = [
  { id: "capa", label: "Capa", info: "Apresenta a experiência e abre os acessos." },
  { id: "entrar", label: "Entrar", info: "Recupera o jardim de quem já tem conta." },
  { id: "registo", label: "Registo", info: "Cria o perfil e define o nível de experiência." },
  { id: "inicio", label: "Início", info: "Resume a coleção, os cuidados e a descoberta." },
  { id: "plantas", label: "Registo de plantas", info: "Pesquisa espécies e regista novas plantas." },
  { id: "inventario", label: "Inventário", info: "Organiza as plantas por espaço e estado." },
  { id: "cuidados", label: "Cuidados", info: "Mostra a rotina e conclui tarefas programadas." },
];

const state = { screen: "capa", added: false, done: [], level: 0 };

// Peças reutilizáveis
const topbar = (title, back, action = "") => `
  <header class="topbar">
    <div>${back ? `<button class="icon-btn" data-go="${back}" aria-label="Voltar">${icon.left}</button>` : `<span class="leaf-badge">${icon.leaf}</span>`}</div>
    <span class="title">${title}</span>
    <div>${action}</div>
  </header>`;

const nav = (current) => `
  <nav class="nav grow" aria-label="Navegação principal">
    ${[["inicio", "Início", icon.home], ["plantas", "Explorar", icon.search], ["inventario", "Jardim", icon.sprout], ["cuidados", "Cuidados", icon.calendar]]
      .map(([id, label, ic]) => `<button data-go="${id}" class="${current === id ? "on" : ""}">${ic}${label}</button>`).join("")}
  </nav>`;

const chips = (items, cls = "on") => `<div class="chips">${items.map((t, i) => `<button class="chip ${i === 0 ? cls : ""}">${t}</button>`).join("")}</div>`;

// Ecrãs
const views = {
  capa: () => `
    <div class="screen" style="padding:8px 16px 0">
      <div class="media" style="min-height:390px;border-radius:1.8rem">
        <img src="${img.cover}" alt="Folhas de monstera e fetos" style="position:absolute;inset:0;height:100%" />
        <div class="over" style="padding:24px;display:block">
          <div class="eyebrow" style="color:inherit;display:flex;gap:8px;align-items:center;margin-bottom:12px">${icon.leaf} Herbário digital</div>
          <h2 class="display" style="font-size:48px;line-height:.92">Conhece.<br>Cultiva. Cuida.</h2>
        </div>
      </div>
      <div style="flex:1;display:flex;flex-direction:column;padding:24px 8px 20px">
        <p class="muted" style="font-size:14px;line-height:1.6">Descobre o mundo vegetal e mantém cada planta saudável, num só lugar.</p>
        <div class="grow" style="display:grid;gap:8px">
          <button class="btn btn-primary" data-go="registo">Criar a minha conta ${icon.right}</button>
          <button class="btn btn-glass" data-go="entrar">Já tenho conta</button>
        </div>
      </div>
    </div>`,

  entrar: () => auth(false),
  registo: () => auth(true),

  inicio: () => `
    <div class="screen"><div class="pad">
      ${topbar("Flora", null, `<button class="icon-btn" aria-label="Notificações">${icon.bell}</button>`)}
      <p class="eyebrow" style="margin-top:12px">Terça-feira · 6 outubro</p>
      <h2 class="display" style="font-size:30px;margin-top:4px">Bom dia, Madalena.</h2>
      <p class="muted" style="font-size:12px;margin-top:4px">Duas plantas precisam de atenção hoje.</p>
      <button class="media" data-go="cuidados" style="width:100%;margin-top:20px;text-align:left">
        <img src="${img.care}" alt="Rega de uma planta" style="height:176px" />
        <span class="over"><span><small>Cuidado prioritário</small><strong class="display" style="font-size:20px;font-weight:500">Regar a Jiboia</strong></span><span class="round">${icon.chevron}</span></span>
      </button>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:20px">
        <h3 class="display" style="font-size:20px">O meu jardim</h3><button class="link" data-go="inventario">Ver tudo</button>
      </div>
      <button class="glass-card" data-go="inventario" style="margin-top:12px">
        <img src="${img.collection}" alt="" style="width:64px;height:64px;border-radius:12px" />
        <span style="flex:1"><strong style="display:block;font-size:14px;font-weight:500">${state.added ? 7 : 6} plantas</strong><span class="muted small">Sala, cozinha e varanda</span></span>
        <span style="color:var(--primary)">${icon.chevron}</span>
      </button>
      <button class="btn btn-glass" data-go="plantas" style="margin-top:12px;height:40px">${icon.plus} Registar nova planta</button>
    </div>${nav("inicio")}</div>`,

  plantas: () => `
    <div class="screen"><div class="pad">
      ${topbar("Registo de plantas", "inicio")}
      <div style="position:relative;margin-top:12px">
        <span class="muted" style="position:absolute;left:12px;top:12px">${icon.search}</span>
        <input style="width:100%;height:40px;border-radius:999px;padding-left:36px" placeholder="Procurar espécie ou família" />
      </div>
      ${chips(["Todas", "Interior", "Exterior", "Aromáticas"])}
      <p class="eyebrow" style="margin-top:20px">Sugestão para ti</p>
      <article class="glass-card" style="display:block;padding:0;overflow:hidden;margin-top:8px">
        <img src="${img.monstera}" alt="Monstera deliciosa num vaso" style="height:192px" />
        <div style="padding:16px">
          <div style="display:flex;justify-content:space-between;gap:12px">
            <div><h2 class="display" style="font-size:24px">Costela-de-adão</h2><p class="muted small" style="font-style:italic">Monstera deliciosa · Araceae</p></div>
            <button class="icon-btn btn-glass" id="fav" aria-label="Favorito">${icon.heart}</button>
          </div>
          <div class="metrics">
            <div class="metric">${icon.sun}<span>Luz</span><strong>Indireta</strong></div>
            <div class="metric">${icon.drop}<span>Rega</span><strong>Semanal</strong></div>
            <div class="metric">${icon.eye}<span>Nível</span><strong>Fácil</strong></div>
          </div>
          <button class="btn btn-primary" id="add" style="margin-top:16px;height:40px">${icon.plus} Adicionar ao inventário</button>
        </div>
      </article>
    </div>${nav("plantas")}</div>`,

  inventario: () => `
    <div class="screen"><div class="pad">
      ${topbar("Inventário", "inicio", `<button class="icon-btn btn-glass" data-go="plantas" aria-label="Adicionar planta">${icon.plus}</button>`)}
      <div style="margin-top:12px;padding:16px;border-radius:16px;background:var(--primary);color:var(--primary-fg)">
        <small style="font-size:9px;text-transform:uppercase;letter-spacing:.18em;opacity:.75">O teu jardim</small>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:4px">
          <strong class="display" style="font-size:30px;font-weight:500">${state.added ? 7 : 6} plantas</strong><span class="xs" style="opacity:.8">3 espaços</span>
        </div>
      </div>
      ${chips(["Todas", "Interior", "Exterior"], "soft")}
      <div style="display:grid;gap:12px;margin-top:20px">
        ${[["Monstera", "Sala", "Regar em 2 dias", img.monstera], ["Coleção da cozinha", "Cozinha", "Adubar hoje", img.collection]]
          .map(([n, place, care, src]) => `
          <button class="glass-card" data-go="cuidados">
            <img src="${src}" alt="" style="width:80px;height:80px;border-radius:12px" />
            <span style="flex:1;min-width:0">
              <strong class="display" style="display:block;font-size:18px;font-weight:500">${n}</strong>
              <span class="muted xs" style="display:flex;gap:4px;align-items:center;margin-top:2px">${icon.pin}${place}</span>
              <span class="xs" style="display:block;margin-top:8px;color:var(--primary);font-weight:500">${care}</span>
            </span><span style="color:var(--primary)">${icon.chevron}</span>
          </button>`).join("")}
      </div>
    </div>${nav("inventario")}</div>`,

  cuidados: () => {
    const tasks = [["water", icon.drop, "Regar Jiboia", "Hoje · Cozinha"], ["feed", icon.flower, "Adubar Calateia", "Hoje · Sala"], ["light", icon.sun, "Rodar Monstera", "Amanhã · Sala"]];
    return `
    <div class="screen"><div class="pad">
      ${topbar("Cuidados", "inventario", `<button class="icon-btn" aria-label="Definições">${icon.settings}</button>`)}
      <div class="media" style="margin-top:12px">
        <img src="${img.care}" alt="Rega cuidadosa de uma planta" style="height:160px" />
        <span class="over"><span><small>Rotina de hoje</small><strong class="display" style="font-size:24px;font-weight:500">${3 - state.done.length} por concluir</strong></span></span>
      </div>
      <div class="week">${["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => `<div><span>${d}</span><b class="${i === 1 ? "on" : ""}">${5 + i}</b></div>`).join("")}</div>
      <p class="eyebrow" style="margin-top:20px">Tarefas</p>
      <div class="stack">
        ${tasks.map(([id, ic, t, d]) => `
          <button class="glass-card task ${state.done.includes(id) ? "done" : ""}" data-task="${id}">
            <span class="leaf-badge">${ic}</span>
            <span style="flex:1"><strong style="display:block;font-size:12px;font-weight:500">${t}</strong><span class="muted xs">${d}</span></span>
            <span class="check">${state.done.includes(id) ? icon.check : ""}</span>
          </button>`).join("")}
      </div>
    </div>${nav("cuidados")}</div>`;
  },
};

function auth(reg) {
  return `
    <div class="screen" style="padding:0 20px 24px">
      ${topbar(reg ? "Criar conta" : "Bem-vinda de volta", "capa")}
      <div style="margin-top:28px">
        <span class="eyebrow">${reg ? "O teu herbário começa aqui" : "Continua a cuidar"}</span>
        <h2 class="display" style="font-size:36px;line-height:1.15;margin-top:8px">${reg ? "Vamos cultivar conhecimento." : "O teu jardim espera por ti."}</h2>
        <p class="muted" style="font-size:14px;line-height:1.6;margin-top:12px">${reg ? "Cria um espaço para aprender e acompanhar as tuas plantas." : "Entra para consultar a coleção e os cuidados de hoje."}</p>
      </div>
      <form id="auth">
        ${reg ? `<label>Nome<input required placeholder="Como te devemos chamar?" /></label>` : ""}
        <label>Email<input required type="email" placeholder="nome@email.pt" /></label>
        <label>Palavra-passe<input required type="password" placeholder="••••••••" /></label>
        ${reg ? `<div><span style="font-size:11px;font-weight:600">Experiência com plantas</span><div class="levels">
          ${["A começar", "Curiosa", "Experiente"].map((t, i) => `<button type="button" class="chip ${i === state.level ? "soft" : ""}" data-level="${i}">${t}</button>`).join("")}
        </div></div>` : ""}
        <button class="btn btn-primary" type="submit" style="margin-top:12px">${reg ? "Criar conta" : "Entrar"} ${icon.right}</button>
      </form>
      <button class="link grow muted" data-go="${reg ? "entrar" : "registo"}" style="padding-top:32px;color:var(--muted-fg)">${reg ? "Já tens conta? Entrar" : "Ainda não tens conta? Criar conta"}</button>
    </div>`;
}

// Renderização e gatilhos
const $ = (id) => document.getElementById(id);

function go(next) {
  state.screen = next;
  render();
  $("screen").scrollTop = 0;
}

function render() {
  const i = screens.findIndex((s) => s.id === state.screen);
  $("screen").innerHTML = views[state.screen]();
  $("step-label").innerHTML = `<span class="muted">${i + 1}/7 · </span><strong style="font-weight:500">${screens[i].label}</strong>`;
  $("caption").textContent = screens[i].info;
  $("prev").disabled = i === 0;
  $("next").disabled = i === screens.length - 1;
}

$("prev").innerHTML = icon.left;
$("next").innerHTML = icon.right;
$("prev").onclick = () => go(screens[Math.max(0, screens.findIndex((s) => s.id === state.screen) - 1)].id);
$("next").onclick = () => go(screens[Math.min(6, screens.findIndex((s) => s.id === state.screen) + 1)].id);

$("screen").addEventListener("click", (e) => {
  const el = e.target.closest("button");
  if (!el) return;
  if (el.dataset.go) return go(el.dataset.go);
  if (el.dataset.task) {
    const id = el.dataset.task;
    state.done = state.done.includes(id) ? state.done.filter((x) => x !== id) : [...state.done, id];
    return render();
  }
  if (el.dataset.level) { state.level = Number(el.dataset.level); return render(); }
  if (el.id === "add") { state.added = true; return go("inventario"); }
  if (el.id === "fav") el.style.color = el.style.color ? "" : "var(--primary)";
});

$("screen").addEventListener("submit", (e) => { e.preventDefault(); go("inicio"); });

render();
