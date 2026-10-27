/* Bautismo de Walter — comportamento do site */
(function () {
  "use strict";

  var CFG = window.BAUTISMO_CONFIG || {};
  var I18N = window.I18N || { pt: {}, ui: { es: {}, pt: {} } };
  var MAX = CFG.maxPorTipo || 12;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function fmt(str, data) { return String(str).replace(/\{(\w+)\}/g, function (_, k) { return data[k] != null ? data[k] : ""; }); }
  function store(key, val) {
    try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; }
  }

  /* =========================================================
     Idioma (ES no HTML, PT em i18n.js)
     ========================================================= */
  var lang = "es";
  var originals = { text: new Map(), alt: new Map(), aria: new Map() };
  $$("[data-i18n]").forEach(function (el) { originals.text.set(el, el.innerHTML); });
  $$("[data-i18n-alt]").forEach(function (el) { originals.alt.set(el, el.getAttribute("alt")); });
  $$("[data-i18n-aria]").forEach(function (el) { originals.aria.set(el, el.getAttribute("aria-label")); });

  function ui(key) { return (I18N.ui[lang] && I18N.ui[lang][key]) || I18N.ui.es[key] || key; }

  function setLang(next) {
    lang = next === "pt" ? "pt" : "es";
    var dict = I18N.pt;
    originals.text.forEach(function (es, el) {
      var key = el.getAttribute("data-i18n");
      el.innerHTML = lang === "pt" && dict[key] != null ? dict[key] : es;
    });
    originals.alt.forEach(function (es, el) {
      var key = el.getAttribute("data-i18n-alt");
      el.setAttribute("alt", lang === "pt" && dict[key] != null ? dict[key] : es);
    });
    originals.aria.forEach(function (es, el) {
      var key = el.getAttribute("data-i18n-aria");
      el.setAttribute("aria-label", lang === "pt" && dict[key] != null ? dict[key] : es);
    });
    document.documentElement.lang = lang === "pt" ? "pt-BR" : "es";
    document.title = ui("title");
    $$(".lang__btn").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.lang === lang)); });
    store("bautismo-lang", lang);
    buildCalendar();
    if (rsvp.ready) { renderPeople(); updateTally(); refreshThanks(); }
    if (typeof redrawLace === "function") requestAnimationFrame(redrawLace);
  }

  $$(".lang__btn").forEach(function (b) {
    b.addEventListener("click", function () { setLang(b.dataset.lang); });
  });

  function initialLang() {
    var q = new URLSearchParams(location.search).get("lang");
    if (q === "pt" || q === "es") return q;
    var saved = store("bautismo-lang");
    if (saved === "pt" || saved === "es") return saved;
    // idioma do aparelho: o primeiro da lista de preferências que seja português ou espanhol
    var prefs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ""]);
    for (var i = 0; i < prefs.length; i++) {
      var l = String(prefs[i] || "").toLowerCase();
      if (l.indexOf("pt") === 0) return "pt";
      if (l.indexOf("es") === 0) return "es";
    }
    return "es";
  }

  /* =========================================================
     Renda calada em volta do convite (SVG desenhado no tamanho do cartão)
     ========================================================= */
  var SVGNS = "http://www.w3.org/2000/svg";
  function circle(cx, cy, r, cw) {
    // cw = sentido horário (cheio); anti-horário = furo (regra nonzero)
    var s = cw ? 1 : 0;
    return "M" + (cx - r) + " " + cy + "a" + r + " " + r + " 0 1 " + s + " " + 2 * r + " 0a" + r + " " + r + " 0 1 " + s + " " + -2 * r + " 0";
  }
  function ellipse(cx, cy, rx, ry, deg, cw) {
    var t = deg * Math.PI / 180, dx = rx * Math.cos(t), dy = rx * Math.sin(t), s = cw ? 1 : 0;
    var a = "A" + rx + " " + ry + " " + deg + " 1 " + s + " ";
    return "M" + (cx + dx) + " " + (cy + dy) + a + (cx - dx) + " " + (cy - dy) + a + (cx + dx) + " " + (cy + dy) + "Z";
  }
  function lacePath(W, H, band) {
    var r = band < 25 ? 5.5 : 7.5;
    var x0 = r, y0 = r, x1 = W - r, y1 = H - r;
    var p = "M" + x0 + " " + y0;
    function edge(len, dx, dy) {
      var n = Math.max(1, Math.round(len / (2 * r))), d = len / n, hr = d / 2, out = "";
      for (var i = 0; i < n; i++) out += "a" + hr + " " + hr + " 0 0 1 " + dx * d + " " + dy * d;
      return { s: out, n: n, d: d };
    }
    var top = edge(x1 - x0, 1, 0), right = edge(y1 - y0, 0, 1), bottom = edge(x1 - x0, -1, 0), left = edge(y1 - y0, 0, -1);
    p += top.s + right.s + bottom.s + left.s + "Z";

    var holes = "", i, k;
    // ilhós dentro de cada onda
    var hr1 = r * 0.36;
    for (i = 0; i < top.n; i++) {
      holes += circle(x0 + top.d * (i + 0.5), y0 + r * 0.1, hr1, false);
      holes += circle(x0 + top.d * (i + 0.5), y1 - r * 0.1, hr1, false);
    }
    for (i = 0; i < right.n; i++) {
      holes += circle(x1 - r * 0.1, y0 + right.d * (i + 0.5), hr1, false);
      holes += circle(x0 + r * 0.1, y0 + right.d * (i + 0.5), hr1, false);
    }
    // fileira do meio: ilhós grandes e pequenos alternados
    var m = r + (band - r) * 0.52, step = band < 25 ? 10 : 13, big = band < 25 ? 2.4 : 3.2, small = band < 25 ? 1.2 : 1.6;
    var lenX = W - 2 * m - 2 * band, lenY = H - 2 * m - 2 * band;
    var nx = Math.max(1, Math.round(lenX / step)), ny = Math.max(1, Math.round(lenY / step));
    for (k = 0; k <= nx; k++) {
      var xx = m + band + (lenX * k) / nx, rr = k % 2 ? small : big;
      holes += circle(xx, m, rr, false) + circle(xx, H - m, rr, false);
    }
    for (k = 0; k <= ny; k++) {
      var yy = m + band + (lenY * k) / ny, r2 = k % 2 ? small : big;
      holes += circle(m, yy, r2, false) + circle(W - m, yy, r2, false);
    }
    // pontinhos junto à borda do cartão
    var inner = band - (band < 25 ? 3.5 : 5), st = band < 25 ? 6 : 7.5, tiny = band < 25 ? 0.9 : 1.15;
    var lx = W - 2 * inner, ly = H - 2 * inner, mx = Math.round(lx / st), my = Math.round(ly / st);
    for (k = 1; k < mx; k++) holes += circle(inner + (lx * k) / mx, inner, tiny, false) + circle(inner + (lx * k) / mx, H - inner, tiny, false);
    for (k = 1; k < my; k++) holes += circle(inner, inner + (ly * k) / my, tiny, false) + circle(W - inner, inner + (ly * k) / my, tiny, false);

    // rosetas nos quatro cantos
    var ros = "";
    [[m, m], [W - m, m], [m, H - m], [W - m, H - m]].forEach(function (c) {
      var dist = band * 0.5, prx = band * 0.44, pry = band * 0.23;
      for (var j = 0; j < 6; j++) {
        var ang = j * 60 + 15, t = ang * Math.PI / 180;
        var px = c[0] + dist * Math.cos(t), py = c[1] + dist * Math.sin(t);
        ros += ellipse(px, py, prx, pry, ang, true);
        ros += ellipse(px + prx * 0.12 * Math.cos(t), py + prx * 0.12 * Math.sin(t), prx * 0.48, pry * 0.36, ang, false);
      }
      ros += circle(c[0], c[1], band * 0.24, true) + circle(c[0], c[1], band * 0.1, false);
    });
    return p + holes + ros;
  }

  var laceCard = $("[data-lace]");
  var laceSvg = null;
  function redrawLace() {
    if (!laceCard) return;
    var band = parseFloat(getComputedStyle(laceCard).getPropertyValue("--band")) || 30;
    var W = laceCard.offsetWidth + 2 * band, H = laceCard.offsetHeight + 2 * band;
    if (!laceSvg) {
      laceSvg = document.createElementNS(SVGNS, "svg");
      laceSvg.setAttribute("class", "lace");
      laceSvg.setAttribute("aria-hidden", "true");
      laceSvg.setAttribute("overflow", "visible");
      laceSvg.appendChild(document.createElementNS(SVGNS, "path"));
      laceCard.insertBefore(laceSvg, laceCard.firstChild);
    }
    laceSvg.setAttribute("width", W);
    laceSvg.setAttribute("height", H);
    laceSvg.setAttribute("viewBox", "0 0 " + W + " " + H);
    var path = laceSvg.firstChild;
    path.setAttribute("d", lacePath(W, H, band));
    path.setAttribute("fill", "#ffffff");
    path.setAttribute("fill-rule", "nonzero");
  }
  if (laceCard) {
    redrawLace();
    if ("ResizeObserver" in window) new ResizeObserver(function () { redrawLace(); }).observe(laceCard);
    else window.addEventListener("resize", redrawLace);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(redrawLace);
  }

  /* =========================================================
     Entradas, barra, mapas
     ========================================================= */
  var hero = $(".hero");
  function heroReady() { if (hero) hero.classList.add("is-ready"); }
  var heroImg = $(".hero__angel img");
  if (heroImg && !heroImg.complete) { heroImg.addEventListener("load", heroReady); heroImg.addEventListener("error", heroReady); setTimeout(heroReady, 1200); }
  else requestAnimationFrame(function () { requestAnimationFrame(heroReady); });

  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    $$(".reveal").forEach(function (el) {
      // dentro de um grupo, cada filho entra um pouco depois do anterior
      var parent = el.parentElement, sibs = parent ? $$(":scope > .reveal", parent) : [el];
      var idx = sibs.indexOf(el);
      if (idx > 0) el.style.transitionDelay = Math.min(idx * 80, 240) + "ms";
      io.observe(el);
    });
  } else {
    $$(".reveal").forEach(function (el) { el.classList.add("is-in"); });
  }

  var bar = $(".bar");
  function onScroll() { if (bar) bar.classList.toggle("is-stuck", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // os mapas só carregam quando a seção se aproxima
  var frames = $$("iframe[data-src]");
  function loadFrame(f) { if (!f.src) f.src = f.dataset.src; }
  if ("IntersectionObserver" in window) {
    var mo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { loadFrame(e.target); mo.unobserve(e.target); } });
    }, { rootMargin: "600px 0px" });
    frames.forEach(function (f) { mo.observe(f); });
  } else frames.forEach(loadFrame);

  /* =========================================================
     Agenda
     ========================================================= */
  function buildCalendar() {
    var title = ui("cal_title"), details = ui("cal_details");
    var where = "Parroquia de las Mercedes, Asunción, Paraguay";
    var g = $("#cal-google"), ics = $("#cal-ics");
    if (g) {
      g.href = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
        "&text=" + encodeURIComponent(title) +
        "&dates=20261101T133000Z/20261101T210000Z" +
        "&details=" + encodeURIComponent(details + "\n" + location.href.split("#")[0]) +
        "&location=" + encodeURIComponent(where);
    }
    if (ics) {
      var esc = function (s) { return s.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n"); };
      var body = [
        "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Bautismo de Walter//ES", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        "UID:bautismo-walter-20261101@batizado-walter",
        "DTSTAMP:20261022T120000Z",
        "DTSTART:20261101T133000Z",
        "DTEND:20261101T210000Z",
        "SUMMARY:" + esc(title),
        "LOCATION:" + esc(where),
        "DESCRIPTION:" + esc(details),
        "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", "DESCRIPTION:" + esc(title), "END:VALARM",
        "END:VEVENT", "END:VCALENDAR"
      ].join("\r\n");
      ics.href = "data:text/calendar;charset=utf-8," + encodeURIComponent(body);
    }
  }

  /* =========================================================
     Confirmação de presença
     ========================================================= */
  var form = $("#rsvp-form");
  var rsvp = { ready: false, adults: 1, kids: 0, people: [], nameTouched: false, last: null };

  function selected(name) { var el = form && form.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ""; }
  function attending() { return selected("asiste") === "si"; }
  function event() { return selected("evento") || "ambos"; }
  function goesToParty() { return attending() && event() !== "misa"; }

  function syncPeople() {
    var adults = rsvp.people.filter(function (p) { return p.tipo === "adulto"; });
    var kids = rsvp.people.filter(function (p) { return p.tipo === "nino"; });
    while (adults.length < rsvp.adults) adults.push({ tipo: "adulto", nombre: "" });
    while (kids.length < rsvp.kids) kids.push({ tipo: "nino", nombre: "", edad: "" });
    adults.length = rsvp.adults; kids.length = rsvp.kids;
    rsvp.people = adults.concat(kids);
    if (!rsvp.nameTouched && rsvp.people[0]) rsvp.people[0].nombre = $("#f-nombre").value.trim();
  }

  function renderPeople() {
    var list = $("#people-list");
    if (!list) return;
    var party = goesToParty();
    var nA = 0, nK = 0;
    var focused = document.activeElement && document.activeElement.id;
    list.innerHTML = "";
    rsvp.people.forEach(function (p, i) {
      var n = p.tipo === "adulto" ? ++nA : ++nK;
      var tag = (p.tipo === "adulto" ? ui("adult") : ui("kid")) + " " + n;
      var li = document.createElement("li");
      li.className = "person";
      li.dataset.party = String(party);
      if (reduceMotion || !rsvp.animateNext || i < rsvp.animateFrom) li.style.animation = "none";

      var head = document.createElement("div");
      head.className = "person__head";
      head.innerHTML = '<span class="person__tag"></span>';
      head.firstChild.textContent = tag;
      li.appendChild(head);

      var input = document.createElement("input");
      input.type = "text"; input.id = "p-" + i; input.maxLength = 80; input.autocomplete = "off";
      input.placeholder = ui("name_ph");
      input.setAttribute("aria-label", tag + ": " + ui("name_ph"));
      input.value = p.nombre;
      input.addEventListener("input", function () {
        p.nombre = input.value;
        if (i === 0) rsvp.nameTouched = true;
        input.removeAttribute("aria-invalid");
      });
      li.appendChild(input);

      if (p.tipo === "nino") {
        var ag = document.createElement("div");
        ag.className = "age";
        var al = document.createElement("label");
        al.htmlFor = "a-" + i; al.textContent = ui("age_label");
        var as = document.createElement("select");
        as.id = "a-" + i;
        as.setAttribute("aria-label", tag + ": " + ui("age_label"));
        var o0 = document.createElement("option"); o0.value = ""; o0.textContent = ui("age_choose"); as.appendChild(o0);
        for (var y = 0; y <= 17; y++) {
          var oy = document.createElement("option");
          oy.value = String(y);
          oy.textContent = y === 0 ? ui("age_under1") : y + " " + (y === 1 ? ui("year") : ui("years"));
          if (p.edad === String(y)) oy.selected = true;
          as.appendChild(oy);
        }
        as.addEventListener("change", function () { p.edad = as.value; as.removeAttribute("aria-invalid"); clearError("personas"); });
        ag.appendChild(al); ag.appendChild(as);
        li.appendChild(ag);
      }

      list.appendChild(li);
    });
    rsvp.animateNext = false;
    if (focused && document.getElementById(focused)) document.getElementById(focused).focus();
  }

  function updateSteppers() {
    $$(".stepper").forEach(function (st) {
      var kind = st.dataset.kind, val = kind === "adulto" ? rsvp.adults : rsvp.kids, min = kind === "adulto" ? 1 : 0;
      $(".stepper__val", st).textContent = val;
      $('[data-step="-1"]', st).disabled = val <= min;
      $('[data-step="1"]', st).disabled = val >= MAX;
    });
  }

  function countLine(a, k) {
    var parts = [a + " " + (a === 1 ? ui("adult1") : ui("adults"))];
    if (k) parts.push(k + " " + (k === 1 ? ui("kid1") : ui("kids")));
    return parts.join(" " + ui("and") + " ");
  }

  function updateTally() {
    var big = $("#tally-big"), small = $("#tally-small");
    if (!big) return;
    var a = selected("asiste");
    if (a === "no") { big.textContent = "—"; small.textContent = ui("tally_no"); return; }
    if (a !== "si") { big.textContent = "—"; small.textContent = ui("tally_empty"); return; }
    var total = rsvp.adults + rsvp.kids;
    big.textContent = String(total);
    var line = (total === 1 ? ui("person") : ui("people")) + " · " + countLine(rsvp.adults, rsvp.kids) + " · " + ui("ev_" + event());
    small.textContent = line;
  }

  function setError(key, msg) {
    var p = form.querySelector('.field__error[data-for="' + key + '"]');
    if (p) p.textContent = msg || "";
  }
  function clearError(key) { setError(key, ""); }

  function validate() {
    var ok = true, first = null;
    var name = $("#f-nombre");
    if (!name.value.trim()) { setError("nombre", ui("err_name")); name.setAttribute("aria-invalid", "true"); ok = false; first = first || name; }
    else { clearError("nombre"); name.removeAttribute("aria-invalid"); }
    var a = selected("asiste");
    if (!a) { setError("asiste", ui("err_attend")); ok = false; first = first || form.querySelector('input[name="asiste"]'); }
    else clearError("asiste");
    if (a === "si") {
      var missingName = -1, missingAge = -1;
      rsvp.people.forEach(function (p, i) {
        if (!p.nombre.trim() && missingName < 0) missingName = i;
        if (p.tipo === "nino" && !p.edad && missingAge < 0) missingAge = i;
      });
      if (missingName >= 0) {
        setError("personas", ui("err_person")); ok = false;
        var inp = $("#p-" + missingName); if (inp) { inp.setAttribute("aria-invalid", "true"); first = first || inp; }
      } else if (missingAge >= 0) {
        setError("personas", ui("err_age")); ok = false;
        var asel = $("#a-" + missingAge); if (asel) { asel.setAttribute("aria-invalid", "true"); first = first || asel; }
      } else clearError("personas");
    }
    if (first) first.focus({ preventScroll: false });
    return ok;
  }

  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  function payload() {
    var a = selected("asiste") === "si";
    var party = goesToParty();
    return {
      id: uid(),
      enviado: new Date().toISOString(),
      idioma: lang,
      responsable: $("#f-nombre").value.trim(),
      telefono: $("#f-tel").value.trim(),
      asiste: a ? "si" : "no",
      misa: a && event() !== "fiesta",
      fiesta: party,
      adultos: a ? rsvp.adults : 0,
      ninos: a ? rsvp.kids : 0,
      personas: a ? rsvp.people.map(function (p) {
        return { nombre: p.nombre.trim(), tipo: p.tipo === "adulto" ? "Adulto" : "Niño", edad: p.tipo === "nino" ? edadEs(p.edad) : "" };
      }) : []
    };
  }
  function edadEs(v) {
    if (v === "" || v == null) return "";
    var n = parseInt(v, 10);
    return n === 0 ? "Menos de 1 año" : n + (n === 1 ? " año" : " años");
  }

  function send(data) {
    var body = JSON.stringify(data);
    if (!CFG.endpoint) return new Promise(function (res) { setTimeout(function () { res({ ok: true, test: true }); }, 700); });
    return fetch(CFG.endpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: body, redirect: "follow" })
      .then(function (r) { return r.json(); })
      .catch(function () {
        // alguns navegadores bloqueiam a leitura da resposta do Google; o envio em si funciona
        return fetch(CFG.endpoint, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: body })
          .then(function () { return { ok: true, opaque: true }; })
          .catch(function () { return { ok: false }; });
      });
  }

  function refreshThanks() {
    if (!rsvp.last || $("#thanks").hidden) return;
    var d = rsvp.last;
    var first = d.responsable.split(/\s+/)[0];
    $("#thanks-big").textContent = ui("thanks_big");
    if (d.asiste === "si") {
      var total = d.adultos + d.ninos;
      var summary = total + " " + (total === 1 ? ui("person") : ui("people")) + ", " + ui("ev_" + (d.misa && d.fiesta ? "ambos" : d.misa ? "misa" : "fiesta"));
      $("#thanks-text").textContent = fmt(ui("thanks_yes"), { name: first, summary: summary });
    } else {
      $("#thanks-text").textContent = fmt(ui("thanks_no"), { name: first });
    }
  }

  if (form) {
    var whenYes = $(".when-yes", form);
    var deadline = CFG.plazo ? new Date(CFG.plazo) : null;
    if (CFG.cerrarDespuesDelPlazo && deadline && Date.now() > deadline.getTime()) {
      form.hidden = true;
      var closed = document.createElement("p");
      closed.className = "statement form-closed";
      closed.style.gridColumn = "7 / 12";
      closed.textContent = ui("closed");
      form.parentNode.insertBefore(closed, form);
    }

    $$('input[name="asiste"]', form).forEach(function (r) {
      r.addEventListener("change", function () {
        whenYes.hidden = !attending();
        clearError("asiste");
        if (attending()) { syncPeople(); rsvp.animateNext = true; rsvp.animateFrom = 0; renderPeople(); }
        updateTally();
      });
    });
    $$('input[name="evento"]', form).forEach(function (r) {
      r.addEventListener("change", function () {
        $$(".person", form).forEach(function (li) { li.dataset.party = String(goesToParty()); });
        clearError("personas");
        updateTally();
      });
    });
    $("#f-nombre").addEventListener("input", function () {
      clearError("nombre");
      this.removeAttribute("aria-invalid");
      if (!rsvp.nameTouched && rsvp.people[0]) {
        rsvp.people[0].nombre = this.value.trim();
        var p0 = $("#p-0"); if (p0) p0.value = this.value.trim();
      }
    });
    $$(".stepper", form).forEach(function (st) {
      $$(".stepper__btn", st).forEach(function (btn) {
        btn.addEventListener("click", function () {
          var d = parseInt(btn.dataset.step, 10);
          var before = rsvp.people.length;
          if (st.dataset.kind === "adulto") rsvp.adults = Math.min(MAX, Math.max(1, rsvp.adults + d));
          else rsvp.kids = Math.min(MAX, Math.max(0, rsvp.kids + d));
          syncPeople();
          rsvp.animateNext = d > 0;
          // anima só a pessoa recém-incluída
          rsvp.animateFrom = st.dataset.kind === "adulto" ? rsvp.adults - 1 : before;
          renderPeople();
          updateSteppers();
          updateTally();
          clearError("personas");
        });
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = $("#form-status"), btn = $("#submit-btn");
      status.classList.remove("is-error");
      status.textContent = "";
      if (!validate()) return;
      var data = payload();
      btn.disabled = true;
      status.textContent = ui("sending");
      send(data).then(function (res) {
        btn.disabled = false;
        if (!res || res.ok === false) {
          status.classList.add("is-error");
          status.textContent = ui("err_send");
          return;
        }
        status.textContent = "";
        rsvp.last = data;
        form.hidden = true;
        var th = $("#thanks");
        th.hidden = false;
        refreshThanks();
        if (res.test) {
          var note = document.createElement("span");
          note.className = "thanks__test";
          note.textContent = ui("test_mode");
          $("#thanks-text").appendChild(note);
        }
        th.focus();
      });
    });

    $("#thanks-again").addEventListener("click", function () {
      $("#thanks").hidden = true;
      form.hidden = false;
      form.reset();
      rsvp.adults = 1; rsvp.kids = 0; rsvp.people = []; rsvp.nameTouched = false; rsvp.last = null;
      whenYes.hidden = true;
      syncPeople(); renderPeople(); updateSteppers(); updateTally();
      $("#f-nombre").focus();
    });

    syncPeople();
    updateSteppers();
    rsvp.ready = true;
  }

  setLang(initialLang());
})();
