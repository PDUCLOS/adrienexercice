/*
  Illustrations 3D : « Fluent Emoji » de Microsoft (licence MIT), servies par jsDelivr.
  Les emojis écrits dans les jeux sont remplacés automatiquement par l'image 3D correspondante.
  Sans réseau (ou image absente), l'emoji normal reste affiché : rien ne casse.
  Utilisation : charger ce fichier ; les éléments qui correspondent à Illus.CIBLES sont convertis tout seuls.
*/
(function(){
  const BASE = "https://cdn.jsdelivr.net/npm/@lobehub/fluent-emoji-3d@1.1.0/assets/";
  const CIBLES = ".pic,.e,.scene .h,.scene .b span,.illus";
  const code = e => [...e].map(c => c.codePointAt(0).toString(16)).join("-");
  const decouper = t => window.Intl && Intl.Segmenter
    ? [...new Intl.Segmenter("fr", { granularity:"grapheme" }).segment(t)].map(x => x.segment)
    : (t.match(/\p{Extended_Pictographic}(‍\p{Extended_Pictographic}|️|‍|☠|⃣)*|./gu) || []);
  const estEmoji = s => /\p{Extended_Pictographic}|⃣/u.test(s);

  function img(e){
    const i = document.createElement("img");
    const c = code(e);
    i.className = "ill"; i.alt = ""; i.draggable = false; i.dataset.e = e;
    i.dataset.alt = c.includes("fe0f") ? c.replace(/-fe0f/g, "") : c + "-fe0f";   // 2e essai : avec / sans fe0f
    i.onerror = () => {
      if (!i.dataset.r) { i.dataset.r = 1; i.src = BASE + i.dataset.alt + ".webp"; return }
      const s = document.createElement("span"); s.className = "ill-txt"; s.textContent = e; i.replaceWith(s);
    };
    i.src = BASE + c + ".webp";
    return i;
  }
  /* convertit un élément dont le texte est fait d'emojis (et d'espaces) */
  function convertir(el){
    if (el.dataset.illus === "ok") return;
    const t = el.textContent;
    if (!t.trim() || el.children.length && [...el.children].some(c => !c.classList.contains("ill") && !c.classList.contains("ill-txt"))) return;
    const morceaux = decouper(t.trim());
    if (!morceaux.length || !morceaux.every(m => estEmoji(m) || !m.trim())) return;
    el.dataset.illus = "ok";
    el.textContent = "";
    morceaux.forEach(m => el.appendChild(estEmoji(m) ? img(m) : document.createTextNode(m)));
  }
  function balayer(racine){
    (racine || document).querySelectorAll(CIBLES).forEach(convertir);
  }
  const css = `img.ill{width:1em;height:1em;object-fit:contain;vertical-align:-.12em;filter:drop-shadow(0 .04em .05em rgba(0,0,0,.18));-webkit-user-drag:none;pointer-events:none}`;
  function demarrer(){
    if (!document.getElementById("ill-css")) { const s = document.createElement("style"); s.id = "ill-css"; s.textContent = css; document.head.appendChild(s) }
    balayer();
    let raf = 0;
    new MutationObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => balayer()) })
      .observe(document.body, { childList:true, subtree:true });
  }
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", demarrer) : demarrer();
  window.Illus = { img, balayer, CIBLES };
})();
