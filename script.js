document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const taskInput = document.getElementById('task-input');
    const addBtn = document.getElementById('add-btn');
    const voiceBtn = document.getElementById('voice-btn');
    const taskCategory = document.getElementById('task-category');
    const taskDate = document.getElementById('task-date');
    const taskTime = document.getElementById('task-time');
    const taskList = document.getElementById('task-list');
    const starsContainer = document.getElementById('stars-container');
    const progressText = document.getElementById('progress-text');
    const totalTasksEl = document.getElementById('total-tasks');
    const completedTasksEl = document.getElementById('completed-tasks');
    const pendingTasksEl = document.getElementById('pending-tasks');
    const notification = document.getElementById('notification');
    const confettiCanvas = document.getElementById('confetti-canvas');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.getElementById('nav-links');
    const navLinksAll = document.querySelectorAll('.nav-link');
    const contactForm = document.getElementById('contact-form');

    // Initialize tasks from localStorage
    let tasks = JSON.parse(localStorage.getItem('cosmic-tasks')) || [];

    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    taskDate.value = today;

    // Initialize the app
    function init() {
        renderTaskList('all');
        updateStats();
        setupEventListeners();
        createStars();
        setupNavigation();
        setupContactForm();
    }

    // Set up event listeners
    function setupEventListeners() {
        // Add task
        addBtn.addEventListener('click', addTask);
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addTask();
        });

        // Voice input
        voiceBtn.addEventListener('click', startVoiceRecognition);

        // Filter buttons
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                renderTaskList(this.dataset.filter);
            });
        });
    }

    // Set up navigation
    function setupNavigation() {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });

        // Close mobile menu when clicking a link
        navLinksAll.forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                
                // Update active nav link
                navLinksAll.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });

        // Smooth scrolling for navigation
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                document.querySelector(this.getAttribute('href')).scrollIntoView({
                    behavior: 'smooth'
                });
            });
        });
    }

    // Set up contact form
    function setupContactForm() {
        if (contactForm) {
            contactForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const name = document.getElementById('name').value;
                const email = document.getElementById('email').value;
                const message = document.getElementById('message').value;
                
                // Here you would typically send the data to a server
                console.log({ name, email, message });
                
                showNotification('Message sent! We\'ll contact you soon.', 'success');
                contactForm.reset();
            });
        }
    }

    // Add a new task
    function addTask() {
        const text = taskInput.value.trim();
        if (!text) {
            showNotification('Enter a task, astronaut!', 'warning');
            return;
        }

        const newTask = {
            id: Date.now(),
            text,
            category: taskCategory.value,
            date: taskDate.value,
            time: taskTime.value,
            completed: false,
            createdAt: new Date().toISOString()
        };

        tasks.push(newTask);
        saveTasks();
        renderTaskList(document.querySelector('.filter-btn.active').dataset.filter);
        updateStats();
        taskInput.value = '';
        taskTime.value = '';
        showNotification('Task launched into orbit! 🚀');
    }

    // Render the task list with filtering
    function renderTaskList(filter = 'all') {
        taskList.innerHTML = '';

        if (tasks.length === 0) {
            taskList.innerHTML = '<p class="empty-message">The cosmos is empty... Add a task!</p>';
            return;
        }

        let filteredTasks = [...tasks];

        // Apply filters
        if (filter === 'completed') {
            filteredTasks = tasks.filter(task => task.completed);
        } else if (filter === 'upcoming') {
            const today = new Date().toISOString().split('T')[0];
            filteredTasks = tasks.filter(task => !task.completed && task.date >= today);
        }

        // Sort tasks: incomplete first, then by date
        filteredTasks.sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            if (a.time !== b.time) {
                if (!a.time) return 1;
                if (!b.time) return -1;
                return a.time.localeCompare(b.time);
            }
            return new Date(a.createdAt) - new Date(b.createdAt);
        });

        filteredTasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.className = `task-item ${task.category} ${task.completed ? 'completed' : ''}`;
            taskItem.dataset.id = task.id;

            const dateTimeStr = formatDateTime(task.date, task.time);

            taskItem.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-text ${task.completed ? 'completed' : ''}">${task.text}</span>
                <span class="task-datetime">${dateTimeStr}</span>
                <div class="task-actions">
                    <button class="edit-btn"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn"><i class="fas fa-trash"></i></button>
                </div>
            `;

            taskList.appendChild(taskItem);

            // Add event listeners
            const checkbox = taskItem.querySelector('.task-checkbox');
            const editBtn = taskItem.querySelector('.edit-btn');
            const deleteBtn = taskItem.querySelector('.delete-btn');

            checkbox.addEventListener('change', () => toggleTaskComplete(task.id));
            editBtn.addEventListener('click', () => editTask(task.id));
            deleteBtn.addEventListener('click', () => deleteTask(task.id));
        });
    }

    // Toggle task completion
    function toggleTaskComplete(id) {
        tasks = tasks.map(task => {
            if (task.id === id) {
                if (!task.completed) {
                    triggerConfetti();
                }
                return { ...task, completed: !task.completed };
            }
            return task;
        });
        saveTasks();
        renderTaskList(document.querySelector('.filter-btn.active').dataset.filter);
        updateStats();
        showNotification('Task status updated!');
    }

    // Edit task
    function editTask(id) {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        taskInput.value = task.text;
        taskCategory.value = task.category;
        taskDate.value = task.date;
        taskTime.value = task.time || '';

        // Remove the task being edited
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        renderTaskList(document.querySelector('.filter-btn.active').dataset.filter);
        updateStats();
        taskInput.focus();
    }

    // Delete task
    function deleteTask(id) {
        if (confirm('Eject this task into space?')) {
            tasks = tasks.filter(task => task.id !== id);
            saveTasks();
            renderTaskList(document.querySelector('.filter-btn.active').dataset.filter);
            updateStats();
            showNotification('Task vaporized! 💥', 'danger');
        }
    }

    // Save tasks to localStorage
    function saveTasks() {
        localStorage.setItem('cosmic-tasks', JSON.stringify(tasks));
    }

    // Update stats
    function updateStats() {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;
        const pendingTasks = totalTasks - completedTasks;
        const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        totalTasksEl.textContent = totalTasks;
        completedTasksEl.textContent = completedTasks;
        pendingTasksEl.textContent = pendingTasks;
        progressText.textContent = `${completionPercentage}% Complete`;

        // Update stars (visual progress)
        updateStars(completionPercentage);
    }

    // Create stars for progress bar
    function createStars() {
        starsContainer.innerHTML = '';
        for (let i = 0; i < 50; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.width = `${Math.random() * 3 + 1}px`;
            star.style.height = star.style.width;
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.animationDelay = `${Math.random() * 2}s`;
            starsContainer.appendChild(star);
        }
    }

    // Update stars based on progress
    function updateStars(percentage) {
        const stars = document.querySelectorAll('.star');
        const visibleStars = Math.floor((percentage / 100) * stars.length);
        
        stars.forEach((star, index) => {
            if (index < visibleStars) {
                star.style.opacity = '1';
                star.style.animation = 'twinkle 2s infinite alternate';
            } else {
                star.style.opacity = '0.2';
                star.style.animation = 'none';
            }
        });
    }

    // Show notification
    function showNotification(message, type = 'success') {
        notification.textContent = message;
        notification.className = 'cosmic-notification';
        
        if (type === 'success') {
            notification.style.background = 'var(--cosmic-purple)';
        } else if (type === 'warning') {
            notification.style.background = 'var(--warning-color)';
            notification.style.color = 'black';
        } else if (type === 'danger') {
            notification.style.background = 'var(--danger-color)';
        }
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Format date and time
    function formatDateTime(dateStr, timeStr) {
        const date = new Date(dateStr);
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        let formatted = date.toLocaleDateString('en-US', options);
        
        if (timeStr) {
            const [hours, minutes] = timeStr.split(':');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const hours12 = hours % 12 || 12;
            formatted += ` • ${hours12}:${minutes} ${ampm}`;
        }
        
        return formatted;
    }

    // Voice recognition
    function startVoiceRecognition() {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new webkitSpeechRecognition();
            recognition.lang = 'en-US';
            recognition.interimResults = false;
            
            recognition.onstart = () => {
                voiceBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
                showNotification('Listening... Speak now!', 'warning');
            };
            
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                taskInput.value = transcript;
                voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                showNotification('Voice command captured!');
            };
            
            recognition.onerror = (event) => {
                voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                showNotification('Error: ' + event.error, 'danger');
            };
            
            recognition.start();
        } else {
            showNotification('Voice input not supported', 'danger');
        }
    }

    // Confetti effect
    function triggerConfetti() {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#6a00f4', '#00d4ff', '#ffcc00', '#ff00aa']
        });
    }

    // Initialize the app
    init();
});