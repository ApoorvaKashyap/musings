(function () {
  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(function () {
    const root = document.querySelector(".notes-calendar");
    const dataEl = document.getElementById("notes-calendar-data");
    if (!root || !dataEl) return;

    let notes = [];
    try {
      notes = JSON.parse(dataEl.textContent || "[]");
    } catch (error) {
      notes = [];
    }

    const byDate = new Map();
    const today = new Date();
    const view = { year: today.getFullYear(), month: today.getMonth() };
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const grid = root.querySelector(".notes-calendar-grid");
    const label = root.querySelector(".notes-calendar-label");
    const detail = root.querySelector(".notes-calendar-detail");
    const chooser = root.querySelector(".notes-calendar-chooser");
    const monthSelect = root.querySelector(".notes-calendar-month");
    const yearSelect = root.querySelector(".notes-calendar-year");

    function pad(value) {
      return value < 10 ? "0" + value : String(value);
    }

    function key(year, month, day) {
      return year + "-" + pad(month + 1) + "-" + pad(day);
    }

    function addNote(date, note, type) {
      if (!date) return;
      if (!byDate.has(date)) byDate.set(date, { posted: [], due: [] });
      byDate.get(date)[type].push(note);
    }

    notes.forEach((note) => {
      addNote(note.date, note, "posted");
      addNote(note.due, note, "due");
    });

    function populateChooser() {
      monthSelect.innerHTML = months.map((month, index) => (
        '<option value="' + index + '">' + month + '</option>'
      )).join("");

      const years = new Set([today.getFullYear()]);
      notes.forEach((note) => {
        if (note.date) years.add(Number(note.date.slice(0, 4)));
        if (note.due) years.add(Number(note.due.slice(0, 4)));
      });
      const sortedYears = Array.from(years).filter(Boolean).sort((a, b) => a - b);
      const minYear = sortedYears[0] - 1;
      const maxYear = sortedYears[sortedYears.length - 1] + 1;
      const yearOptions = [];
      for (let year = minYear; year <= maxYear; year += 1) {
        yearOptions.push('<option value="' + year + '">' + year + '</option>');
      }
      yearSelect.innerHTML = yearOptions.join("");
    }

    function renderDetail(dateKey) {
      const entry = byDate.get(dateKey);
      if (!entry) {
        detail.hidden = true;
        detail.innerHTML = "";
        return;
      }

      const rows = []
        .concat(entry.posted.map((note) => ({ note, type: "posted" })))
        .concat(entry.due.map((note) => ({ note, type: "due" })));

      detail.innerHTML = [
        '<div class="notes-calendar-detail-date">' + dateKey + '</div>',
        '<ul>',
        rows.map((item) => (
          '<li><a href="' + item.note.url + '">' + item.note.title + '</a>' +
          '<span class="notes-calendar-chip is-' + item.type + '">' + item.type + '</span></li>'
        )).join(""),
        '</ul>'
      ].join("");
      detail.hidden = false;
    }

    function render() {
      label.textContent = months[view.month] + " " + view.year;
      monthSelect.value = String(view.month);
      yearSelect.value = String(view.year);
      const first = new Date(view.year, view.month, 1);
      const dayCount = new Date(view.year, view.month + 1, 0).getDate();
      const todayKey = key(today.getFullYear(), today.getMonth(), today.getDate());
      const cells = [];

      for (let i = 0; i < first.getDay(); i += 1) {
        cells.push('<span class="notes-calendar-cell is-empty"></span>');
      }

      for (let day = 1; day <= dayCount; day += 1) {
        const dateKey = key(view.year, view.month, day);
        const entry = byDate.get(dateKey);
        const count = entry ? entry.posted.length + entry.due.length : 0;
        const classes = [
          "notes-calendar-cell",
          dateKey === todayKey ? "is-today" : "",
          count ? "has-notes" : ""
        ].filter(Boolean).join(" ");
        const dots = entry
          ? '<span class="notes-calendar-dots">' +
            (entry.posted.length ? '<i class="is-posted"></i>' : '') +
            (entry.due.length ? '<i class="is-due"></i>' : '') +
            '</span>'
          : '<span class="notes-calendar-dots"></span>';

        cells.push(
          '<button type="button" class="' + classes + '" data-date="' + dateKey + '">' +
          '<span>' + day + '</span>' + dots + '</button>'
        );
      }

      grid.classList.remove("is-animating");
      void grid.offsetWidth;
      grid.innerHTML = cells.join("");
      grid.classList.add("is-animating");
      detail.hidden = true;
    }

    root.querySelector(".notes-calendar-prev").addEventListener("click", () => {
      view.month -= 1;
      if (view.month < 0) {
        view.month = 11;
        view.year -= 1;
      }
      render();
    });

    root.querySelector(".notes-calendar-next").addEventListener("click", () => {
      view.month += 1;
      if (view.month > 11) {
        view.month = 0;
        view.year += 1;
      }
      render();
    });

    label.addEventListener("click", () => {
      const willOpen = chooser.hidden;
      chooser.hidden = !willOpen;
      label.setAttribute("aria-expanded", String(willOpen));
    });

    monthSelect.addEventListener("change", () => {
      view.month = Number(monthSelect.value);
      render();
    });

    yearSelect.addEventListener("change", () => {
      view.year = Number(yearSelect.value);
      render();
    });

    document.addEventListener("click", (event) => {
      if (chooser.hidden || root.contains(event.target)) return;
      chooser.hidden = true;
      label.setAttribute("aria-expanded", "false");
    });

    grid.addEventListener("click", (event) => {
      const cell = event.target.closest(".has-notes");
      if (!cell) return;
      renderDetail(cell.dataset.date);
    });

    populateChooser();
    render();
  });
})();
