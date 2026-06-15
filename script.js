/*------State-----*/
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let pomodoroCount = JSON.parse(localStorage.getItem("pomodoroCount")) || {};
let streakData = JSON.parse(localStorage.getItem("streakData")) || { count: 0, lastDate: null };
let calendarViewDate = new Date()

/*----- Elements -----*/
const taskForm = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");
const taskListFull = document.getElementById("taskListFull");
const filterPriority = document.getElementById("filterPriority");
const filterStatus = document.getElementById("filterStatus");
const sortBy = document.getElementById("sortBy");
const toast = document.getElementById("toast");

/* ------ Init ------ */
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initNav();
    initTaskForm();
    initFilters();
    initCalendar();
    initPomodoro();
    initExportImport();
    requestNotifPermission();
    renderAll();
    setInterval(checkDueNotifications, 60 * 1000);
});

/* ------ Theme ------ */
function initTheme() {
    const saved = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", saved);
    updateThemeIcon(saved);
    document.getElementById("themeToggle").addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme");
        const next = current === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        localStorage.setItem("theme", next);
        updateThemeIcon(next);
    });
}
function updateThemeIcon(theme) {
    document.getElementById("themeToggle").textContent = theme === "dark" ? "☀️" : "🌙";
}

/* ------ Navigation ------ */
function initNav () {
    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
            documen.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
            btn.classList.add("active");
            document.getElementById("view-" + btn.dataset.view).classList.add("active");
            if (btn.dataset.view === "calendar") renderCalendar();
            if (btn.dataset.view === "stats") renderStats();
        });
    });
}

/* ------ Task form ------ */
function initTaskForm() {
    taskForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const title = document.getElementById("taskTitle").value.trim();
        const subject = document.getElementById("taskSubject").value.trim();
        const date = document.getElementById("taskDate").value;
        const priority = document.getElementById("taskPriority").value;

        if (!title || !date) return;

        const newTask = {
            id: Date.now(),
            title,
            subject,
            date,
            priority,
            completed:false,
            createdAt: new Date().toISOString()
        };

        tasks.push(newTask);
        saveTasks();
        renderAll();
        taskForm.reset();
        showToast("Task Added!");
    });
}

/* ------ Filters ------ */