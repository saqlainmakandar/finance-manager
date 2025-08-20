// Initialize state
let state = {
    currentUser: null,
    transactions: [],
    goals: [],
    balance: 0,
    users: []
};

// Load data from localStorage
function loadData() {
    const savedData = localStorage.getItem('financeData');
    if (savedData) {
        state = JSON.parse(savedData);
        if (state.currentUser) {
            showApp();
        }
        updateUI();
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('financeData', JSON.stringify(state));
}

// Authentication functions
function login(email, password) {
    const user = state.users.find(u => u.email === email && u.password === password);
    if (user) {
        state.currentUser = user;
        saveData();
        showApp();
        return true;
    }
    return false;
}

function register(name, email, password) {
    if (state.users.some(u => u.email === email)) {
        return false;
    }
    
    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password
    };
    
    state.users.push(newUser);
    state.currentUser = newUser;
    saveData();
    showApp();
    return true;
}

function logout() {
    state.currentUser = null;
    saveData();
    showLogin();
}

// UI State Management
function showApp() {
    document.getElementById('loginContainer').classList.add('hidden');
    document.getElementById('registerContainer').classList.add('hidden');
    document.getElementById('appContainer').classList.remove('hidden');
    updateUI();
}

function showLogin() {
    document.getElementById('loginContainer').classList.remove('hidden');
    document.getElementById('registerContainer').classList.add('hidden');
    document.getElementById('appContainer').classList.add('hidden');
}

function showRegister() {
    document.getElementById('loginContainer').classList.add('hidden');
    document.getElementById('registerContainer').classList.remove('hidden');
    document.getElementById('appContainer').classList.add('hidden');
}

// Update UI elements
function updateUI() {
    updateBalance();
    updateTransactionsList();
    updateGoalsList();
}

// Update total balance and stats
function updateBalance() {
    const transactions = state.transactions.filter(t => t.userId === state.currentUser?.id);
    
    const { income, expenses } = transactions.reduce((acc, transaction) => {
        if (transaction.type === 'income') {
            acc.income += transaction.amount;
        } else {
            acc.expenses += transaction.amount;
        }
        return acc;
    }, { income: 0, expenses: 0 });

    const totalBalance = income - expenses;
    
    state.balance = totalBalance;
    document.getElementById('totalBalance').textContent = formatCurrency(totalBalance);
    document.getElementById('totalIncome').textContent = formatCurrency(income);
    document.getElementById('totalExpenses').textContent = formatCurrency(expenses);
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Update transactions list
function updateTransactionsList(filter = 'all') {
    const transactionsList = document.getElementById('transactionsList');
    transactionsList.innerHTML = '';

    const userTransactions = state.transactions.filter(t => t.userId === state.currentUser?.id);
    const filteredTransactions = userTransactions.filter(transaction => {
        if (filter === 'all') return true;
        return transaction.type === filter;
    });

    filteredTransactions.forEach(transaction => {
        const transactionEl = document.createElement('div');
        transactionEl.className = 'transaction-item';
        transactionEl.innerHTML = `
            <div>
                <strong>${transaction.description}</strong>
                <p>${transaction.category}</p>
            </div>
            <span class="${transaction.type}-amount">
                ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}
            </span>
        `;
        transactionsList.appendChild(transactionEl);
    });
}

// Update goals list
function updateGoalsList() {
    const goalsList = document.getElementById('goalsList');
    goalsList.innerHTML = '';

    const userGoals = state.goals.filter(g => g.userId === state.currentUser?.id);
    userGoals.forEach((goal, index) => {
        const progress = (goal.saved / goal.amount) * 100;
        const goalEl = document.createElement('div');
        goalEl.className = 'goal-item';
        goalEl.innerHTML = `
            <div style="width: 100%">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <strong>${goal.name}</strong>
                    <span>${formatCurrency(goal.saved)} / ${formatCurrency(goal.amount)}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-bar-fill" style="width: ${progress}%"></div>
                </div>
            </div>
            <button class="btn" onclick="contributeToGoal(${index})">Add</button>
        `;
        goalsList.appendChild(goalEl);
    });
}

// Modal handling
const modal = document.getElementById('transactionModal');
const closeModal = document.getElementById('closeModal');
let currentTransactionType = '';

function showModal(type) {
    currentTransactionType = type;
    modal.style.display = 'flex';
    document.getElementById('modalTitle').textContent = `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`;
}

closeModal.onclick = () => {
    modal.style.display = 'none';
};

window.onclick = (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};

// Add transaction
document.getElementById('transactionForm').onsubmit = (e) => {
    e.preventDefault();
    
    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;

    const transaction = {
        userId: state.currentUser.id,
        type: currentTransactionType,
        description,
        amount,
        category,
        date: new Date().toISOString()
    };

    state.transactions.unshift(transaction);
    saveData();
    updateUI();
    
    modal.style.display = 'none';
    e.target.reset();
};

// Add goal
document.getElementById('addGoalBtn').onclick = () => {
    const name = document.getElementById('goalName').value;
    const amount = parseFloat(document.getElementById('goalAmount').value);

    if (name && amount) {
        state.goals.push({
            userId: state.currentUser.id,
            name,
            amount,
            saved: 0
        });
        
        saveData();
        updateUI();
        
        document.getElementById('goalName').value = '';
        document.getElementById('goalAmount').value = '';
    }
};

// Contribute to goal
function contributeToGoal(index) {
    const amount = parseFloat(prompt('Enter contribution amount:'));
    if (amount && !isNaN(amount)) {
        const userGoals = state.goals.filter(g => g.userId === state.currentUser.id);
        const goalIndex = state.goals.indexOf(userGoals[index]);
        
        state.goals[goalIndex].saved += amount;
        
        // Add as an expense transaction
        state.transactions.unshift({
            userId: state.currentUser.id,
            type: 'expense',
            description: `Contribution to ${state.goals[goalIndex].name}`,
            amount,
            category: 'savings',
            date: new Date().toISOString()
        });
        
        saveData();
        updateUI();
    }
}

// Filter transactions
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelector('.filter-btn.active').classList.remove('active');
        btn.classList.add('active');
        updateTransactionsList(btn.dataset.filter);
    };
});

// Event listeners for quick action buttons
document.getElementById('addIncomeBtn').onclick = () => showModal('income');
document.getElementById('addExpenseBtn').onclick = () => showModal('expense');
document.getElementById('logoutBtn').onclick = () => logout();

// Login form handler
document.getElementById('loginForm').onsubmit = (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (login(email, password)) {
        e.target.reset();
    } else {
        alert('Invalid email or password');
    }
};

// Register form handler
document.getElementById('registerForm').onsubmit = (e) => {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    if (register(name, email, password)) {
        e.target.reset();
    } else {
        alert('Email already exists');
    }
};

// Navigation between login and register
document.getElementById('showRegister').onclick = (e) => {
    e.preventDefault();
    showRegister();
};

document.getElementById('showLogin').onclick = (e) => {
    e.preventDefault();
    showLogin();
};

// Initialize app
loadData();