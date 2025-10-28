document.addEventListener("DOMContentLoaded", function () {
  const calendarEl = document.getElementById("calendar");
  const calendar = new FullCalendar.Calendar(calendarEl, {
    headerToolbar: {
      right: "prev,next",
      left: "title",
    },
    // events: [
    //   { title: "Meeting", start: "2025-10-28" },
    //   { title: "Project Deadline", start: "2025-11-02" },
    // ],
  });
  calendar.render();
});
