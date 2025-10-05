// Dashboard Enhanced JavaScript
document.addEventListener("DOMContentLoaded", () => {
  // Check authentication
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  const token = localStorage.getItem("token")

  if (!currentUser || !token) {
    window.location.href = "index.html"
    return
  }

  // Initialize theme
  initializeTheme()

  // Load user data
  loadUserData()

  // Load market data
  loadMarketData()

  // Load user tokens
  loadUserTokens()

  // Setup event listeners
  setupEventListeners()

  // Setup menu
  setupMenu()

  // Auto-refresh data every 30 seconds
  setInterval(() => {
    loadMarketData()
    refreshUserBalance()
  }, 30000)
})

function initializeTheme() {
  const isDarkMode = localStorage.getItem("darkMode") !== "false"
  if (!isDarkMode) {
    document.body.classList.add("light-mode")
    const themeIcon = document.querySelector("#themeToggleBtn i")
    if (themeIcon) themeIcon.className = "fas fa-sun"
  }
}

function loadUserData() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))

  // Update balance display
  const balanceValue = document.getElementById("balanceValue")
  const balanceUsd = document.getElementById("balanceUsd")

  if (balanceValue && currentUser.balance !== undefined) {
    const balance = Number.parseFloat(currentUser.balance) || 0
    balanceValue.textContent = formatNumber(balance)
    if (balanceUsd) {
      balanceUsd.textContent = `≈ $${formatNumber(balance)}`
    }
  }

  // Update menu user info
  const menuUserName = document.getElementById("menuUserName")
  const menuUserEmail = document.getElementById("menuUserEmail")
  const menuAvatar = document.getElementById("menuAvatar")

  if (menuUserName) menuUserName.textContent = currentUser.name || "User"
  if (menuUserEmail) menuUserEmail.textContent = currentUser.email || ""
  if (menuAvatar) {
    menuAvatar.textContent = (currentUser.name || "U").charAt(0).toUpperCase()
  }

  const adminMenuItem = document.getElementById("adminMenuItem")
  if (adminMenuItem) {
    if (currentUser.isAdmin === true) {
      adminMenuItem.classList.remove("hidden")
      // Make sure it's visible
      adminMenuItem.style.display = "flex"
    } else {
      // Hide for non-admin users
      adminMenuItem.classList.add("hidden")
      adminMenuItem.style.display = "none"
    }
  }
}

function loadMarketData() {
  const marketList = document.getElementById("marketList")
  if (!marketList) return

  // Mock market data - in production, fetch from API
  const markets = [
    { symbol: "BTC/USDT", price: 85143.49, change: 3.2, volume: "2.5B" },
    { symbol: "ETH/USDT", price: 1902.43, change: 4.35, volume: "1.8B" },
    { symbol: "BNB/USDT", price: 610.38, change: 0.73, volume: "890M" },
    { symbol: "SOL/USDT", price: 126.54, change: 1.41, volume: "650M" },
    { symbol: "XRP/USDT", price: 0.52, change: -1.2, volume: "420M" },
  ]

  marketList.innerHTML = markets
    .map(
      (market) => `
    <div class="token-item" onclick="window.location.href='spot-trading.html?pair=${market.symbol}'">
      <div class="token-left">
        <div class="token-info">
          <div class="token-name">${market.symbol}</div>
          <div class="token-symbol">Vol ${market.volume}</div>
        </div>
      </div>
      <div class="token-right">
        <div class="token-balance">$${formatNumber(market.price)}</div>
        <div class="token-change ${market.change >= 0 ? "positive" : "negative"}">
          ${market.change >= 0 ? "+" : ""}${market.change.toFixed(2)}%
        </div>
      </div>
    </div>
  `,
    )
    .join("")
}

