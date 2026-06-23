
/*---------------- STATE ----------------*/
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let pomodoroCount = JSON.parse(localStorage.getItem("pomodoroCount")) || {};
let streakData = JSON.parse(localStorage.getItem("streakData")) || {
    count: 0,
    lastDate: null
};

let calendarViewDate = new Date();

/*---------------- ELEMENTS ----------------*/
const taskForm = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");
const taskListFull = document.getElementById("taskListFull");
const filterPriority = document.getElementById("filterPriority");
const filterStatus = document.getElementById("filterStatus");
const sortBy = document.getElementById("sortBy");
const toast = document.getElementById("toast");

/*---------------- INIT ----------------*/
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initNav();
    initTaskForm();
    initFilters();
    initCalendar();
    initPomodoro();

    renderAll();
});

/*---------------- THEME ----------------*/
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
    document.getElementById("themeToggle").textContent =
        theme === "dark" ? "☀️" : "🌙";
}

/*---------------- NAV ----------------*/
function initNav() {
    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.addEventListener("click", () => {

            document.querySelectorAll(".nav-btn")
                .forEach(b => b.classList.remove("active"));

            document.querySelectorAll(".view")
                .forEach(v => v.classList.remove("active"));

            btn.classList.add("active");

            document.getElementById("view-" + btn.dataset.view)
                .classList.add("active");

            if (btn.dataset.view === "calendar") renderCalendar();
            if (btn.dataset.view === "stats") renderStats();
        });
    });
}

/*---------------- TASK FORM ----------------*/
function initTaskForm() {
    taskForm.addEventListener("submit", e => {
        e.preventDefault();

        const title = document.getElementById("taskTitle").value.trim();
        const subject = document.getElementById("taskSubject").value.trim();
        const date = document.getElementById("taskDate").value;
        const priority = document.getElementById("taskPriority").value;

        if (!title || !date) return;

        tasks.push({
            id: Date.now(),
            title,
            subject,
            date,
            priority,
            completed: false
        });

        saveTasks();
        taskForm.reset();
        renderAll();
        showToast("Task added");
    });
}

/*---------------- FILTERS ----------------*/
function initFilters() {
    [filterPriority, filterStatus, sortBy].forEach(el => {
        el.addEventListener("change", renderAll);
    });
}

function getFilteredSortedTasks() {
    let list = [...tasks];

    if (filterPriority.value !== "all") {
        list = list.filter(t => t.priority === filterPriority.value);
    }

    if (filterStatus.value === "active") {
        list = list.filter(t => !t.completed);
    } else if (filterStatus.value === "completed") {
        list = list.filter(t => t.completed);
    }

    if (sortBy.value === "priority") {
        const order = { high: 0, medium: 1, low: 2 };
        list.sort((a, b) =>
            order[a.priority] - order[b.priority] ||
            a.date.localeCompare(b.date)
        );
    } else {
        list.sort((a, b) => a.date.localeCompare(b.date));
    }

    return list;
}

/*---------------- SAVE ----------------*/
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

/*---------------- HELPERS ----------------*/
function todayStr() {
    return new Date().toISOString().slice(0, 10);
}

/*---------------- RENDER ----------------*/
function renderAll() {
    renderTasks();
    renderHome();
    renderStats();
    renderCalendar();
}

/*---------------- TASKS ----------------*/
function renderTasks() {
    const list = getFilteredSortedTasks();

    taskList.innerHTML = "";
    taskListFull.innerHTML = "";

    list.forEach(task => {
        taskList.appendChild(createTask(task));
        taskListFull.appendChild(createTask(task));
    });
}

function createTask(task) {
    const li = document.createElement("li");

    li.className = `task priority-${task.priority}`;

    if (task.completed) li.classList.add("completed");

    li.innerHTML = `
        <div class="task-main">
            <div class="task-info">
                <div class="title">${task.title}</div>
                <div class="meta">${task.subject || "No subject"} • ${task.date}</div>
            </div>
        </div>

        <div class="task-actions">
            <button class="complete-btn">
                ${task.completed ? "Undo" : "Done"}
            </button>
            <button class="delete-btn">Delete</button>
        </div>
    `;

    li.querySelector(".complete-btn").addEventListener("click", () => {
        task.completed = !task.completed;

        if (task.completed) updateStreak();

        saveTasks();
        renderAll();
    });

    li.querySelector(".delete-btn").addEventListener("click", () => {
        tasks = tasks.filter(t => t.id !== task.id);
        saveTasks();
        renderAll();
        showToast("Task deleted");
    });

    return li;
}

