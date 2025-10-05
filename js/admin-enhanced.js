document.addEventListener("DOMContentLoaded", () => {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  const token = localStorage.getItem("token")

  if (!currentUser || !token) {
    window.location.href = "index.html"
    return
  }

  if (!currentUser.isAdmin) {
    showToast("Access denied. Admin privileges required.", "error")
    setTimeout(() => {
      window.location.href = "dashboard.html"
    }, 2000)
    return
  }

  const isDarkMode = localStorage.getItem("darkMode") !== "false"
  if (!isDarkMode) {
    document.body.classList.add("light-mode")
    const themeIcon = document.querySelector("#themeToggleBtn i")
    if (themeIcon) themeIcon.className = "fas fa-sun"
  }

  loadAdminStats()
  loadUsers()
  setupEventListeners()
  setupMenu()
  setupTabs()
})

async function loadAdminStats() {
  try {
    const token = localStorage.getItem("token")

    // Fetch real users data
    const usersResponse = await fetch("/api/admin/users", {
      headers: { Authorization: `Bearer ${token}` },
    })
    const usersData = await usersResponse.json()

    // Fetch real transactions data
    const transactionsResponse = await fetch("/api/transactions", {
      headers: { Authorization: `Bearer ${token}` },
    })
    const transactionsData = await transactionsResponse.json()

    if (usersData.success) {
      const users = usersData.users || []
      document.getElementById("totalUsers").textContent = users.length
      document.getElementById("activeUsers").textContent = users.filter((u) => !u.isAdmin && !u.isBanned).length

      // Calculate total volume from all users
      const totalVolume = users.reduce((sum, user) => sum + (user.balance || 0), 0)
      document.getElementById("totalVolume").textContent = `$${formatNumber(totalVolume)}`
    }

    if (transactionsData.success) {
      document.getElementById("totalTransactions").textContent = transactionsData.transactions.length
    }
  } catch (error) {
    console.error("[v0] Error loading admin stats:", error)
    showToast("Error loading stats", "error")
  }
}

