const { createElement } = require("react");

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
            document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
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
function initFilters() {
    [filterPriority, filterStatus, sortBy].forEach(el => {
        el.addEventListener("change", renderAll);
    });
}

/* ------ Save ------ */
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}
function savePomodoro() {
    localStorage.setItem("pomodoroCount", JSON.stringify(pomodoroCount));
}
function saveStreak() {
    localStorage.setItem("streakData", JSON.stringify(streakData))
}

/* ------ Helpers ------ */
function todayStr () {
    const d = new Date();
    return d.toISOString().slice(0,10);
}
function getFilteredSortedTasks() {
    let list = [...tasks];

    if (filterPriority.value !== "all") {
        list = list.filter(t => t.priority === filterPriority.value);
    } if (filterStatus.value === "active") {
        list = list.filter(t => !t.completed);
    } else if (filterStatus.value === "completeted") {
        list = list.filter(t => t.completed);
    }

    if (sortBy.value === "priority") {
        const order = { high: 0, medium: 1, low: 2 };
        list.sort((a,b) => order[a.priority] - order[b.priority] || a.date.localeCompare(b.date));
    } else {
        list.sort((a,b) => a.date.localeCompare(b.date));
    }

    return list;
}

/*------- Render -------*/
function renderAll() {
    renderTasks();
    renderHome();
    renderStats();
    renderCalendar();
}

function renderTasks() {
    const list = getFilteredSortedTasks();

    taskList.innerHTML = "";
    taskListFull.innerHTML = "";

    list.forEach(task => {
        const li = createTaskElement(task);

        taskList.appendChild(li);

        const li2 = createTaskElement(task);
        taskListFull.appendChild(li2);
    });
}

function createTaskElement(task) {
    const li = document.createElement("li");

    li.className = `task ${task.priority}`;
    if (task.completed) li.classList.add("completed");

    li.innerHTML = `
    <div class="task-info">
    <h3>${task.title}</h3>
    <p>${task.subject || "No subject"}</p>
    <small>${task.date}</small>
    </div>
    
    <div class="task-actions">
    <button class="complete-btn">
    ${task.completed ? "Undo" : "Done"}
    </button>

    <button class="delete-btn>
    Delete
    </button>"
    </div>`;

    li.querySelector(".delete-btn").addEventListener("click", () => {
        tasks = tasks.filter(t => t.id !== task.id);

        saveTasks();
        renderAll();

        showToast("Task Deleted");
    });
    return li;
}

/*------Home Dashboard------*/

function renderHome() {
    const completedToday = task.filter(
        t => t.completed && t.date === todayStr()
    ).length;

    const totalToday = task.filter(
        t => t.date === todayStr()
    ).length;

    const percent = totalToday
    ? (completedToday / totalToday) * 100
    : 0;

    document.getElementById("todayProgressFill")
    .stylewidth = percent + "%";

    document.getElementById("todayProgressText")
    .textContent = 
    `${completedToday} / ${totalToday} tasks done`;

    document.getElementById("streakCount")
    .textContent = streakData.count;

    const upcoming = tasks
    .filter(t => !t.completed)
    .sort((a,b)=>a.date.localeCompare(b.date))
    .slice(0,3);

    const ul = document.getElementById("upcomingList");

    ul.innerHTML = "";

    upcoming.forEach(t => {

        const li = document.createElement("li");

        li.textContent = 
        `${t.title} (${t.date})`;

        ul.appendChild(li);
    });
}

/*-----Streak-----*/
function updateStreak() {
    
    const today = todayStr();

    if (streakData.lastDate === today) return;

    const yesterday = new Date();

    yesterday.setDate(yesterday.getDate() - 1);

    const y =
    yesterday.toISOString().slice(0,10);

    if (streakData.lastDate === y) {
        streakData.count++;
    } else {
        streakData.count = 1;
    }

    streakData.lastDate = today;

    saveStreak();
}

/*-----Stats-----*/
function renderStats() {

    const completed = 
    task.filter(t => t.completed).length;

    const total = tasks.length;

    const percent = 
    total ? Math.round(completed/total*100) : 0;

    document.getElementById("overallProgressFill")
    .style.width = percent + "%";

    document.getElementById("overallProgressText")
    .textContent = percent + "%";

    document.getElementById("streakCount2")
    .textContent = streakData.count;

    const totalPomos = Object.values(pomodoroCount)
    .reduce((a,b)=>a+b,0);

    document.getElementById("totalPomodoros")
    .textContent = totalPomos;

    const priorities = {
        high:0,
        medium:0,
        low:0
    };

    tasks.forEach(t => {
        priorities[t.priority]++;
    });

    document.getElementById(
        "priorityBreakdown"
    ).innerHTML = `
    <p>High: ${priorities.high}</p>
    <p>Medium: ${priorities.medium}</p>
    <p>Low: ${priorities.low}</p>`;
}
/*-----Toast-----*/
function showToast(message) {

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}
/*-----Calendar-----*/