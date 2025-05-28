document.addEventListener("DOMContentLoaded", () => {
  //test
  function saveEventToFirebase(name, start, end, note, date, type) {
    console.log("Saving event to Firebase:", { name, start, end, note, date });
    console.log("db available?", typeof window.db !== "undefined");

    window.db
      .collection("events")
      .add({
        title: name,
        startTime: start,
        endTime: end,
        note: note,
        date: date,
        type: type,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      })
      .then((docRef) => {
        console.log("✅ Event saved with ID:", docRef.id);
      })
      .catch((error) => {
        console.error("❌ Error saving event:", error);
      });
  }
  function openEditModal(eventData, docId) {
    // Pre-fill modal
    document.getElementById("eventName").value = eventData.title;
    document.getElementById("eventNote").value = eventData.note;
    document.getElementById("eventType").value = eventData.type || "";

    if (eventData.startTime && eventData.endTime) {
      noTimeCheckbox.checked = false;
      timeFields.style.display = "block";
      document.getElementById("eventStart").value = eventData.startTime;
      document.getElementById("eventEnd").value = eventData.endTime;
    } else {
      noTimeCheckbox.checked = true;
      timeFields.style.display = "none";
    }

    // Store ID in global scope
    window.editingEventId = docId;
    window.selectedDate = eventData.date;

    modal.style.display = "block";
    document.getElementById("submitEventBtn").textContent = "Update Event";
  }
  const today = new Date();
  const noTimeCheckbox = document.getElementById("noTime");
  const timeFields = document.getElementById("timeFields");

  noTimeCheckbox.addEventListener("change", () => {
    const hide = noTimeCheckbox.checked;

    timeFields.style.display = hide ? "none" : "block";

    // Optionally disable validation
    document.getElementById("eventStart").required = !hide;
    document.getElementById("eventEnd").required = !hide;
  });

  const eventNameInput = document.getElementById("eventName");
  const eventStartInput = document.getElementById("eventStart");
  const eventEndInput = document.getElementById("eventEnd");
  const modal = document.getElementById("eventModal");
  const closeModal = document.getElementById("closeModal");
  const eventForm = document.getElementById("eventForm");
  const eventTimeInput = document.getElementById("eventTime");
  const eventNoteInput = document.getElementById("eventNote");
  //const name = eventNameInput.value;

  let activeEventList = null; // To track which day was clicked

  //
  const calendar = document.getElementById("calendar");
  const monthLabel = document.getElementById("monthLabel");
  const prevMonthBtn = document.getElementById("prevMonth");
  const nextMonthBtn = document.getElementById("nextMonth");

  let currentDate = new Date(2025, 4); // Start at May 2025 (month is 0-indexed)
  let dayElements = [];

  function renderCalendar(date) {
    dayElements = []; // ✅ Reset global array

    calendar.innerHTML = ""; // Clear calendar

    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    // Month name at top
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    monthLabel.textContent = `${monthNames[month]} ${year}`;
    document.title = `${monthNames[month]} ${year}`;

    // Add weekday headers
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    daysOfWeek.forEach((day) => {
      const header = document.createElement("div");
      header.className = "day header";
      header.textContent = day;
      calendar.appendChild(header);
    });

    // Empty slots before first day
    for (let i = 0; i < startDayOfWeek; i++) {
      const empty = document.createElement("div");
      empty.className = "day";
      calendar.appendChild(empty);
    }

    // Actual days
    for (let dateNum = 1; dateNum <= daysInMonth; dateNum++) {
      const day = document.createElement("div");
      if (
        year === today.getFullYear() &&
        month === today.getMonth() &&
        dateNum === today.getDate()
      ) {
        day.classList.add("selected");
       // setTimeout(() => day.click(), 0); // Simulate click to show events
      }

      day.className = "day";

      const numberSpan = document.createElement("span");
      numberSpan.className = "date-number";
      numberSpan.textContent = dateNum;

      const addBtn = document.createElement("button");
      addBtn.className = "add-btn";
      addBtn.textContent = "+";

      const eventList = document.createElement("ul");
      eventList.className = "event-list"; ///////////////

      const currentDateStr = `${year}-${String(month + 1).padStart(
        2,
        "0"
      )}-${String(dateNum).padStart(2, "0")}`; // 🔥 ADDED
      day.dataset.date = currentDateStr; // 🔥 ADDED
      dayElements.push({ date: currentDateStr, eventList }); // 🔥 ADDED

      // ✅ Use modal-based event input
      addBtn.addEventListener("click", () => {
        activeEventList = eventList;
        eventForm.reset();
        document.getElementById("submitEventBtn").textContent = "Add Event";
        modal.style.display = "block";

        // Store the clicked date in a global variable
        const clickedDate = `${year}-${String(month + 1).padStart(
          2,
          "0"
        )}-${String(dateNum).padStart(2, "0")}`;
        window.selectedDate = clickedDate;
      });

      day.appendChild(numberSpan);
      day.appendChild(addBtn);
      day.appendChild(eventList);
      calendar.appendChild(day);

      day.addEventListener("click", (e) => {
        if (e.target.classList.contains("add-btn")) return;
        document.querySelectorAll(".day").forEach((d) => d.classList.remove("selected"));
        day.classList.add("selected"); // Add it to the current one
        const events = Array.from(
          eventList.querySelectorAll(".event-item > li, .event-title")
        );

        const eventDetails = document.getElementById("eventDetails");
        eventDetails.innerHTML = `<h2>Events for ${
          month + 1
        }/${dateNum}/${year}</h2>`;

        if (events.length === 0) {
          eventDetails.innerHTML += "<p>No events for this day.</p>";
        } else {
          const ul = document.createElement("ul");
          events.forEach((li) => {
            const name = li.textContent;
            const details = li.dataset.details
              ? JSON.parse(li.dataset.details)
              : null;

            const clone = li.cloneNode(true);

            if (details?.eventType === "foh") {
              clone.classList.add("event-foh");
            } else if (details?.eventType === "boh") {
              clone.classList.add("event-boh");
            }

            clone.addEventListener("click", () => {
              const timeDisplay =
                details?.startTime && details?.endTime
                  ? `🕒 ${details.startTime} - ${details.endTime}\n`
                  : "";
              alert(`📌 ${name}\n${timeDisplay}📝 ${details.note}`);
            });

            ul.appendChild(clone);
          });
          eventDetails.appendChild(ul);
        }
      });
    }
    window.db
      .collection("events")
      .orderBy("createdAt")
      .get()
      .then((snapshot) => {
        console.log("🎯 Loaded events from Firebase:", snapshot.size);

        snapshot.forEach((doc) => {
          const data = doc.data();
          const targetDay = dayElements.find((d) => d.date === data.date);
          if (!targetDay) return;
          const li = document.createElement("li");
          li.textContent = data.title;
          li.classList.add("event-title");

          if (data.type === "foh") {
            li.classList.add("event-foh");
          } else if (data.type === "boh") {
            li.classList.add("event-boh");
          }

          li.dataset.details = JSON.stringify({
            startTime: data.startTime,
            endTime: data.endTime,
            note: data.note,
            eventType: data.type,
            date: data.date,
          });

          // Click event for details
          li.addEventListener("click", () => {
            const timeDisplay =
              data.startTime && data.endTime
                ? `🕒 ${data.startTime} - ${data.endTime}\n`
                : "";
            alert(`📌 ${data.title}\n${timeDisplay}📝 ${data.note}`);
          });

          // ✏️ Edit Button
          const editBtn = document.createElement("button");
          editBtn.textContent = "✏️";
          editBtn.classList.add("edit-btn");
          editBtn.addEventListener("click", (e) => {
            e.stopPropagation(); // prevent triggering eventDetails
            openEditModal(data, doc.id);
          });

          // Wrap in a styled <li class="event-item">
          const eventItem = document.createElement("li");
          eventItem.classList.add("event-item");

          eventItem.appendChild(li);
          eventItem.appendChild(editBtn);

          targetDay.eventList.appendChild(eventItem);
        });
      })
      .catch((error) => {
        console.error("🔥 Error loading events:", error);
      });
  }

  //
  closeModal.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  eventForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const date = window.selectedDate || "unknown";
    const startTime = noTimeCheckbox.checked ? null : eventStartInput.value;
    const endTime = noTimeCheckbox.checked ? null : eventEndInput.value;
    const note = eventNoteInput.value;
    const name = eventNameInput.value;
    const eventType = document.getElementById("eventType").value;

    // Create new event
    if (window.editingEventId) {
      // ✅ UPDATE existing event
      window.db
        .collection("events")
        .doc(window.editingEventId)
        .update({
          title: name,
          startTime,
          endTime,
          note,
          type: eventType,
        })
        .then(() => {
          console.log("📝 Event updated!");
          window.editingEventId = null;
          modal.style.display = "none";
          renderCalendar(currentDate); // ✅ Re-renders with updated data
        })
        .catch((err) => {
          console.error("Error updating event:", err);
        });
    } else {
      // ✅ CREATE new event
      const li = document.createElement("li");
      li.textContent = name;
      if (eventType === "foh") {
        li.classList.add("event-foh");
      } else if (eventType === "boh") {
        li.classList.add("event-boh");
      }

      li.dataset.details = JSON.stringify({
        startTime,
        endTime,
        note,
        eventType,
      });

      li.addEventListener("click", () => {
        const timeDisplay =
          startTime && endTime ? `🕒 ${startTime} - ${endTime}\n` : "";
        alert(`📌 ${name}\n${timeDisplay}📝 ${note}`);
      });

      activeEventList.appendChild(li);
      saveEventToFirebase(name, startTime, endTime, note, date, eventType);
      modal.style.display = "none";
    }
  });

  //
  // Navigation buttons
  prevMonthBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar(currentDate);
  });

  nextMonthBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(currentDate);
  });

  renderCalendar(currentDate);
});