async function loadUsers() {
  const usersList = document.getElementById("usersList")

  try {
    const token = localStorage.getItem("token")
    const response = await fetch("/api/admin/users", {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await response.json()

    if (!data.success) {
      throw new Error(data.message)
    }

    const users = data.users || []

    if (users.length === 0) {
      usersList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"><i class="fas fa-users"></i></div>
          <div class="empty-title">No users yet</div>
          <div class="empty-description">Add your first user to get started</div>
        </div>
      `
      return
    }

    usersList.innerHTML = users
      .map(
        (user) => `
      <div class="card mb-3 user-card ${user.isBanned ? "banned-user" : ""}" data-user-id="${user.id}">
        <div class="card-body">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3 flex-1">
              <div style="width: 48px; height: 48px; background: var(--primary-bg); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-weight: 700; color: var(--primary);">
                ${user.name.charAt(0).toUpperCase()}
              </div>
              <div class="flex-1">
                <div class="font-semibold mb-1">
                  ${user.name}
                  ${user.isAdmin ? '<span class="badge badge-danger ml-2">Admin</span>' : ""}
                  ${user.isUpgraded ? '<span class="badge badge-success ml-2">Upgraded</span>' : '<span class="badge badge-warning ml-2">Basic</span>'}
                  ${user.isBanned ? '<span class="badge badge-danger ml-2">Banned</span>' : ""}
                </div>
                <div class="text-xs text-secondary">${user.email}</div>
                <div class="text-xs text-secondary mt-1">Balance: $${formatNumber(user.balance || 0)}</div>
              </div>
            </div>
            <div class="flex gap-2">
              <button class="btn btn-sm btn-ghost debit-user-btn" data-user-id="${user.id}" title="Debit User">
                <i class="fas fa-minus-circle"></i>
              </button>
              <button class="btn btn-sm btn-ghost edit-user-btn" data-user-id="${user.id}" title="Edit User">
                <i class="fas fa-edit"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `,
      )
      .join("")

    document.querySelectorAll(".edit-user-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation()
        const userId = btn.dataset.userId
        openEditUserModal(userId)
      })
    })

    document.querySelectorAll(".debit-user-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation()
        const userId = btn.dataset.userId
        openDebitUserModal(userId)
      })
    })
  } catch (error) {
    console.error("[v0] Error loading users:", error)
    usersList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i class="fas fa-exclamation-triangle"></i></div>
        <div class="empty-title">Error loading users</div>
        <div class="empty-description">${error.message}</div>
      </div>
    `
  }
}

function setupEventListeners() {
  const themeToggleBtn = document.getElementById("themeToggleBtn")
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", toggleTheme)
  }

  const hideBalanceBtn = document.getElementById("hideBalanceBtn")
  if (hideBalanceBtn) {
    hideBalanceBtn.addEventListener("click", toggleBalanceVisibility)
  }

  document.getElementById("fundUserBtn").addEventListener("click", () => openModal("fundUserModal"))
  document.getElementById("addUserBtn").addEventListener("click", () => openModal("addUserModal"))
  document.getElementById("viewTransactionsBtn").addEventListener("click", () => switchTab("transactions"))
  document.getElementById("debitUserBtn").addEventListener("click", () => {
    // Open debit modal without pre-selecting a user
    openModal("debitUserModal")
  })
  document.getElementById("settingsBtn").addEventListener("click", () => {
    showToast("Settings coming soon", "info")
  })

  document.getElementById("closeFundUserModal").addEventListener("click", closeModals)
  document.getElementById("closeAddUserModal").addEventListener("click", closeModals)
  document.getElementById("closeEditUserModal").addEventListener("click", closeModals)
  document.getElementById("closeDebitUserModal").addEventListener("click", closeModals)
  document.getElementById("overlay").addEventListener("click", closeModals)

  document.getElementById("fundUserForm").addEventListener("submit", handleFundUser)
  document.getElementById("addUserForm").addEventListener("submit", handleAddUser)
  document.getElementById("editUserForm").addEventListener("submit", handleEditUser)
  document.getElementById("deleteUserBtn").addEventListener("click", handleDeleteUser)
  document.getElementById("debitUserForm").addEventListener("submit", handleDebitUser)

  document.getElementById("userSearch").addEventListener("input", (e) => filterUsers(e.target.value))
}

function setupMenu() {
  const menuBtn = document.getElementById("menuBtn")
  const closeMenuBtn = document.getElementById("closeMenuBtn")
  const hamburgerMenu = document.getElementById("hamburgerMenu")
  const overlay = document.getElementById("overlay")
  const logoutMenuItem = document.getElementById("logoutMenuItem")

  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      hamburgerMenu.classList.add("active")
      overlay.classList.add("active")
    })
  }

  if (closeMenuBtn) {
    closeMenuBtn.addEventListener("click", closeMenu)
  }

  if (logoutMenuItem) {
    logoutMenuItem.addEventListener("click", logout)
  }
}

function setupTabs() {
  const tabBtns = document.querySelectorAll("[data-tab]")
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab
      switchTab(tab)
    })
  })
}

function switchTab(tabName) {
  const tabBtns = document.querySelectorAll("[data-tab]")
  tabBtns.forEach((btn) => {
    if (btn.dataset.tab === tabName) {
      btn.classList.add("active")
    } else {
      btn.classList.remove("active")
    }
  })

  const tabContents = document.querySelectorAll(".tab-content")
  tabContents.forEach((content) => {
    content.classList.remove("active")
  })

  const activeTab = document.getElementById(`${tabName}-tab`)
  if (activeTab) {
    activeTab.classList.add("active")
  }

  if (tabName === "users") {
    loadUsers()
  } else if (tabName === "transactions") {
    loadTransactions()
  } else if (tabName === "wallets") {
    loadWallets()
  }
}

