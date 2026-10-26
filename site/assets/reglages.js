/*
  Réglages communs à tous les jeux : niveau, nombre de questions, chrono, lecture à voix haute.
  Utilisation dans un jeu :
    const R = Reglages.init({ key:"cp-mon-jeu-v1", niveaux:{ facile:"…", moyen:"…", difficile:"…" }, onChange: nouvellePartie });
    R().niveau     → "facile" | "moyen" | "difficile"
    R().questions  → 5 | 10 | 15 | 20
    R().son        → "erreur" | "toujours" | "jamais"  (voir Reglages.parler)
    Reglages.chrono(quandFini)  → lance le chrono de la question (rien si « Pas de chrono »)
    Reglages.stop()             → arrête le chrono (bonne réponse)
  Option champs:["niveau","son"] pour n'afficher que certains réglages.
  Les réglages sont gardés sur l'appareil, un jeu à la fois.
*/
(function(){
  const OPTIONS = {
    niveau:    { titre:"Niveau", choix:[["facile","🙂 Facile"],["moyen","😃 Moyen"],["difficile","🔥 Difficile"]] },
    questions: { titre:"Nombre de questions", choix:[[5,"5"],[10,"10"],[15,"15"],[20,"20"]] },
    chrono:    { titre:"Temps pour répondre", choix:[[0,"Pas de chrono"],[20,"20 s"],[10,"10 s"],[6,"6 s"]] },
    son:       { titre:"Voix de la tablette", choix:[["erreur","🔊 Seulement si erreur"],["toujours","🔊 Toujours"],["jamais","🔇 Jamais"]] }
  };
  const DEFAUT = { niveau:"moyen", questions:10, chrono:0, son:"erreur" };
  let key, etat, niveaux, onChange, champs = null, timer = null;

  const css = `
  .rg-btn{display:inline-flex;align-items:center;gap:6px;padding:10px 14px;border-radius:12px;background:var(--chip);font-weight:700;font-size:17px;border:0;cursor:pointer;color:inherit;font-family:inherit}
  .rg-badge{font-size:13px;font-weight:700;padding:2px 8px;border-radius:999px;background:var(--panel)}
  .rg-ov{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:50;
    padding:max(16px,env(safe-area-inset-top,0px)) max(16px,env(safe-area-inset-right,0px)) max(16px,env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px))}
  .rg-ov[hidden]{display:none}
  .rg-box{background:var(--panel);color:var(--ink);border-radius:22px;padding:22px;width:min(560px,100%);max-height:100%;overflow:auto;display:flex;flex-direction:column;gap:16px;box-shadow:0 10px 40px rgba(0,0,0,.3);font-family:inherit}
  .rg-box h2{margin:0;font-size:26px}
  .rg-sec{display:flex;flex-direction:column;gap:8px}
  .rg-sec b{font-size:17px}
  .rg-row{display:flex;flex-wrap:wrap;gap:6px}
  .rg-row button{flex:1 1 auto;padding:12px 10px;border-radius:12px;border:2px solid var(--line);background:var(--bg);font:inherit;font-size:17px;font-weight:700;color:inherit;cursor:pointer}
  .rg-row button.on{background:var(--ink);color:var(--panel);border-color:var(--ink)}
  .rg-aide{color:var(--muted);font-size:15px;margin:0}
  .rg-ok{padding:16px;border-radius:14px;border:0;font:inherit;font-size:20px;font-weight:700;background:var(--ink);color:var(--panel);cursor:pointer}
  .rg-bar{position:fixed;left:0;right:0;top:0;height:calc(8px + env(safe-area-inset-top,0px));z-index:40;pointer-events:none}
  .rg-bar i{display:block;height:100%;width:100%;background:#2f9e44;transform-origin:left;transition:background .3s}
  .rg-bar i.warn{background:#f59f00}.rg-bar i.late{background:#e03131}`;

  function charger(){
    let e; try { e = Object.assign({}, DEFAUT, JSON.parse(localStorage.getItem(key)) || {}) } catch(x) { e = { ...DEFAUT } }
    if (e.son === true) e.son = "erreur"; if (e.son === false) e.son = "jamais";   // anciens réglages oui / non
    return e;
  }
  function sauver(){ try { localStorage.setItem(key, JSON.stringify(etat)) } catch(e) {} }
  const nomNiveau = () => OPTIONS.niveau.choix.find(c => c[0]===etat.niveau)[1];

  function bouton(){
    const b = document.createElement("button");
    b.className = "rg-btn"; b.id = "rgBtn"; b.type = "button";
    b.setAttribute("aria-label","Réglages du jeu");
    const home = document.querySelector("header .home");
    (home ? home.parentNode : document.body).insertBefore(b, home ? home.nextSibling : null);
    b.onclick = ouvrir; maj();
  }
  function maj(){ const b = document.getElementById("rgBtn"); if (b) b.innerHTML = '⚙️ <span class="rg-badge">'+nomNiveau()+'</span>' }

  function ouvrir(){
    stop();
    let brouillon = { ...etat };
    const ov = document.createElement("div"); ov.className = "rg-ov";
    const dessiner = () => {
      ov.innerHTML = '<div class="rg-box" role="dialog" aria-label="Réglages"><h2>⚙️ Réglages</h2>' +
        Object.entries(OPTIONS).filter(([k]) => !champs || champs.includes(k)).map(([k,o]) => '<div class="rg-sec"><b>'+o.titre+'</b><div class="rg-row">' +
          o.choix.map(([v,l]) => '<button type="button" data-k="'+k+'" data-v="'+v+'" class="'+(String(brouillon[k])===String(v)?"on":"")+'">'+l+'</button>').join("") +
          '</div>' + (k==="niveau" && niveaux ? '<p class="rg-aide">'+(niveaux[brouillon.niveau]||"")+'</p>' : '') + '</div>').join("") +
        '<button type="button" class="rg-ok" id="rgOk">✓ Valider et rejouer</button></div>';
      ov.querySelectorAll(".rg-row button").forEach(b => b.onclick = () => {
        const o = OPTIONS[b.dataset.k].choix.find(c => String(c[0])===b.dataset.v);
        brouillon[b.dataset.k] = o[0]; dessiner();
      });
      ov.querySelector("#rgOk").onclick = () => { etat = brouillon; sauver(); maj(); ov.remove(); onChange && onChange() };
    };
    ov.onclick = e => { if (e.target===ov) { ov.remove(); onChange && onChange() } };
    dessiner(); document.body.appendChild(ov);
  }

  function chrono(quandFini){
    stop();
    if (!etat.chrono) return;
    const total = etat.chrono*1000, debut = performance.now();
    const bar = document.createElement("div"); bar.className = "rg-bar"; bar.innerHTML = "<i></i>";
    document.body.appendChild(bar);
    const i = bar.firstChild;
    const pas = () => {
      const reste = 1 - (performance.now()-debut)/total;
      if (reste <= 0) { stop(); quandFini && quandFini(); return }
      i.style.transform = "scaleX("+reste+")";
      i.className = reste < .25 ? "late" : reste < .5 ? "warn" : "";
      timer = { raf: requestAnimationFrame(pas), bar };
    };
    timer = { raf: requestAnimationFrame(pas), bar };
  }
  function stop(){ if (timer) { cancelAnimationFrame(timer.raf); timer.bar.remove(); timer = null } }

  /* Un écran d'exercice doit tenir sur une vue de tablette, sans défiler :
     si le contenu dépasse, on le réduit (zoom) juste ce qu'il faut. Les pages-listes défilent normalement. */
  const LISTES = ".parents,.paroles,.books,.parcours";
  let fitRaf = 0;
  function ajuster(){
    cancelAnimationFrame(fitRaf);
    fitRaf = requestAnimationFrame(() => {
      const main = document.querySelector("main"); if (!main) return;
      main.style.zoom = "";
      if (main.querySelector(LISTES)) return;
      const header = document.querySelector("header"), cs = getComputedStyle(document.body);
      const dispo = window.innerHeight - (header ? header.offsetHeight : 0) - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - 4;
      const flex = main.style.flex; main.style.flex = "none";          // hauteur naturelle du contenu
      const besoin = main.scrollHeight, large = main.scrollWidth, dispoL = document.documentElement.clientWidth;
      main.style.flex = flex;
      const z = Math.min(1, dispo / besoin, dispoL / Math.max(large, 1));
      if (z < 1) main.style.zoom = Math.max(.5, z).toFixed(3);
    });
  }
  function surveiller(){
    const main = document.querySelector("main"); if (!main) return;
    new MutationObserver(ajuster).observe(main, { childList:true, subtree:true, characterData:true });
    window.addEventListener("resize", ajuster);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(ajuster);
    ajuster();
  }

  function init(o){
    key = o.key + "-reglages"; niveaux = o.niveaux; onChange = o.onChange; champs = o.champs || null;
    etat = charger();
    if (!document.getElementById("rg-css")) { const s = document.createElement("style"); s.id = "rg-css"; s.textContent = css; document.head.appendChild(s) }
    bouton(); surveiller();
    return () => etat;
  }
  /* Prononciation : la voix lit « é » tout seul « e accent aigu ». On le remplace par « et » (même son [é]).
     Branché sur toute la page : vaut pour tous les jeux, quelle que soit la façon dont ils font parler la tablette. */
  const prononcer = t => String(t).replace(/(^|[\s,.;:!?«»"'’()\-])[éÉ](?=$|[\s,.;:!?«»"'’()\-])/g, "$1et");
  try {
    const parlerOrig = speechSynthesis.speak.bind(speechSynthesis);
    speechSynthesis.speak = u => { try { u.text = prononcer(u.text) } catch(x) {} parlerOrig(u) };
  } catch(x) {}
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop() });
  /* Voix : la consigne est toujours dite ; une bonne réponse seulement si « Toujours » ;
     une erreur sauf si « Jamais » (c'est là que la voix aide l'enfant seul). */
  function parler(texte, quand){
    const s = etat ? etat.son : "erreur";
    if (s === "jamais" && quand !== "consigne") return;
    if (quand === "succes" && s !== "toujours") return;
    try { const u = new SpeechSynthesisUtterance(texte); u.lang = "fr-FR"; u.rate = .8; speechSynthesis.cancel(); speechSynthesis.speak(u) } catch(x) {}
  }
  /* Pas deux fois la même question dans une série : const neuf = Reglages.sansDoublon(); neuf(() => question(), q => q.cle) */
  function sansDoublon(){
    const vus = new Set();
    return (gen, cle = x => JSON.stringify(x)) => {
      let x, k, n = 0;
      do { x = gen(); k = cle(x); n++ } while (vus.has(k) && n < 400);
      vus.add(k); return x;
    };
  }
  window.Reglages = { init, chrono, stop, parler, sansDoublon };
})();
