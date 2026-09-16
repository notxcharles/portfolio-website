// Site-wide config and behavior.
const CV_URL = "https://drive.google.com/file/d/1Thsviw3e6w6WsHcxqbC3s5vEciWX87Up/view?usp=sharing";

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-cv-link]").forEach((el) => {
    el.href = CV_URL;
  });
});

// Mobile nav dropdown toggle.
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("navMenu");
  if (!toggle || !menu) return;

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
});

// Lightbox for project screenshot galleries (.media-grid / .media-item__trigger).
document.addEventListener("DOMContentLoaded", () => {
  const lightbox = document.getElementById("lightbox");
  const triggers = Array.from(document.querySelectorAll(".media-item__trigger"));
  if (!lightbox || !triggers.length) return;

  const image = lightbox.querySelector(".lightbox__image");
  const caption = lightbox.querySelector(".lightbox__caption");
  const closeBtn = lightbox.querySelector(".lightbox__close");
  const prevBtn = lightbox.querySelector(".lightbox__nav--prev");
  const nextBtn = lightbox.querySelector(".lightbox__nav--next");

  let currentIndex = 0;
  let lastFocused = null;

  function show(index) {
    currentIndex = (index + triggers.length) % triggers.length;
    const trigger = triggers[currentIndex];
    const img = trigger.querySelector("img");
    const figcaption = trigger.closest("figure")?.querySelector("figcaption");

    image.src = img.src;
    image.alt = img.alt;
    caption.textContent = figcaption ? figcaption.textContent : img.alt;
  }

  function open(index) {
    lastFocused = document.activeElement;
    show(index);
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function close() {
    lightbox.hidden = true;
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  }

  triggers.forEach((trigger, index) => {
    trigger.addEventListener("click", () => open(index));
  });

  closeBtn.addEventListener("click", close);
  prevBtn.addEventListener("click", () => show(currentIndex - 1));
  nextBtn.addEventListener("click", () => show(currentIndex + 1));

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) close();
  });

  document.addEventListener("keydown", (event) => {
    if (lightbox.hidden) return;
    if (event.key === "Escape") close();
    if (event.key === "ArrowLeft") show(currentIndex - 1);
    if (event.key === "ArrowRight") show(currentIndex + 1);
  });
});

// Tag filtering on the all-projects page (projects.html).
// Chips are built from the tags already present on the cards, so adding a
// project to the grid is enough - no separate list to keep in sync.
document.addEventListener("DOMContentLoaded", () => {
  const filters = document.getElementById("projectFilters");
  const grid = document.getElementById("projectGrid");
  if (!filters || !grid) return;

  const status = document.getElementById("filterStatus");
  const emptyMessage = document.getElementById("projectsEmpty");
  const clearBtn = document.getElementById("filterClear");
  const cards = Array.from(grid.querySelectorAll(".project-card"));
  const selected = new Set();

  function tagsOf(card, kind) {
    return Array.from(card.querySelectorAll(`.tag-list--${kind} li`)).map((li) =>
      li.textContent.trim()
    );
  }

  const cardTags = new Map(
    cards.map((card) => [card, new Set([...tagsOf(card, "topic"), ...tagsOf(card, "tech")])])
  );

  function buildChips(kind, container) {
    const counts = new Map();
    cards.forEach((card) => {
      tagsOf(card, kind).forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
    });

    Array.from(counts.keys())
      .sort((a, b) => a.localeCompare(b))
      .forEach((tag) => {
        const item = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "filter-chip";
        button.dataset.tag = tag;
        button.setAttribute("aria-pressed", "false");

        const label = document.createElement("span");
        label.textContent = tag;
        const count = document.createElement("span");
        count.className = "filter-chip__count";
        count.textContent = counts.get(tag);

        button.append(label, count);
        button.addEventListener("click", () => toggle(tag));
        item.appendChild(button);
        container.appendChild(item);
      });
  }

  function toggle(tag) {
    if (selected.has(tag)) {
      selected.delete(tag);
    } else {
      selected.add(tag);
    }
    apply();
  }

  function syncUrl() {
    const url = new URL(window.location.href);
    if (selected.size) {
      url.searchParams.set("tags", Array.from(selected).join(","));
    } else {
      url.searchParams.delete("tags");
    }
    window.history.replaceState({}, "", url);
  }

  function apply() {
    let visible = 0;
    cards.forEach((card) => {
      const tags = cardTags.get(card);
      // A project matches if it carries any one of the selected tags.
      const match = !selected.size || Array.from(selected).some((tag) => tags.has(tag));
      card.hidden = !match;
      if (match) visible += 1;
    });

    filters.querySelectorAll(".filter-chip").forEach((chip) => {
      chip.setAttribute("aria-pressed", String(selected.has(chip.dataset.tag)));
    });

    if (emptyMessage) emptyMessage.hidden = visible > 0;
    if (clearBtn) clearBtn.hidden = selected.size === 0;
    if (status) {
      status.textContent = selected.size
        ? `Showing ${visible} of ${cards.length} projects matching any of: ${Array.from(selected).join(", ")}`
        : `Showing all ${cards.length} projects`;
    }

    syncUrl();
  }

  buildChips("topic", document.getElementById("topicFilters"));
  buildChips("tech", document.getElementById("techFilters"));

  // Pre-select tags from the URL so a filtered view can be linked to directly.
  const known = new Set(
    Array.from(filters.querySelectorAll(".filter-chip")).map((chip) => chip.dataset.tag)
  );
  const requested = new URLSearchParams(window.location.search).get("tags");
  if (requested) {
    requested
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => known.has(tag))
      .forEach((tag) => selected.add(tag));
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      selected.clear();
      apply();
    });
  }

  apply();
});