async function loadTransactions() {
  const transactionsList = document.getElementById("adminTransactionsList")

  try {
    const token = localStorage.getItem("token")
    const response = await fetch("/api/transactions", {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await response.json()

    if (!data.success) {
      throw new Error(data.message)
    }

    const transactions = data.transactions || []

    if (transactions.length === 0) {
      transactionsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"><i class="fas fa-exchange-alt"></i></div>
          <div class="empty-title">No transactions yet</div>
        </div>
      `
      return
    }

    transactionsList.innerHTML = transactions
      .map(
        (tx) => `
      <div class="card mb-3">
        <div class="card-body">
          <div class="flex items-center justify-between">
            <div>
              <div class="font-semibold mb-1">${tx.from} → ${tx.to}</div>
              <div class="text-xs text-secondary">${tx.type} • ${new Date(tx.date).toLocaleDateString()}</div>
            </div>
            <div class="text-right">
              <div class="font-semibold">${formatNumber(tx.amount)}</div>
              <div class="text-xs" style="color: ${tx.type === "received" ? "var(--success)" : "var(--danger)"};">
                ${tx.type === "received" ? "+" : "-"}${formatNumber(tx.amount)}
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
      )
      .join("")
  } catch (error) {
    console.error("[v0] Error loading transactions:", error)
    transactionsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i class="fas fa-exclamation-triangle"></i></div>
        <div class="empty-title">Error loading transactions</div>
      </div>
    `
  }
}

function loadWallets() {
  const walletsList = document.getElementById("adminWalletsList")

  walletsList.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon"><i class="fas fa-wallet"></i></div>
      <div class="empty-title">Wallet management</div>
      <div class="empty-description">View and manage user wallets</div>
    </div>
  `
}

async function handleFundUser(e) {
  e.preventDefault()

  const email = document.getElementById("recipientEmail").value
  const token = document.getElementById("tokenType").value
  const amount = Number.parseFloat(document.getElementById("fundAmount").value)
  const fundType = document.getElementById("fundType").value // "wallet" or "main"

  try {
    const authToken = localStorage.getItem("token")
    const endpoint = fundType === "main" ? "/api/admin/fund-main-account" : "/api/admin/fund-user"

    // First, get the user's wallet address
    const usersResponse = await fetch("/api/admin/users", {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    const usersData = await usersResponse.json()
    const user = usersData.users.find((u) => u.email === email)

    if (!user) {
      showToast("User not found", "error")
      return
    }

    const recipientAddress = fundType === "main" ? user.mainWalletAddress : user[`${token.toLowerCase()}WalletAddress`]

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        recipientAddress,
        amount,
        tokenType: token,
      }),
    })

    const data = await response.json()

    if (data.success) {
      showToast(`Successfully funded ${amount} ${token} to ${email}`, "success")
      closeModals()
      loadUsers()
      loadAdminStats()
      document.getElementById("fundUserForm").reset()
    } else {
      showToast(data.message || "Failed to fund user", "error")
    }
  } catch (error) {
    console.error("[v0] Error funding user:", error)
    showToast("Error funding user", "error")
  }
}

async function handleAddUser(e) {
  e.preventDefault()

  const name = document.getElementById("newUserName").value
  const email = document.getElementById("newUserEmail").value
  const password = document.getElementById("newUserPassword").value
  const balance = Number.parseFloat(document.getElementById("newUserBalance").value) || 0
  const isAdmin = document.getElementById("newUserIsAdmin").checked

  try {
    const token = localStorage.getItem("token")
    const response = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        email,
        password,
        balance,
        isAdmin,
      }),
    })

    const data = await response.json()

    if (data.success) {
      showToast("User created successfully", "success")
      closeModals()
      loadUsers()
      loadAdminStats()
      document.getElementById("addUserForm").reset()
    } else {
      showToast(data.message || "Failed to create user", "error")
    }
  } catch (error) {
    console.error("[v0] Error creating user:", error)
    showToast("Error creating user", "error")
  }
}

