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

  // Get trading pair from URL
  const urlParams = new URLSearchParams(window.location.search)
  const pair = urlParams.get("pair") || "BTC/USDT"

  // Initialize trading interface
  initializeTradingPair(pair)
  loadUserBalance()
  setupEventListeners()
  drawSimpleChart()

  // Auto-update price every 3 seconds
  setInterval(updatePrice, 3000)
})

let currentMode = "buy"
let currentOrderType = "limit"

function initializeTradingPair(pair) {
  document.getElementById("tradingPair").textContent = pair

  // Mock price data
  const prices = {
    "BTC/USDT": 85143.49,
    "ETH/USDT": 1902.43,
    "BNB/USDT": 610.38,
    "SOL/USDT": 126.54,
  }

  const price = prices[pair] || 85143.49
  document.getElementById("pairPrice").textContent = `$${formatNumber(price)}`
  document.getElementById("currentPrice").textContent = `$${formatNumber(price)}`
  document.getElementById("priceInput").value = price
}

function loadUserBalance() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  const balance = currentUser.balance || 0
  document.getElementById("availableBalance").textContent = `${formatNumber(balance)} USDT`
}

function setupEventListeners() {
  // Buy/Sell tabs
  const buyTab = document.getElementById("buyTab")
  const sellTab = document.getElementById("sellTab")

  buyTab.addEventListener("click", () => {
    currentMode = "buy"
    buyTab.classList.add("active", "btn-success")
    buyTab.classList.remove("btn-ghost")
    sellTab.classList.remove("active", "btn-danger")
    sellTab.classList.add("btn-ghost")
    updateSubmitButton()
  })

  sellTab.addEventListener("click", () => {
    currentMode = "sell"
    sellTab.classList.add("active", "btn-danger")
    sellTab.classList.remove("btn-ghost")
    buyTab.classList.remove("active", "btn-success")
    buyTab.classList.add("btn-ghost")
    updateSubmitButton()
  })

  // Order type buttons
  const orderTypeBtns = document.querySelectorAll("[data-order-type]")
  orderTypeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      orderTypeBtns.forEach((b) => b.classList.remove("active"))
      btn.classList.add("active")
      currentOrderType = btn.dataset.orderType

      // Hide/show price input for market orders
      const priceInput = document.getElementById("priceInput").parentElement.parentElement
      if (currentOrderType === "market") {
        priceInput.style.display = "none"
      } else {
        priceInput.style.display = "block"
      }
    })
  })

  // Percentage buttons
  const percentBtns = document.querySelectorAll("[data-percent]")
  percentBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const percent = Number.parseInt(btn.dataset.percent)
      calculateAmountByPercent(percent)
    })
  })

  // Input calculations
  const priceInput = document.getElementById("priceInput")
  const amountInput = document.getElementById("amountInput")
  const totalInput = document.getElementById("totalInput")

  priceInput.addEventListener("input", calculateTotal)
  amountInput.addEventListener("input", calculateTotal)
  totalInput.addEventListener("input", calculateFromTotal)

  // Submit order
  const submitBtn = document.getElementById("submitOrderBtn")
  submitBtn.addEventListener("click", submitOrder)

  // Favorite button
  const favoriteBtn = document.getElementById("favoriteBtn")
  favoriteBtn.addEventListener("click", toggleFavorite)

  // Timeframe buttons
  const timeframeBtns = document.querySelectorAll("[data-timeframe]")
  timeframeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      timeframeBtns.forEach((b) => b.classList.remove("active"))
      btn.classList.add("active")
      drawSimpleChart()
    })
  })
}

function calculateTotal() {
  const price = Number.parseFloat(document.getElementById("priceInput").value) || 0
  const amount = Number.parseFloat(document.getElementById("amountInput").value) || 0
  const total = price * amount
  document.getElementById("totalInput").value = total.toFixed(2)
}

function calculateFromTotal() {
  const price = Number.parseFloat(document.getElementById("priceInput").value) || 0
  const total = Number.parseFloat(document.getElementById("totalInput").value) || 0
  if (price > 0) {
    const amount = total / price
    document.getElementById("amountInput").value = amount.toFixed(8)
  }
}

function calculateAmountByPercent(percent) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  const balance = Number.parseFloat(currentUser.balance) || 0
  const price = Number.parseFloat(document.getElementById("priceInput").value) || 0

  if (price > 0) {
    const availableAmount = (balance * percent) / 100
    const amount = availableAmount / price
    document.getElementById("amountInput").value = amount.toFixed(8)
    calculateTotal()
  }
}

