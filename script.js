//const allImages = document.getElementById("image-holder").children;
const allImages = document.querySelectorAll("#image-holder .pkg");
const leftButton = document.getElementById("left-button");
const rightButton = document.getElementById("right-button");
let currentImageIndex = 0;

leftButton.addEventListener("click", (e) => {
  e.preventDefault();
  // Hide current image
  allImages[currentImageIndex].classList.add("invisible");
  currentImageIndex--; // subtract 1 from currentImageIndex
  // If index is negative, loop around to maximum index
  if (currentImageIndex < 0) {
    currentImageIndex = allImages.length - 1;
  }
  // Display the new selected image
  allImages[currentImageIndex].classList.remove("invisible");
});

rightButton.addEventListener("click", (e) => {
  e.preventDefault();
  // Hide current image
  allImages[currentImageIndex].classList.add("invisible");
  // Add 1 to index
  currentImageIndex++;
  // If index exceeds maximum, set back to 0
  if (currentImageIndex >= allImages.length) {
    currentImageIndex = 0;
  }
  // Display newly selected image
  allImages[currentImageIndex].classList.remove("invisible");
});

const submitButton = document.getElementById("submit-button");
const commentsInput = document.getElementById("comments-input");
const commentsDisplay = document.getElementById("comments-display");

if (submitButton && commentsInput && commentsDisplay) {
  submitButton.addEventListener("click", (event) => {
    event.preventDefault();

    const commentsParagraph = document.createElement("p");
    commentsParagraph.innerText = commentsInput.value;
    commentsDisplay.appendChild(commentsParagraph);
    commentsInput.value = "";

    const deleteX = document.createElement("span");
    deleteX.innerText = " X";
    commentsParagraph.appendChild(deleteX);

    deleteX.addEventListener("click", () => {
      commentsParagraph.remove();
    });
  });
}

//hide email address from spam bots
// Simple email obfuscation + mailto link
(() => {
  const user = "arts5colleges";
  const domain = "gmail.com";

  const link = document.createElement("a");
  link.href = `mailto:${user}@${domain}`;
  link.textContent = "Email me";

  document.getElementById("email").appendChild(link);
})();

//document.getElementById("email").innerHTML =
//  '<a href="mailto:arts5colleges@gmail.com">arts5colleges@gmail.com</a>';

// ==========================
// EVENTS FROM package.json
// ==========================