async function handleEditUser(e) {
  e.preventDefault()

  const userId = document.getElementById("editUserId").value
  const name = document.getElementById("editUserName").value
  const email = document.getElementById("editUserEmail").value
  const balance = Number.parseFloat(document.getElementById("editUserBalance").value) || 0
  const isAdmin = document.getElementById("editUserIsAdmin").checked
  const isUpgraded = document.getElementById("editUserIsUpgraded").checked
  const isBanned = document.getElementById("editUserIsBanned").checked

  try {
    const token = localStorage.getItem("token")
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        email,
        balance,
        isAdmin,
        isUpgraded,
        isBanned,
      }),
    })

    const data = await response.json()

    if (data.success) {
      showToast("User updated successfully", "success")
      closeModals()
      loadUsers()
    } else {
      showToast(data.message || "Failed to update user", "error")
    }
  } catch (error) {
    console.error("[v0] Error updating user:", error)
    showToast("Error updating user", "error")
  }
}

async function handleDeleteUser() {
  const userId = document.getElementById("editUserId").value

  if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
    return
  }

  try {
    const token = localStorage.getItem("token")
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await response.json()

    if (data.success) {
      showToast("User deleted successfully", "success")
      closeModals()
      loadUsers()
      loadAdminStats()
    } else {
      showToast(data.message || "Failed to delete user", "error")
    }
  } catch (error) {
    console.error("[v0] Error deleting user:", error)
    showToast("Error deleting user", "error")
  }
}

async function handleDebitUser(e) {
  e.preventDefault()

  const userId = document.getElementById("debitUserId").value
  const amount = Number.parseFloat(document.getElementById("debitAmount").value)
  const tokenType = document.getElementById("debitTokenType").value

  if (amount <= 0) {
    showToast("Amount must be greater than 0", "error")
    return
  }

  try {
    const token = localStorage.getItem("token")
    const response = await fetch("/api/admin/debit-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId,
        amount,
        tokenType,
      }),
    })

    const data = await response.json()

    if (data.success) {
      showToast(`Successfully debited ${amount} ${tokenType} from user`, "success")
      closeModals()
      loadUsers()
    } else {
      showToast(data.message || "Failed to debit user", "error")
    }
  } catch (error) {
    console.error("[v0] Error debiting user:", error)
    showToast("Error debiting user", "error")
  }
}

function openModal(modalId) {
  document.getElementById(modalId).classList.add("active")
  document.getElementById("overlay").classList.add("active")
}

function closeModals() {
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.classList.remove("active")
  })
  document.getElementById("overlay").classList.remove("active")
}

function closeMenu() {
  document.getElementById("hamburgerMenu").classList.remove("active")
  document.getElementById("overlay").classList.remove("active")
}

function toggleTheme() {
  document.body.classList.toggle("light-mode")
  const isLightMode = document.body.classList.contains("light-mode")
  localStorage.setItem("darkMode", !isLightMode)

  const themeIcon = document.querySelector("#themeToggleBtn i")
  if (themeIcon) {
    themeIcon.className = isLightMode ? "fas fa-sun" : "fas fa-moon"
  }
}

function toggleBalanceVisibility() {
  const balanceAmount = document.getElementById("adminBalanceAmount")
  const toggleBtn = document.getElementById("hideBalanceBtn")
  const icon = toggleBtn.querySelector("i")

  const isHidden = balanceAmount.style.filter === "blur(8px)"

  if (isHidden) {
    balanceAmount.style.filter = "none"
    icon.className = "fas fa-eye"
  } else {
    balanceAmount.style.filter = "blur(8px)"
    icon.className = "fas fa-eye-slash"
  }
}

function logout() {
  localStorage.removeItem("currentUser")
  localStorage.removeItem("token")
  window.location.href = "index.html"
}

