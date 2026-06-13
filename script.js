let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

const taskForm = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");
//Render tasks when page loads
renderTasks();

taskForm.addEventListener("submit", function (e){
    e.preventDefault();
    
    const title = document.getElementById("taskTitle").value;
    const date = document.getElementById("taskDate").value;

    const newTask = {
        id: Date.now(),
        title: title,
        date: date,
        completed: false
    };

    tasks.push(newTask);
    saveTasks();
    renderTasks();

    taskForm.reset();
});
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}
function renderTasks() {
    taskList.innerHTML = "";

    tasks.forEach(task => {
        const li = document.createElement("li");
        li.innerHTML = `
        <span>
            ${task.title} - ${task.date}
        </span>
        `;
        taskList.appendChild(li);
    });
}