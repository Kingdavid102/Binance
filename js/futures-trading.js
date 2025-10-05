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

  // Initialize
  loadUserBalance()
  setupEventListeners()
  drawSimpleChart()

  // Auto-update price every 3 seconds
  setInterval(updatePrice, 3000)
})

let currentMode = "long"
let currentOrderType = "limit"
let currentLeverage = 10

function loadUserBalance() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  const balance = currentUser.balance || 0
  document.getElementById("availableMargin").textContent = `${formatNumber(balance)} USDT`
}

function setupEventListeners() {
  // Long/Short tabs
  const longTab = document.getElementById("longTab")
  const shortTab = document.getElementById("shortTab")

  longTab.addEventListener("click", () => {
    currentMode = "long"
    longTab.classList.add("active", "btn-success")
    longTab.classList.remove("btn-ghost")
    shortTab.classList.remove("active", "btn-danger")
    shortTab.classList.add("btn-ghost")
    updateSubmitButton()
  })

  shortTab.addEventListener("click", () => {
    currentMode = "short"
    shortTab.classList.add("active", "btn-danger")
    shortTab.classList.remove("btn-ghost")
    longTab.classList.remove("active", "btn-success")
    longTab.classList.add("btn-ghost")
    updateSubmitButton()
  })

  // Order type buttons
  const orderTypeBtns = document.querySelectorAll("[data-order-type]")
  orderTypeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      orderTypeBtns.forEach((b) => b.classList.remove("active"))
      btn.classList.add("active")
      currentOrderType = btn.dataset.orderType

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
      calculateSizeByPercent(percent)
    })
  })

  // Leverage slider
  const leverageSlider = document.getElementById("leverageSlider")
  const leverageValue = document.getElementById("leverageValue")

  leverageSlider.addEventListener("input", (e) => {
    currentLeverage = Number.parseInt(e.target.value)
    leverageValue.textContent = `${currentLeverage}x`
    calculateCost()
  })

  // Input calculations
  const priceInput = document.getElementById("priceInput")
  const sizeInput = document.getElementById("sizeInput")

  priceInput.addEventListener("input", calculateCost)
  sizeInput.addEventListener("input", calculateCost)

  // Submit order
  const submitBtn = document.getElementById("submitOrderBtn")
  submitBtn.addEventListener("click", submitOrder)

  // Leverage modal
  const leverageBtn = document.getElementById("leverageBtn")
  const leverageModal = document.getElementById("leverageModal")
  const closeLeverageModal = document.getElementById("closeLeverageModal")
  const overlay = document.getElementById("overlay")
  const modalLeverageSlider = document.getElementById("modalLeverageSlider")
  const modalLeverageValue = document.getElementById("modalLeverageValue")
  const confirmLeverageBtn = document.getElementById("confirmLeverageBtn")

  leverageBtn.addEventListener("click", () => {
    leverageModal.classList.add("active")
    overlay.classList.add("active")
    modalLeverageSlider.value = currentLeverage
    modalLeverageValue.textContent = `${currentLeverage}x`
  })

  closeLeverageModal.addEventListener("click", closeLeverageModalFn)
  overlay.addEventListener("click", closeLeverageModalFn)

  modalLeverageSlider.addEventListener("input", (e) => {
    modalLeverageValue.textContent = `${e.target.value}x`
  })

  confirmLeverageBtn.addEventListener("click", () => {
    currentLeverage = Number.parseInt(modalLeverageSlider.value)
    leverageValue.textContent = `${currentLeverage}x`
    leverageSlider.value = currentLeverage
    calculateCost()
    closeLeverageModalFn()
    showToast(`Leverage set to ${currentLeverage}x`, "success")
  })

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

function closeLeverageModalFn() {
  document.getElementById("leverageModal").classList.remove("active")
  document.getElementById("overlay").classList.remove("active")
}

function calculateCost() {
  const price = Number.parseFloat(document.getElementById("priceInput").value) || 0
  const size = Number.parseFloat(document.getElementById("sizeInput").value) || 0
  const cost = (price * size) / currentLeverage
  document.getElementById("costInput").value = cost.toFixed(2)
}

function calculateSizeByPercent(percent) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  const balance = Number.parseFloat(currentUser.balance) || 0
  const price = Number.parseFloat(document.getElementById("priceInput").value) || 0

  if (price > 0) {
    const margin = (balance * percent) / 100
    const size = (margin * currentLeverage) / price
    document.getElementById("sizeInput").value = size.toFixed(8)
    calculateCost()
  }
}

function updateSubmitButton() {
  const submitBtn = document.getElementById("submitOrderBtn")

  if (currentMode === "long") {
    submitBtn.className = "btn btn-success w-full"
    submitBtn.innerHTML = '<i class="fas fa-arrow-up"></i> Open Long'
  } else {
    submitBtn.className = "btn btn-danger w-full"
    submitBtn.innerHTML = '<i class="fas fa-arrow-down"></i> Open Short'
  }
}

function submitOrder() {
  const size = Number.parseFloat(document.getElementById("sizeInput").value)
  const price = Number.parseFloat(document.getElementById("priceInput").value)
  const cost = Number.parseFloat(document.getElementById("costInput").value)

  if (!size || size <= 0) {
    showToast("Please enter a valid size", "error")
    return
  }

  if (currentOrderType !== "market" && (!price || price <= 0)) {
    showToast("Please enter a valid price", "error")
    return
  }

  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  const balance = Number.parseFloat(currentUser.balance) || 0

  if (cost > balance) {
    showToast("Insufficient margin", "error")
    return
  }

  // Show loading
  const submitBtn = document.getElementById("submitOrderBtn")
  const originalText = submitBtn.innerHTML
  submitBtn.innerHTML = '<div class="spinner"></div> Processing...'
  submitBtn.disabled = true

  // Simulate order submission
  setTimeout(() => {
    showToast(`${currentMode === "long" ? "Long" : "Short"} position opened successfully!`, "success")

    // Reset form
    document.getElementById("sizeInput").value = ""
    document.getElementById("costInput").value = ""

    submitBtn.innerHTML = originalText
    submitBtn.disabled = false
  }, 1500)
}

function updatePrice() {
  const currentPrice = Number.parseFloat(document.getElementById("currentPrice").textContent.replace(/[$,]/g, ""))
  const change = (Math.random() - 0.5) * 100
  const newPrice = currentPrice + change

  document.getElementById("currentPrice").textContent = `$${formatNumber(newPrice)}`
  document.getElementById("markPrice").textContent = `$${formatNumber(newPrice - 3.37)}`

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

  canvas.width = canvas.offsetWidth
  canvas.height = canvas.offsetHeight

  const dataPoints = 50
  const data = []
  let price = 85000

  for (let i = 0; i < dataPoints; i++) {
    price += (Math.random() - 0.48) * 500
    data.push(price)
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min

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