function formatNumber(num) {
  if (num === undefined || num === null) return "0.00"
  const number = Number.parseFloat(num)
  if (number === 0) return "0.00"
  if (number < 0.01) return number.toFixed(8)
  if (number < 1) return number.toFixed(4)
  return number.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function showToast(message, type = "info") {
  const toast = document.createElement("div")
  toast.className = `toast toast-${type}`
  toast.innerHTML = `
    <div class="flex items-center gap-3">
      <i class="fas fa-${type === "success" ? "check-circle" : type === "error" ? "exclamation-circle" : "info-circle"}"></i>
      <span>${message}</span>
    </div>
  `

  document.body.appendChild(toast)

  setTimeout(() => {
    toast.style.animation = "slideInRight 0.3s ease-out reverse"
    setTimeout(() => {
      document.body.removeChild(toast)
    }, 300)
  }, 3000)
}

async function openEditUserModal(userId) {
  try {
    const token = localStorage.getItem("token")
    const response = await fetch("/api/admin/users", {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await response.json()
    const user = data.users.find((u) => u.id === userId)

    if (!user) return

    document.getElementById("editUserId").value = user.id
    document.getElementById("editUserName").value = user.name
    document.getElementById("editUserEmail").value = user.email
    document.getElementById("editUserBalance").value = user.balance || 0
    document.getElementById("editUserIsAdmin").checked = user.isAdmin || false
    document.getElementById("editUserIsUpgraded").checked = user.isUpgraded || false
    document.getElementById("editUserIsBanned").checked = user.isBanned || false

    openModal("editUserModal")
  } catch (error) {
    console.error("[v0] Error opening edit modal:", error)
    showToast("Error loading user data", "error")
  }
}

async function openDebitUserModal(userId) {
  try {
    const token = localStorage.getItem("token")
    const response = await fetch("/api/admin/users", {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await response.json()
    const user = data.users.find((u) => u.id === userId)

    if (!user) return

    document.getElementById("debitUserId").value = user.id
    document.getElementById("debitUserNameDisplay").textContent = user.name

    openModal("debitUserModal")
  } catch (error) {
    console.error("[v0] Error opening debit modal:", error)
    showToast("Error loading user data", "error")
  }
}

async function filterUsers(searchTerm) {
  try {
    const token = localStorage.getItem("token")
    const response = await fetch("/api/admin/users", {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await response.json()
    const users = data.users || []

    const filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    const usersList = document.getElementById("usersList")

    if (filtered.length === 0) {
      usersList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"><i class="fas fa-search"></i></div>
          <div class="empty-description">No users found</div>
        </div>
      `
      return
    }

    usersList.innerHTML = filtered
      .map(
        (user) => `
      <div class="card mb-3 user-card ${user.isBanned ? "banned-user" : ""}" data-user-id="${user.id}">
        <div class="card-body">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3 flex-1">
              <div style="width: 48px; height: 48px; background: var(--primary-bg); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-weight: 700; color: var(--primary);">
                ${user.name.charAt(0).toUpperCase()}
              </div>
              <div class="flex-1">
                <div class="font-semibold mb-1">
                  ${user.name}
                  ${user.isAdmin ? '<span class="badge badge-danger ml-2">Admin</span>' : ""}
                  ${user.isUpgraded ? '<span class="badge badge-success ml-2">Upgraded</span>' : '<span class="badge badge-warning ml-2">Basic</span>'}
                  ${user.isBanned ? '<span class="badge badge-danger ml-2">Banned</span>' : ""}
                </div>
                <div class="text-xs text-secondary">${user.email}</div>
                <div class="text-xs text-secondary mt-1">Balance: $${formatNumber(user.balance || 0)}</div>
              </div>
            </div>
            <div class="flex gap-2">
              <button class="btn btn-sm btn-ghost debit-user-btn" data-user-id="${user.id}" title="Debit User">
                <i class="fas fa-minus-circle"></i>
              </button>
              <button class="btn btn-sm btn-ghost edit-user-btn" data-user-id="${user.id}" title="Edit User">
                <i class="fas fa-edit"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `,
      )
      .join("")

    document.querySelectorAll(".edit-user-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation()
        const userId = btn.dataset.userId
        openEditUserModal(userId)
      })
    })

    document.querySelectorAll(".debit-user-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation()
        const userId = btn.dataset.userId
        openDebitUserModal(userId)
      })
    })
  } catch (error) {
    console.error("[v0] Error filtering users:", error)
  }
}
