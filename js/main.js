/* Army’s Wears – shared site logic: navigation, marquee, catalogue, events, booking */
(function () {
  "use strict";

  /* ---------- Shared data ---------- */
  const PAGES = [
    ["index.html", "Home"], ["collection.html", "Collection"], ["about.html", "About & Trustees"],
    ["events.html", "Events"], ["contact.html", "Enquiry & Booking"]
  ];
  const SALES = [
    "Season Sale: up to 30% off selected jackets and trousers",
    "Complimentary alterations on every suit purchased this month",
    "Book a fitting: your first consultation is free",
    "Group and uniform orders: request a quote today"
  ];
  const PRODUCTS = [
    { id: 1, name: "Heritage Wool Blazer", cat: "Jackets", price: 95000, was: 120000 },
    { id: 2, name: "Classic Two-Piece Suit", cat: "Suits", price: 150000 },
    { id: 3, name: "Oxford Dress Shirt", cat: "Shirts", price: 28000 },
    { id: 4, name: "Field Chino Trousers", cat: "Trousers", price: 32000, was: 40000 },
    { id: 5, name: "Regimental Silk Tie", cat: "Accessories", price: 12000 },
    { id: 6, name: "Leather Derby Shoes", cat: "Footwear", price: 68000 },
    { id: 7, name: "Officer’s Trench Coat", cat: "Jackets", price: 135000, was: 165000 },
    { id: 8, name: "Pressed Wool Trousers", cat: "Trousers", price: 45000 }
  ];
  const EVENTS = [
    { date: "2026-12-05T10:00", title: "Winter Collection Preview", place: "Main showroom", desc: "An early look at the new season’s jackets, coats and knitwear, with tailors on hand for fittings." },
    { date: "2026-12-19T11:00", title: "End-of-Year Sale Weekend", place: "Main showroom", desc: "Our largest sale of the year across suits, shirts and accessories." },
    { date: "2027-01-16T10:00", title: "Bespoke Tailoring Masterclass", place: "Atelier", desc: "Learn how a made-to-measure suit is cut, fitted and finished." },
    { date: "2027-02-13T17:00", title: "Styling Evening", place: "Main showroom", desc: "Personal styling sessions for work, ceremonies and everyday wear." },
    { date: "2027-03-06T10:00", title: "Corporate & Uniform Wear Expo", place: "Conference hall", desc: "Fabric samples and group pricing for organisations and institutions." }
  ];
  const TRUSTEES = [
    ["Chairman of the Board", "Miss Victoria Daniel"], ["Vice Chairman", "Dr. Eleanor C. Whitmore"], ["Trustee, Finance", "Mrs Chioma Bennett"],
    ["Trustee, Operations", "Mr Kingsley Eze"], ["Trustee, Community", "Miss Olive Anderson"]
  ];

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const TPOS = ["55% 30%", "50% 28%", "72% 30%", "40% 25%", "45% 30%"];
  const naira = n => "₦" + n.toLocaleString("en-NG");
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };

  /* ---------- Shared layout (identical on every page) ---------- */
  function renderLayout() {
    const here = location.pathname.split("/").pop() || "index.html";
    const links = PAGES.map(([href, label]) =>
      `<a href="${href}"${href === here ? ' aria-current="page"' : ""}>${label}</a>`).join("");
    const items = SALES.map(s => `<span>${esc(s)}</span>`).join("");
    $("#site-header").outerHTML =
      `<div class="marquee" role="region" aria-label="Current offers"><div class="marquee-track">${items}${items}</div></div>
       <header class="site-header"><div class="wrap bar">
         <a class="brand" href="index.html">Army’s Wears<small>Tailoring &amp; Outfitters</small></a>
         <button class="menu-btn" aria-expanded="false" aria-controls="nav">Menu</button>
         <nav class="nav" id="nav" aria-label="Main">${links}</nav></div></header>`;
    $("#site-footer").outerHTML =
      `<footer class="site-footer"><div class="wrap"><div class="foot">
         <div><h3>Army’s Wears</h3><p>Classic tailoring and quality outfitting, built on discipline and fine finishing.</p></div>
         <div><h3>Explore</h3>${links.replace(' aria-current="page"', "")}</div>
         <div><h3>Visit us</h3><p>Showroom address line<br>Port Harcourt, Rivers State<br>Mon–Sat, 9:00–17:00<br>Phone: +234 000 000 0000</p></div>
       </div><p class="copy">© ${new Date().getFullYear()} Army’s Wears. All rights reserved.</p></div></footer>`;
    const btn = $(".menu-btn"), nav = $("#nav");
    btn.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open);
    });
  }

  /* ---------- Products ---------- */
  function card(p) {
    return `<article class="product"><div class="ph"><img src="images/product-${p.id}.jpg" alt="${esc(p.name)}" loading="lazy">
      ${p.was ? '<span class="badge">Sale</span>' : ""}</div>
      <div class="info"><span class="cat">${p.cat}</span><h3>${esc(p.name)}</h3>
      <div><span class="price">${naira(p.price)}</span>${p.was ? `<span class="was">${naira(p.was)}</span>` : ""}</div>
      <a class="btn ghost sm" href="contact.html?product=${encodeURIComponent(p.name)}#enquiry">Enquire</a></div></article>`;
  }
  function initProducts() {
    const host = $("[data-products]");
    if (!host) return;
    const limit = +host.dataset.limit || 0;
    if (limit) { host.innerHTML = PRODUCTS.slice(0, limit).map(card).join(""); return; }
    const chipsHost = $("#chips"), q = $("#q"), sort = $("#sort"), count = $("#count");
    const cats = ["All"].concat([...new Set(PRODUCTS.map(p => p.cat))]);
    let active = "All";
    chipsHost.innerHTML = cats.map(c => `<button class="chip" aria-pressed="${c === active}" data-c="${c}">${c}</button>`).join("");
    function draw() {
      const term = q.value.trim().toLowerCase();
      let list = PRODUCTS.filter(p => (active === "All" || p.cat === active) && p.name.toLowerCase().includes(term));
      if (sort.value === "low") list.sort((a, b) => a.price - b.price);
      if (sort.value === "high") list.sort((a, b) => b.price - a.price);
      if (sort.value === "sale") list.sort((a, b) => !!b.was - !!a.was);
      count.textContent = `${list.length} item${list.length === 1 ? "" : "s"} shown`;
      host.innerHTML = list.length ? list.map(card).join("") : "<p>No products match your search. Try another term or category.</p>";
    }
    chipsHost.addEventListener("click", e => {
      const b = e.target.closest(".chip"); if (!b) return;
      active = b.dataset.c; $$(".chip", chipsHost).forEach(c => c.setAttribute("aria-pressed", c === b)); draw();
    });
    q.addEventListener("input", draw); sort.addEventListener("change", draw); draw();
  }

  /* ---------- Trustees ---------- */
  function initTrustees() {
    const host = $("[data-trustees]"); if (!host) return;
    host.innerHTML = TRUSTEES.map(([role, name], i) =>
      `<div class="trustee"><div class="ph"><img src="images/trustee-${i + 1}.jpg" alt="Portrait of ${name}" style="object-position:${TPOS[i]}"></div><h3>${name}</h3><p>${role}</p></div>`).join("");
  }

  /* ---------- Events + live countdown ---------- */
  function initEvents() {
    const host = $("[data-events]"); if (!host) return;
    const up = EVENTS.map(e => ({ ...e, t: new Date(e.date) })).filter(e => e.t > new Date()).sort((a, b) => a.t - b.t);
    if (!up.length) { host.innerHTML = "<p>No upcoming events right now. Please check back soon.</p>"; return; }
    host.innerHTML = up.map(e => `<article class="event">
      <div class="date">${e.t.toLocaleString("en-GB", { month: "short" })}<b>${e.t.getDate()}</b>${e.t.getFullYear()}</div>
      <div><div class="meta">${e.t.toLocaleString("en-GB", { weekday: "long", hour: "2-digit", minute: "2-digit" })} · ${esc(e.place)}</div>
      <h3>${esc(e.title)}</h3><p>${esc(e.desc)}</p></div>
      <a class="btn ghost sm" href="contact.html#booking">Reserve a place</a></article>`).join("");
    const cd = $("#countdown"); if (!cd) return;
    $("#next-title").textContent = up[0].title;
    const parts = { d: $("#cd-d"), h: $("#cd-h"), m: $("#cd-m"), s: $("#cd-s") };
    (function tick() {
      let ms = Math.max(0, up[0].t - new Date()), pad = n => String(n).padStart(2, "0");
      parts.d.textContent = Math.floor(ms / 864e5); parts.h.textContent = pad(Math.floor(ms / 36e5) % 24);
      parts.m.textContent = pad(Math.floor(ms / 6e4) % 60); parts.s.textContent = pad(Math.floor(ms / 1e3) % 60);
      setTimeout(tick, 1000);
    })();
  }

  /* ---------- Enquiry + appointment booking ---------- */
  function setErr(field, msg) {
    const wrap = field.closest(".f"); wrap.classList.toggle("bad", !!msg);
    $(".err", wrap).textContent = msg || ""; return !msg;
  }
  const rules = {
    name: v => v.trim().length >= 2 || "Please enter your full name.",
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || "Enter a valid email address.",
    phone: v => /^\+?[\d\s-]{8,16}$/.test(v) || "Enter a valid phone number.",
    message: v => v.trim().length >= 10 || "Please write at least 10 characters.",
    service: v => !!v || "Choose a service.",
    date: v => {
      if (!v) return "Pick a date.";
      const d = new Date(v + "T00:00"), today = new Date(); today.setHours(0, 0, 0, 0);
      if (d <= today) return "Choose a date from tomorrow onwards.";
      if (d.getDay() === 0) return "We are closed on Sundays.";
      return true;
    }
  };
  function validate(form) {
    let ok = true;
    $$("[data-rule]", form).forEach(el => {
      const r = rules[el.dataset.rule](el.value);
      if (!setErr(el, r === true ? "" : r)) ok = false;
    });
    return ok;
  }
  function initContact() {
    const tabs = $$(".tab"); if (!tabs.length) return;
    function show(id) {
      tabs.forEach(t => t.setAttribute("aria-selected", t.dataset.tab === id));
      $$(".panel").forEach(p => p.hidden = p.id !== id);
      if (location.hash !== "#" + id) history.replaceState(null, "", "#" + id);
    }
    tabs.forEach(t => t.addEventListener("click", () => show(t.dataset.tab)));
    show(location.hash === "#booking" ? "booking" : "enquiry");
    window.addEventListener("hashchange", () => show(location.hash === "#booking" ? "booking" : "enquiry"));

    const product = new URLSearchParams(location.search).get("product");
    const eqForm = $("#enquiry form");
    if (product) $("[name=message]", eqForm).value = `I would like to enquire about the ${product}. Please share availability and sizing.`;

    eqForm.addEventListener("submit", e => {
      e.preventDefault(); if (!validate(eqForm)) return;
      const ref = "EQ-" + Date.now().toString(36).toUpperCase().slice(-6);
      const all = store.get("aw_enquiries", []); all.push({ ref, at: new Date().toISOString(), name: eqForm.name.value }); store.set("aw_enquiries", all);
      $("#enquiry-done").innerHTML = `<div class="notice" role="status"><h3>Enquiry received</h3><p>Thank you, ${esc(eqForm.name.value)}. Your reference is <strong>${ref}</strong>. We will reply within one business day.</p></div>`;
      eqForm.reset();
    });

    /* booking with live slot availability */
    const bk = $("#booking form"), dateEl = $("[name=date]", bk), slotsEl = $("#slots"), slotErr = $("#slot-err");
    let chosen = "";
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    dateEl.min = tomorrow.toISOString().slice(0, 10);
    function drawSlots() {
      chosen = ""; slotErr.textContent = "";
      const v = dateEl.value; if (rules.date(v) !== true) { slotsEl.innerHTML = '<span class="hint">Select a valid date to see available times.</span>'; return; }
      const day = new Date(v + "T00:00").getDay(), last = day === 6 ? 13 : 16;
      const taken = store.get("aw_bookings", []).filter(b => b.date === v).map(b => b.time);
      let html = ""; for (let h = 9; h <= last; h++) {
        const t = String(h).padStart(2, "0") + ":00";
        html += `<button type="button" class="slot" aria-pressed="false" data-t="${t}" ${taken.includes(t) ? "disabled" : ""}>${t}</button>`;
      }
      slotsEl.innerHTML = html;
    }
    dateEl.addEventListener("change", () => { setErr(dateEl, rules.date(dateEl.value) === true ? "" : rules.date(dateEl.value)); drawSlots(); });
    slotsEl.addEventListener("click", e => {
      const b = e.target.closest(".slot"); if (!b || b.disabled) return;
      chosen = b.dataset.t; slotErr.textContent = "";
      $$(".slot", slotsEl).forEach(s => s.setAttribute("aria-pressed", s === b));
    });
    drawSlots();
    bk.addEventListener("submit", e => {
      e.preventDefault();
      const ok = validate(bk);
      if (!chosen) { slotErr.textContent = "Select a time slot."; }
      if (!ok || !chosen) return;
      const ref = "AW-" + Date.now().toString(36).toUpperCase().slice(-6);
      const all = store.get("aw_bookings", []); all.push({ ref, date: dateEl.value, time: chosen, name: bk.name.value, service: bk.service.value }); store.set("aw_bookings", all);
      const pretty = new Date(dateEl.value + "T00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      $("#booking-done").innerHTML = `<div class="notice" role="status"><h3>Appointment confirmed</h3><p><strong>${esc(bk.service.value)}</strong><br>${pretty} at ${chosen}<br>Reference: <strong>${ref}</strong></p><p class="hint">Please arrive 10 minutes early and quote your reference.</p></div>`;
      bk.reset(); drawSlots();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderLayout(); initProducts(); initTrustees(); initEvents(); initContact();
  });
})();