function loadUserTokens() {
  const tokenList = document.getElementById("tokenList")
  if (!tokenList) return

  const currentUser = JSON.parse(localStorage.getItem("currentUser"))

  // Define tokens with user balances
  const tokens = [
    {
      symbol: "BTC",
      name: "Bitcoin",
      balance: currentUser.btcBalance || 0,
      price: 85143.49,
      icon: "img/btc.png",
    },
    {
      symbol: "ETH",
      name: "Ethereum",
      balance: currentUser.ethBalance || 0,
      price: 1902.43,
      icon: "img/eth.png",
    },
    {
      symbol: "BNB",
      name: "BNB",
      balance: currentUser.bnbBalance || 0,
      price: 610.38,
      icon: "img/bnb.png",
    },
    {
      symbol: "USDT",
      name: "Tether",
      balance: currentUser.usdtBalance || 0,
      price: 1.0,
      icon: "img/usdt.png",
    },
  ].filter((token) => token.balance > 0)

  if (tokens.length === 0) {
    tokenList.innerHTML = `
      <div class="empty-state" style="padding: var(--spacing-lg) 0;">
        <div class="empty-icon"><i class="fas fa-wallet"></i></div>
        <div class="empty-description">No assets yet. Deposit to get started!</div>
      </div>
    `
    return
  }

  tokenList.innerHTML = tokens
    .map((token) => {
      const value = token.balance * token.price
      return `
      <div class="token-item" onclick="window.location.href='defi-wallet.html'">
        <div class="token-left">
          <div class="token-icon">
            <img src="${token.icon}" alt="${token.symbol}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2740%27 height=%2740%27 viewBox=%270 0 40 40%27%3E%3Ccircle cx=%2720%27 cy=%2720%27 r=%2720%27 fill=%27%23F0B90B%27/%3E%3C/svg%3E'">
          </div>
          <div class="token-info">
            <div class="token-name">${token.symbol}</div>
            <div class="token-symbol">${token.name}</div>
          </div>
        </div>
        <div class="token-right">
          <div class="token-balance">${formatNumber(token.balance)}</div>
          <div class="token-symbol">≈ $${formatNumber(value)}</div>
        </div>
      </div>
    `
    })
    .join("")
}

function setupEventListeners() {
  // Theme toggle
  const themeToggleBtn = document.getElementById("themeToggleBtn")
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", toggleTheme)
  }

  // Balance visibility toggle
  const toggleBalanceBtn = document.getElementById("toggleBalanceBtn")
  if (toggleBalanceBtn) {
    toggleBalanceBtn.addEventListener("click", toggleBalanceVisibility)
  }

  // Notification button
  const notificationBtn = document.getElementById("notificationBtn")
  if (notificationBtn) {
    notificationBtn.addEventListener("click", () => {
      showToast("No new notifications", "info")
    })
  }
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

  if (overlay) {
    overlay.addEventListener("click", closeMenu)
  }

  if (logoutMenuItem) {
    logoutMenuItem.addEventListener("click", logout)
  }
}

function closeMenu() {
  const hamburgerMenu = document.getElementById("hamburgerMenu")
  const overlay = document.getElementById("overlay")

  if (hamburgerMenu) hamburgerMenu.classList.remove("active")
  if (overlay) overlay.classList.remove("active")
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
  const balanceAmount = document.getElementById("balanceAmount")
  const balanceUsd = document.getElementById("balanceUsd")
  const toggleBtn = document.getElementById("toggleBalanceBtn")
  const icon = toggleBtn.querySelector("i")

  const isHidden = balanceAmount.style.filter === "blur(8px)"

  if (isHidden) {
    balanceAmount.style.filter = "none"
    balanceUsd.style.filter = "none"
    icon.className = "fas fa-eye"
  } else {
    balanceAmount.style.filter = "blur(8px)"
    balanceUsd.style.filter = "blur(8px)"
    icon.className = "fas fa-eye-slash"
  }
}

function refreshUserBalance() {
  const token = localStorage.getItem("token")

  fetch("/api/users/profile", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        localStorage.setItem("currentUser", JSON.stringify(data.user))
        loadUserData()
        loadUserTokens()
      }
    })
    .catch((error) => {
      console.error("Error refreshing balance:", error)
    })
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
