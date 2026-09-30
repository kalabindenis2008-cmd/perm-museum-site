/* Основная логика сайта «Музеи Перми»:
   навигация, анимации появления, счётчики, каталог с фильтром и поиском,
   страница отдельного музея. Викторина — в quiz.js. */

(function () {
  "use strict";

  /* ---------- Утилиты ---------- */

  var esc = function (value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  var supportsIO = "IntersectionObserver" in window;

  /* Запустить колбэк один раз, когда элемент попадёт в область видимости. */
  function observeOnce(el, cb) {
    if (!el) return;
    if (!supportsIO) {
      cb(el);
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            cb(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
  }

  /* ---------- Навигация ---------- */

  function initNav() {
    var navbar = document.getElementById("navbar");
    var burger = document.getElementById("navBurger");
    var links = document.getElementById("navLinks");
    var progress = document.getElementById("scrollProgress");

    function onScroll() {
      var y = window.scrollY || document.documentElement.scrollTop;
      if (navbar) navbar.classList.toggle("scrolled", y > 8);
      if (progress) {
        var doc = document.documentElement;
        var max = doc.scrollHeight - doc.clientHeight;
        var pct = max > 0 ? (y / max) * 100 : 0;
        progress.style.width = pct + "%";
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (burger && links) {
      burger.addEventListener("click", function () {
        var open = links.classList.toggle("open");
        burger.classList.toggle("open", open);
        burger.setAttribute("aria-expanded", open ? "true" : "false");
      });

      links.addEventListener("click", function (event) {
        if (event.target.tagName === "A" && links.classList.contains("open")) {
          links.classList.remove("open");
          burger.classList.remove("open");
          burger.setAttribute("aria-expanded", "false");
        }
      });
    }
  }

  /* ---------- Анимации появления ---------- */

  var REVEAL_SELECTOR =
    ".reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-grid";

  function initReveal(root) {
    var scope = root || document;
    var nodes = [];

    /* Учитываем и сам элемент, если он совпадает с селектором. */
    if (scope.nodeType === 1 && scope.matches && scope.matches(REVEAL_SELECTOR)) {
      nodes.push(scope);
    }
    nodes = nodes.concat(
      Array.prototype.slice.call(scope.querySelectorAll(REVEAL_SELECTOR))
    );

    nodes.forEach(function (el) {
      if (el.classList.contains("visible")) return;
      observeOnce(el, function (node) {
        node.classList.add("visible");
      });
    });
  }

  /* ---------- Анимированные счётчики ---------- */

  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (isNaN(target)) return;
    var duration = 1200;
    var start = null;

    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString("ru-RU");
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function initCounters() {
    var nodes = document.querySelectorAll(".stat-num[data-count]");
    Array.prototype.forEach.call(nodes, function (el) {
      observeOnce(el, animateCount);
    });
  }

  /* ---------- Карточка музея ---------- */

  var PIN_SVG =
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';

  function cardHTML(m) {
    return (
      '<a class="museum-card" href="museum.html?id=' +
      encodeURIComponent(m.slug) +
      '">' +
      '<div class="cover" data-category="' +
      esc(m.category) +
      '">' +
      '<span class="cover-symbol" aria-hidden="true">' +
      esc(m.symbol) +
      "</span>" +
      '<span class="museum-card-tag">' +
      esc(categoryLabel(m.category)) +
      "</span>" +
      "</div>" +
      '<div class="museum-body">' +
      "<h3>" +
      esc(m.short) +
      "</h3>" +
      '<p class="museum-tagline">' +
      esc(m.tagline) +
      "</p>" +
      '<div class="museum-meta">' +
      PIN_SVG +
      "<span>" +
      esc(m.address) +
      "</span>" +
      "</div>" +
      '<span class="museum-link">Подробнее <span class="arrow">→</span></span>' +
      "</div>" +
      "</a>"
    );
  }

  /* ---------- Главная: подборка музеев ---------- */

  function initFeatured() {
    var grid = document.getElementById("featuredGrid");
    if (!grid) return;
    var featured = MUSEUMS.filter(function (m) {
      return m.featured;
    });
    grid.innerHTML = featured.map(cardHTML).join("");
  }

  /* ---------- Каталог ---------- */

  function initCatalog() {
    var grid = document.getElementById("catalogGrid");
    if (!grid) return;

    var filterBar = document.getElementById("filterBar");
    var searchInput = document.getElementById("searchInput");
    var countEl = document.getElementById("catalogCount");
    var emptyEl = document.getElementById("emptyState");

    var state = { category: "all", query: "" };

    /* Кнопки фильтра по категориям. */
    if (filterBar) {
      var buttons = ['<button class="filter-btn active" type="button" data-cat="all">Все музеи</button>'];
      CATEGORY_ORDER.forEach(function (key) {
        if (CATEGORIES[key]) {
          buttons.push(
            '<button class="filter-btn" type="button" data-cat="' +
              esc(key) +
              '">' +
              esc(CATEGORIES[key]) +
              "</button>"
          );
        }
      });
      filterBar.innerHTML = buttons.join("");
      filterBar.addEventListener("click", function (event) {
        var btn = event.target.closest(".filter-btn");
        if (!btn) return;
        state.category = btn.getAttribute("data-cat");
        Array.prototype.forEach.call(filterBar.querySelectorAll(".filter-btn"), function (b) {
          b.classList.toggle("active", b === btn);
        });
        render();
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", function () {
        state.query = searchInput.value.trim().toLowerCase();
        render();
      });
    }

    function matches(m) {
      if (state.category !== "all" && m.category !== state.category) return false;
      if (!state.query) return true;
      var haystack = [m.name, m.short, m.type, m.tagline, m.address]
        .concat(m.description || [])
        .join(" ")
        .toLowerCase();
      return haystack.indexOf(state.query) !== -1;
    }

    function render() {
      var list = MUSEUMS.filter(matches);
      grid.innerHTML = list.map(cardHTML).join("");
      grid.classList.remove("visible");

      if (emptyEl) emptyEl.hidden = list.length !== 0;

      if (countEl) {
        if (list.length === MUSEUMS.length) {
          countEl.textContent = "Всего музеев: " + MUSEUMS.length;
        } else {
          countEl.textContent =
            "Найдено музеев: " + list.length + " из " + MUSEUMS.length;
        }
      }

      initReveal(grid);
    }

    render();
  }

  /* ---------- Страница музея ---------- */

  function museumHeroHTML(m) {
    return (
      '<div class="museum-hero" data-category="' +
      esc(m.category) +
      '">' +
      '<span class="cover-symbol" aria-hidden="true">' +
      esc(m.symbol) +
      "</span>" +
      '<div class="container">' +
      '<span class="museum-type-badge">' +
      esc(m.type) +
      "</span>" +
      "<h1>" +
      esc(m.name) +
      "</h1>" +
      '<p class="museum-hero-tagline">' +
      esc(m.tagline) +
      "</p>" +
      "</div>" +
      "</div>"
    );
  }

  function infoRowsHTML(m) {
    var rows = [
      ["Тип", m.type],
      ["Категория", categoryLabel(m.category)],
    ];
    if (m.founded) rows.push(["Основан", m.founded + " год"]);
    rows.push(["Адрес", m.address]);

    return rows
      .map(function (row) {
        return (
          '<div class="info-row"><span class="info-label">' +
          esc(row[0]) +
          '</span><span class="info-value">' +
          esc(row[1]) +
          "</span></div>"
        );
      })
      .join("");
  }

  function museumBodyHTML(m, others) {
    var paragraphs = (m.description || [])
      .map(function (p) {
        return "<p>" + esc(p) + "</p>";
      })
      .join("");

    var highlights = (m.highlights || [])
      .map(function (h) {
        return "<li>" + esc(h) + "</li>";
      })
      .join("");

    var facts = (m.facts || [])
      .map(function (f) {
        return '<div class="fact-pill"><span aria-hidden="true">💡</span><p>' + esc(f) + "</p></div>";
      })
      .join("");

    var mapQuery = encodeURIComponent(m.address + ", Пермь");
    var mapUrl = "https://yandex.ru/maps/?text=" + mapQuery;

    var related = others
      .map(function (o) {
        return cardHTML(o);
      })
      .join("");

    return (
      museumHeroHTML(m) +
      '<div class="museum-layout">' +
      '<div class="museum-content">' +
      "<h2>О музее</h2>" +
      paragraphs +
      "<h2>Что посмотреть</h2>" +
      '<ul class="highlight-list">' +
      highlights +
      "</ul>" +
      "<h2>Интересные факты</h2>" +
      facts +
      "</div>" +
      "<aside>" +
      '<div class="side-card">' +
      "<h3>Информация</h3>" +
      infoRowsHTML(m) +
      '<a class="btn btn-primary btn-block" href="' +
      esc(m.site) +
      '" target="_blank" rel="noopener noreferrer">Официальный сайт</a>' +
      '<a class="btn btn-outline btn-block" href="' +
      mapUrl +
      '" target="_blank" rel="noopener noreferrer">Показать на карте</a>' +
      '<a class="btn btn-outline btn-block" href="museums.html">← В каталог</a>' +
      "</div>" +
      "</aside>" +
      "</div>" +
      '<section style="margin-top:64px">' +
      '<div class="section-head left"><span class="section-tag">Смотрите также</span><h2>Другие музеи</h2></div>' +
      '<div class="grid grid-3 stagger-grid">' +
      related +
      "</div>" +
      "</section>"
    );
  }

  function initMuseumPage() {
    var root = document.getElementById("museumRoot");
    if (!root) return;

    var params = new URLSearchParams(window.location.search);
    var slug = params.get("id");
    var museum = slug ? getMuseum(slug) : null;

    var crumb = document.getElementById("crumbCurrent");

    if (!museum) {
      if (crumb) crumb.textContent = "Музей не найден";
      root.innerHTML =
        '<div class="empty-state">' +
        '<div class="empty-icon" aria-hidden="true">🏛</div>' +
        "<p>Такой музей не найден в каталоге.</p>" +
        '<div class="center-btn"><a href="museums.html" class="btn btn-primary">Вернуться в каталог</a></div>' +
        "</div>";
      return;
    }

    document.title = museum.name + " — Музеи Перми";
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", museum.tagline + ". " + museum.address + ".");
    if (crumb) crumb.textContent = museum.short;

    /* Похожие музеи: сначала той же категории, затем остальные. */
    var same = MUSEUMS.filter(function (m) {
      return m.slug !== museum.slug && m.category === museum.category;
    });
    var rest = MUSEUMS.filter(function (m) {
      return m.slug !== museum.slug && m.category !== museum.category;
    });
    var others = same.concat(rest).slice(0, 3);

    root.innerHTML = museumBodyHTML(museum, others);
  }

  /* ---------- Страница «О проекте» ---------- */

  function initAbout() {
    var el = document.getElementById("aboutMuseumsCount");
    if (el) el.textContent = MUSEUMS.length;
  }

  /* ---------- Счётчик музеев в hero ---------- */

  function initHeroStat() {
    var el = document.getElementById("statMuseums");
    if (el) el.setAttribute("data-count", MUSEUMS.length);
  }

  /* ---------- Запуск ---------- */

  function init() {
    initNav();
    initHeroStat();
    initFeatured();
    initCatalog();
    initMuseumPage();
    initAbout();
    initCounters();
    initReveal(document);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
