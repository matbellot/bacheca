document.addEventListener('DOMContentLoaded', () => {
    // Chiedi password all'avvio
    const password = prompt('Inserisci la password:');
    if (password !== 'password-segreta') {
        document.body.innerHTML = '<h1>Accesso negato</h1>';
        return;
    }
    
    const db = firebase.database();
    const tasksRef = db.ref('tasks');
    let tasks = [];

    // Ascolta i cambiamenti nel database
    tasksRef.on('value', (snapshot) => {
        tasks = snapshot.val() || [];
        renderTasks();
    });

    const saveTasks = () => {
        tasksRef.set(tasks);
    };

    const createTask = (column) => {
        const task = {
            id: Date.now(),
            title: '',
            description: '',
            status: column,
            assignedTo: 'Matteo'
        };
        tasks.push(task);
        saveTasks();
    };

    // Funzione per aggiornare un task
    const updateTask = (taskId, updates) => {
        tasks = tasks.map(task => 
            task.id === taskId ? { ...task, ...updates } : task
        );
        saveTasks();
    };

    // Funzione per eliminare un task
    const deleteTask = (taskId) => {
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks();
    };

    // Funzione per renderizzare i task
    const renderTasks = () => {
        const userFilter = document.getElementById('userFilter').value;
        const filteredTasks = userFilter === 'all' 
            ? tasks 
            : tasks.filter(task => task.assignedTo === userFilter);

        document.querySelectorAll('.tasks-container').forEach(container => {
            const columnStatus = container.parentElement.dataset.status;
            const columnTasks = filteredTasks.filter(task => task.status === columnStatus);
            
            container.innerHTML = columnTasks.map(task => `
                <div class="task" draggable="true" data-task-id="${task.id}">
                    <div class="task-header">
                        <div class="task-content">
                            <div class="task-title" contenteditable="true">${task.title}</div>
                            <div class="task-description" contenteditable="true">${task.description}</div>
                            ${columnStatus !== 'Done' ? `
                                <select class="user-select button">
                                    <option value="Matteo" ${task.assignedTo === 'Matteo' ? 'selected' : ''}>Matteo</option>
                                    <option value="Marta" ${task.assignedTo === 'Marta' ? 'selected' : ''}>Marta</option>
                                </select>
                                <div class="task-mobile-controls">
                                    ${columnStatus === 'To Do' ? `
                                        <button class="button move-to" data-move-to="Doing">Sposta in Doing</button>
                                    ` : columnStatus === 'Doing' ? `
                                        <button class="button move-to" data-move-to="Done">Sposta in Done</button>
                                    ` : ''}
                                </div>
                            ` : ''}
                        </div>
                        <div class="task-controls">
                            <button class="button delete">Elimina Task</button>
                        </div>
                    </div>
                </div>
            `).join('');
        });

        // Aggiungi event listeners per il drag and drop
        setupDragAndDrop();
    };

    // Setup drag and drop
    const setupDragAndDrop = () => {
        const tasks = document.querySelectorAll('.task');
        const containers = document.querySelectorAll('.tasks-container');

        tasks.forEach(task => {
            task.addEventListener('dragstart', () => {
                task.classList.add('dragging');
            });

            task.addEventListener('dragend', () => {
                task.classList.remove('dragging');
            });
        });

        containers.forEach(container => {
            container.addEventListener('dragover', e => {
                e.preventDefault();
            });

            container.addEventListener('drop', e => {
                e.preventDefault();
                const draggingTask = document.querySelector('.dragging');
                if (draggingTask) {
                    const taskId = parseInt(draggingTask.dataset.taskId);
                    const newStatus = container.parentElement.dataset.status;
                    updateTask(taskId, { status: newStatus });
                }
            });
        });
    };

    // Event Listeners
    document.querySelectorAll('.add-task').forEach(button => {
        button.addEventListener('click', () => {
            const column = button.parentElement.dataset.status;
            createTask(column);
        });
    });

    document.getElementById('userFilter').addEventListener('change', renderTasks);

    document.addEventListener('click', e => {
        if (e.target.classList.contains('delete')) {
            const taskId = parseInt(e.target.closest('.task').dataset.taskId);
            deleteTask(taskId);
        }
        if (e.target.classList.contains('move-to')) {
            const taskId = parseInt(e.target.closest('.task').dataset.taskId);
            const newStatus = e.target.dataset.moveTo;
            updateTask(taskId, { status: newStatus });
        }
    });

    document.addEventListener('change', e => {
        if (e.target.classList.contains('user-select')) {
            const taskId = parseInt(e.target.closest('.task').dataset.taskId);
            updateTask(taskId, { assignedTo: e.target.value });
        }
    });

    document.addEventListener('blur', e => {
        if (e.target.classList.contains('task-title') || e.target.classList.contains('task-description')) {
            const taskId = parseInt(e.target.closest('.task').dataset.taskId);
            const updates = {};
            if (e.target.classList.contains('task-title')) {
                updates.title = e.target.textContent;
            } else {
                updates.description = e.target.textContent;
            }
            updateTask(taskId, updates);
        }
    }, true);

    // Renderizza i task iniziali
    renderTasks();
}); 