fetch("events.json")
  .then((response) => {
    if (!response.ok) {
      throw new Error("Failed to load events.json");
    }
    return response.json();
  })
  .then((data) => {
    const container = document.getElementById("events-grid");
    container.innerHTML = "";

    /* ---------------------------------------------
         Helper: Parse JSON date as local date
      --------------------------------------------- */
    function parseLocalDate(dateStr) {
      const [year, month, day] = dateStr.split("-").map(Number);
      return new Date(year, month - 1, day); // month is 0-indexed
    }

    /* ---------------------------------------------
         Time conversion helper
      --------------------------------------------- */
    function militaryTo12Hour(time) {
      if (!time) return "";

      if (/a\.m\.|p\.m\./i.test(time)) {
        return time;
      }

      if (!time.includes(":")) {
        console.warn("Unrecognized time format:", time);
        return time;
      }

      const [hourStr, minuteStr] = time.split(":");
      let hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);

      if (isNaN(hour) || isNaN(minute)) {
        console.warn("Invalid time value:", time);
        return time;
      }

      const period = hour >= 12 ? "p.m." : "a.m.";
      hour = hour % 12;
      if (hour === 0) hour = 12;

      return minute === 0
        ? `${hour} ${period}`
        : `${hour}:${minute.toString().padStart(2, "0")} ${period}`;
    }

    /* ---------------------------------------------
         Group events by date
      --------------------------------------------- */
    const groupedEvents = data.events.reduce((acc, event) => {
      if (!event.date) return acc;
      acc[event.date] = acc[event.date] || [];
      acc[event.date].push(event);
      return acc;
    }, {});

    const sortedDates = Object.keys(groupedEvents).sort(
      (a, b) => parseLocalDate(a) - parseLocalDate(b)
    );
    /* ---------------------------------------------
   Build month navigation (desktop + mobile)
--------------------------------------------- */
    const nav = document.getElementById("month-nav");
    const dropdown = document.getElementById("month-dropdown");

    if (nav && dropdown) {
      nav.innerHTML = "";
      dropdown.innerHTML = "";

      const monthsAdded = new Set();

      sortedDates.forEach((date) => {
        const d = parseLocalDate(date);
        const monthKey = d.getFullYear() + "-" + d.getMonth();

        if (monthsAdded.has(monthKey)) return;
        monthsAdded.add(monthKey);

        const shortName = d.toLocaleDateString("en-US", { month: "short" });
        const longName = d.toLocaleDateString("en-US", { month: "long" });

        // Desktop nav
        const li = document.createElement("li");
        li.innerHTML = `<a href="#month-${monthKey}">${shortName}</a>`;
        nav.appendChild(li);

        // Mobile dropdown
        const option = document.createElement("option");
        option.value = `#month-${monthKey}`;
        option.textContent = longName;
        dropdown.appendChild(option);
      });

      /* ✅ THIS IS THE DROPDOWN EVENT LISTENER */
      dropdown.addEventListener("change", (e) => {
        const target = document.querySelector(e.target.value);
        if (!target) return;

        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }

    let currentMonthKey = null;

    sortedDates.forEach((date) => {
      const dateObj = parseLocalDate(date);
      const monthKey = dateObj.getFullYear() + "-" + dateObj.getMonth(); // unique
      const monthLabel = dateObj.toLocaleDateString("en-US", { month: "long" });

      const isFirstOfMonth = monthKey !== currentMonthKey;

      if (isFirstOfMonth) {
        const monthHeader = document.createElement("div");
        monthHeader.className = "month-header";
        monthHeader.id = `month-${monthKey}`;
        monthHeader.textContent = dateObj.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
        container.appendChild(monthHeader);

        currentMonthKey = monthKey;
      }

      const dateHeader = document.createElement("div");
      dateHeader.className = "date-header";

      dateHeader.innerHTML = `
        <span class="date-block">
          ${dateObj
            .toLocaleDateString("en-US", { month: "short" })
            .toUpperCase()}
          ${dateObj.getDate()}
        </span>
        <span class="day-block">
          ${dateObj
            .toLocaleDateString("en-US", { weekday: "long" })
            .toUpperCase()}
        </span>
      `;

      container.appendChild(dateHeader);

      groupedEvents[date].forEach((event) => {
        const card = document.createElement("article");
        card.className = "event-card";

        // Format times
        let timeText = "";
        const start = militaryTo12Hour(event.startTime);
        const end = militaryTo12Hour(event.endTime);

        if (start && end) {
          timeText = `${start}–${end}`;
        } else if (start) {
          timeText = start;
        }

        // Build meta items dynamically
        const metaItems = [];

        if (timeText) metaItems.push(`<span>${timeText}</span>`);
        if (event.location) metaItems.push(`<span>${event.location}</span>`);
        if (event.tickets)
          metaItems.push(`<span class="event-tickets">${event.tickets}</span>`);

        // Join with separator
        const metaLine = metaItems.join('<span class="meta-sep">·</span>');

        card.innerHTML = `
${
  event.imageURL
    ? `<img class="event-image" src="${event.imageURL}" alt="${
        event.imageAlt || event.title
      }" />`
    : ""
} 
<h3 class="event-title">${event.title}</h3>
${
  event.titleExplain ? `<p class="event-explain">${event.titleExplain}</p>` : ""
}

<div class="event-meta-line">
  ${metaLine}
</div>

<div class="event-footer">
  <span class="event-college">${event.college || ""}</span>
  ${
    event.url
      ? `<a class="event-link" href="${event.url}" target="_blank" aria-label="Event details">
          More info
        </a>`
      : ""
  }
</div>
`;

        /*        -------
        card.innerHTML = `
        ${
          event.imageURL
            ? `<img class="event-image" src="${event.imageURL}" alt="${
                event.imageAlt || event.title
              }" />
            `
            : ""
        } 
  <h3 class="event-title">${event.title}</h3>
  ${
    event.titleExplain
      ? `<p class="event-explain">${event.titleExplain}</p>`
      : ""
  }

  <div class="event-meta-line">
    ${
      event.location
        ? `<span class="meta-icon">📍</span>
           <span>${event.location}</span>`
        : ""
    }
    ${
      timeText
        ? `<span class="meta-sep">·</span>
           <span>${timeText}</span>`
        : ""
    }
    ${
      event.tickets
        ? `<span class="meta-sep">·</span>
           <span class="event-tickets">${event.tickets}</span>`
        : ""
    }
  </div>

  <div class="event-footer">
    <span class="event-college">${event.college || ""}</span>
    ${
      event.url
        ? `<a class="event-link" href="${event.url}" target="_blank" aria-label="Event details">
            Details
          </a>`
        : ""
    }
  </div>
`;
*/
        container.appendChild(card);
      });
    });
  })
  .catch((error) => {
    console.error("Error rendering events:", error);
  });