function updateSubmitButton() {
  const submitBtn = document.getElementById("submitOrderBtn")
  const pair = document.getElementById("tradingPair").textContent
  const baseCurrency = pair.split("/")[0]

  if (currentMode === "buy") {
    submitBtn.className = "btn btn-success w-full"
    submitBtn.innerHTML = `<i class="fas fa-check-circle"></i> Buy ${baseCurrency}`
  } else {
    submitBtn.className = "btn btn-danger w-full"
    submitBtn.innerHTML = `<i class="fas fa-times-circle"></i> Sell ${baseCurrency}`
  }
}

function submitOrder() {
  const amount = Number.parseFloat(document.getElementById("amountInput").value)
  const price = Number.parseFloat(document.getElementById("priceInput").value)
  const total = Number.parseFloat(document.getElementById("totalInput").value)

  if (!amount || amount <= 0) {
    showToast("Please enter a valid amount", "error")
    return
  }

  if (currentOrderType !== "market" && (!price || price <= 0)) {
    showToast("Please enter a valid price", "error")
    return
  }

  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  const balance = Number.parseFloat(currentUser.balance) || 0

  if (currentMode === "buy" && total > balance) {
    showToast("Insufficient balance", "error")
    return
  }

  // Show loading
  const submitBtn = document.getElementById("submitOrderBtn")
  const originalText = submitBtn.innerHTML
  submitBtn.innerHTML = '<div class="spinner"></div> Processing...'
  submitBtn.disabled = true

  // Simulate order submission
  setTimeout(() => {
    showToast(`${currentMode === "buy" ? "Buy" : "Sell"} order placed successfully!`, "success")

    // Reset form
    document.getElementById("amountInput").value = ""
    document.getElementById("totalInput").value = ""

    submitBtn.innerHTML = originalText
    submitBtn.disabled = false

    // Update balance (mock)
    if (currentMode === "buy") {
      currentUser.balance = balance - total
      localStorage.setItem("currentUser", JSON.stringify(currentUser))
      loadUserBalance()
    }
  }, 1500)
}

function toggleFavorite() {
  const favoriteBtn = document.getElementById("favoriteBtn")
  const icon = favoriteBtn.querySelector("i")
  const pair = document.getElementById("tradingPair").textContent

  const favorites = JSON.parse(localStorage.getItem("favoriteMarkets") || "[]")
  const index = favorites.indexOf(pair)

  if (index > -1) {
    favorites.splice(index, 1)
    icon.className = "far fa-star"
    showToast("Removed from favorites", "info")
  } else {
    favorites.push(pair)
    icon.className = "fas fa-star"
    showToast("Added to favorites", "success")
  }

  localStorage.setItem("favoriteMarkets", JSON.stringify(favorites))
}

function updatePrice() {
  const currentPrice = Number.parseFloat(document.getElementById("currentPrice").textContent.replace(/[$,]/g, ""))
  const change = (Math.random() - 0.5) * 100
  const newPrice = currentPrice + change

  document.getElementById("currentPrice").textContent = `$${formatNumber(newPrice)}`
  document.getElementById("pairPrice").textContent = `$${formatNumber(newPrice)}`

  // Update color based on change
  const priceElement = document.getElementById("currentPrice")
  if (change > 0) {
    priceElement.style.color = "var(--success)"
  } else {
    priceElement.style.color = "var(--danger)"
  }
}

function drawSimpleChart() {
  const canvas = document.getElementById("priceChart")
  const ctx = canvas.getContext("2d")

  // Set canvas size
  canvas.width = canvas.offsetWidth
  canvas.height = canvas.offsetHeight

  // Generate mock price data
  const dataPoints = 50
  const data = []
  let price = 85000

  for (let i = 0; i < dataPoints; i++) {
    price += (Math.random() - 0.48) * 500
    data.push(price)
  }

  // Find min and max
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min

  // Draw chart
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue("--success").trim()
  ctx.lineWidth = 2
  ctx.beginPath()

  data.forEach((value, index) => {
    const x = (index / (dataPoints - 1)) * canvas.width
    const y = canvas.height - ((value - min) / range) * canvas.height

    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })

  ctx.stroke()

  // Hide placeholder
  document.getElementById("chartPlaceholder").style.display = "none"
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
