document.addEventListener("DOMContentLoaded", () => {
  // Check authentication
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  const token = localStorage.getItem("token")

  if (!currentUser || !token) {
    window.location.href = "index.html"
    return
  }

  // Initialize theme
  const isDarkMode = localStorage.getItem("darkMode") !== "false"
  if (!isDarkMode) {
    document.body.classList.add("light-mode")
  }

  // Load markets
  loadMarkets("hot")

  // Setup event listeners
  setupEventListeners()
})

function setupEventListeners() {
  // Search toggle
  const searchBtn = document.getElementById("searchBtn")
  const searchBar = document.getElementById("searchBar")
  const searchInput = document.getElementById("searchInput")

  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      searchBar.classList.toggle("hidden")
      if (!searchBar.classList.contains("hidden")) {
        searchInput.focus()
      }
    })
  }

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      filterMarkets(e.target.value)
    })
  }

  // Filter tabs
  const filterBtns = document.querySelectorAll("[data-filter]")
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"))
      btn.classList.add("active")
      loadMarkets(btn.dataset.filter)
    })
  })

  // Star button
  const starBtn = document.getElementById("starBtn")
  if (starBtn) {
    starBtn.addEventListener("click", () => {
      const icon = starBtn.querySelector("i")
      icon.classList.toggle("far")
      icon.classList.toggle("fas")
    })
  }
}

function loadMarkets(filter = "hot") {
  const marketList = document.getElementById("marketList")
  if (!marketList) return

  // Show loading
  marketList.innerHTML =
    '<div class="loading-container"><div class="spinner spinner-lg"></div><div class="loading-text">Loading markets...</div></div>'

  // Mock market data
  let markets = [
    { symbol: "BTC/USDT", name: "Bitcoin", price: 85143.49, change: 3.2, volume: "2.5B", icon: "img/btc.png" },
    { symbol: "ETH/USDT", name: "Ethereum", price: 1902.43, change: 4.35, volume: "1.8B", icon: "img/eth.png" },
    { symbol: "BNB/USDT", name: "BNB", price: 610.38, change: 0.73, volume: "890M", icon: "img/bnb.png" },
    { symbol: "SOL/USDT", name: "Solana", price: 126.54, change: 1.41, volume: "650M", icon: "img/sol.png" },
    { symbol: "XRP/USDT", name: "Ripple", price: 0.52, change: -1.2, volume: "420M", icon: "img/placeholder.png" },
    { symbol: "ADA/USDT", name: "Cardano", price: 0.38, change: 2.1, volume: "310M", icon: "img/placeholder.png" },
    { symbol: "DOGE/USDT", name: "Dogecoin", price: 0.08, change: -0.5, volume: "280M", icon: "img/placeholder.png" },
    { symbol: "TRX/USDT", name: "Tron", price: 0.25, change: 1.8, volume: "220M", icon: "img/trx.png" },
    { symbol: "MATIC/USDT", name: "Polygon", price: 0.89, change: -2.3, volume: "190M", icon: "img/pol.png" },
    { symbol: "DOT/USDT", name: "Polkadot", price: 6.42, change: 3.7, volume: "170M", icon: "img/placeholder.png" },
  ]

  // Apply filter
  if (filter === "gainers") {
    markets = markets.filter((m) => m.change > 0).sort((a, b) => b.change - a.change)
  } else if (filter === "losers") {
    markets = markets.filter((m) => m.change < 0).sort((a, b) => a.change - b.change)
  } else if (filter === "favorites") {
    const favorites = JSON.parse(localStorage.getItem("favoriteMarkets") || "[]")
    markets = markets.filter((m) => favorites.includes(m.symbol))
  }

  // Render markets
  setTimeout(() => {
    if (markets.length === 0) {
      marketList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"><i class="fas fa-star"></i></div>
          <div class="empty-title">No favorites yet</div>
          <div class="empty-description">Tap the star icon on any market to add it to your favorites</div>
        </div>
      `
      return
    }

    marketList.innerHTML = markets
      .map(
        (market) => `
      <div class="token-item fade-in" onclick="window.location.href='spot-trading.html?pair=${market.symbol}'" style="margin: 0 var(--spacing-md) var(--spacing-sm);">
        <div class="token-left">
          <div class="token-icon">
            <img src="${market.icon}" alt="${market.symbol}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2740%27 height=%2740%27 viewBox=%270 0 40 40%27%3E%3Ccircle cx=%2720%27 cy=%2720%27 r=%2720%27 fill=%27%23F0B90B%27/%3E%3C/svg%3E'">
          </div>
          <div class="token-info">
            <div class="token-name">${market.symbol}</div>
            <div class="token-symbol">${market.name}</div>
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
  }, 500)
}

function filterMarkets(searchTerm) {
  const items = document.querySelectorAll(".token-item")
  const term = searchTerm.toLowerCase()

  items.forEach((item) => {
    const text = item.textContent.toLowerCase()
    if (text.includes(term)) {
      item.style.display = ""
    } else {
      item.style.display = "none"
    }
  })
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