/*---------------- HOME ----------------*/
function renderHome() {
    const completedToday = tasks.filter(
        t => t.completed && t.date === todayStr()
    ).length;

    const totalToday = tasks.filter(
        t => t.date === todayStr()
    ).length;

    const percent = totalToday ? (completedToday / totalToday) * 100 : 0;

    document.getElementById("todayProgressFill").style.width = percent + "%";

    document.getElementById("todayProgressText").textContent =
        `${completedToday} / ${totalToday} tasks done`;

    document.getElementById("streakCount").textContent = streakData.count;

    const upcoming = tasks
        .filter(t => !t.completed)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 3);

    const ul = document.getElementById("upcomingList");
    ul.innerHTML = "";

    upcoming.forEach(t => {
        const li = document.createElement("li");
        li.textContent = `${t.title} (${t.date})`;
        ul.appendChild(li);
    });
}

/*---------------- STREAK ----------------*/
function updateStreak() {
    const today = todayStr();

    if (streakData.lastDate === today) return;

    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yesterday = y.toISOString().slice(0, 10);

    if (streakData.lastDate === yesterday) {
        streakData.count++;
    } else {
        streakData.count = 1;
    }

    streakData.lastDate = today;

    localStorage.setItem("streakData", JSON.stringify(streakData));
}

/*---------------- STATS ----------------*/
function renderStats() {
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;

    const percent = total ? Math.round((completed / total) * 100) : 0;

    document.getElementById("overallProgressFill").style.width = percent + "%";
    document.getElementById("overallProgressText").textContent = percent + "%";

    document.getElementById("streakCount2").textContent = streakData.count;

    const totalPomos = Object.values(pomodoroCount).reduce((a, b) => a + b, 0);
    document.getElementById("totalPomodoros").textContent = totalPomos;

    const priorities = { high: 0, medium: 0, low: 0 };

    tasks.forEach(t => priorities[t.priority]++);

    document.getElementById("priorityBreakdown").innerHTML = `
        <div class="priority-row">High <b>${priorities.high}</b></div>
        <div class="priority-row">Medium <b>${priorities.medium}</b></div>
        <div class="priority-row">Low <b>${priorities.low}</b></div>
    `;
}

/*---------------- TOAST ----------------*/
function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");

    setTimeout(() => toast.classList.remove("show"), 2000);
}

/*---------------- CALENDAR ----------------*/
function initCalendar() {
    document.getElementById("prevMonth").addEventListener("click", () => {
        calendarViewDate.setMonth(calendarViewDate.getMonth() - 1);
        renderCalendar();
    });

    document.getElementById("nextMonth").addEventListener("click", () => {
        calendarViewDate.setMonth(calendarViewDate.getMonth() + 1);
        renderCalendar();
    });
}

function renderCalendar() {
    const grid = document.getElementById("calendarGrid");
    const label = document.getElementById("calendarMonthLabel");

    grid.innerHTML = "";

    const month = calendarViewDate.getMonth();
    const year = calendarViewDate.getFullYear();

    label.textContent =
        calendarViewDate.toLocaleString("default", { month: "long" }) +
        " " +
        year;

    const days = new Date(year, month + 1, 0).getDate();

    for (let i = 1; i <= days; i++) {
        const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;

        const count = tasks.filter(t => t.date === date).length;

        const cell = document.createElement("div");
        cell.className = "calendar-cell";

        cell.innerHTML = `
            <div class="day-num">${i}</div>
            <div class="dot-row">
                ${Array(count).fill('<span class="dot high"></span>').join("")}
            </div>
        `;

        grid.appendChild(cell);
    }
}

/*---------------- POMODORO ----------------*/
function initPomodoro() {
    let timer = null;
    let seconds = 25 * 60;

    const display = document.getElementById("timerDisplay");

    function updateDisplay() {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;

        display.textContent =
            `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }

    document.getElementById("timerStart").addEventListener("click", () => {
        if (timer) return;

        timer = setInterval(() => {
            seconds--;
            updateDisplay();

            if (seconds <= 0) {
                clearInterval(timer);
                timer = null;

                const today = todayStr();
                pomodoroCount[today] = (pomodoroCount[today] || 0) + 1;

                localStorage.setItem("pomodoroCount", JSON.stringify(pomodoroCount));

                renderStats();
                showToast("Pomodoro done");
            }
        }, 1000);
    });

    document.getElementById("timerPause").addEventListener("click", () => {
        clearInterval(timer);
        timer = null;
    });

    document.getElementById("timerReset").addEventListener("click", () => {
        clearInterval(timer);
        timer = null;
        seconds = 25 * 60;
        updateDisplay();
    });

    updateDisplay();
}

/*---------------- PLACEHOLDERS ----------------*/
function initExportImport() {}
function requestNotifPermission() {}
function checkDueNotifications() {}