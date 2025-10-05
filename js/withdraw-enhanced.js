document.addEventListener("DOMContentLoaded", () => {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  const token = localStorage.getItem("token")

  if (!currentUser || !token) {
    window.location.href = "login.html"
    return
  }

  // Check if user account is upgraded
  const isUpgraded = currentUser.isUpgraded || false

  const upgradeNotice = document.getElementById("upgradeNotice")
  const withdrawForm = document.getElementById("withdrawForm")

  if (!isUpgraded) {
    upgradeNotice.classList.remove("hidden")
    withdrawForm.classList.add("hidden")
  } else {
    upgradeNotice.classList.add("hidden")
    withdrawForm.classList.remove("hidden")
    initializeWithdraw()
  }
})

function initializeWithdraw() {
  const cryptoSelect = document.getElementById("cryptoSelect")
  const withdrawAmount = document.getElementById("withdrawAmount")
  const maxBtn = document.getElementById("maxBtn")
  const withdrawalForm = document.getElementById("withdrawalForm")

  let selectedCrypto = ""
  let availableBalance = 0

  cryptoSelect.addEventListener("change", (e) => {
    selectedCrypto = e.target.value
    if (selectedCrypto) {
      loadBalance(selectedCrypto)
      document.getElementById("selectedCryptoSymbol").textContent = selectedCrypto
      document.getElementById("feeCryptoSymbol").textContent = selectedCrypto
      document.getElementById("minWithdrawCrypto").textContent = selectedCrypto
    }
  })

  withdrawAmount.addEventListener("input", calculateReceiveAmount)

  maxBtn.addEventListener("click", () => {
    withdrawAmount.value = availableBalance
    calculateReceiveAmount()
  })

  withdrawalForm.addEventListener("submit", handleWithdraw)

  function loadBalance(crypto) {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"))
    const balanceField = `${crypto.toLowerCase()}Balance`
    availableBalance = currentUser[balanceField] || 0
    document.getElementById("availableBalance").textContent = formatNumber(availableBalance)
  }

  function calculateReceiveAmount() {
    const amount = Number.parseFloat(withdrawAmount.value) || 0
    const fee = 0.0001 // Mock fee
    const receiveAmount = Math.max(0, amount - fee)
    document.getElementById("receiveAmount").textContent = formatNumber(receiveAmount)
  }

  async function handleWithdraw(e) {
    e.preventDefault()

    const address = document.getElementById("withdrawAddress").value
    const amount = Number.parseFloat(withdrawAmount.value)

    if (!selectedCrypto) {
      showToast("Please select a cryptocurrency", "error")
      return
    }

    if (amount <= 0) {
      showToast("Please enter a valid amount", "error")
      return
    }

    if (amount > availableBalance) {
      showToast("Insufficient balance", "error")
      return
    }

    // Simulate withdrawal
    showToast("Withdrawal request submitted successfully", "success")
    setTimeout(() => {
      window.location.href = "dashboard.html"
    }, 2000)
  }
}

function formatNumber(num) {
  if (num === undefined || num === null) return "0.00"
  const number = Number.parseFloat(num)
  if (number === 0) return "0.00"
  if (number < 0.00000001) return number.toFixed(8)
  if (number < 0.01) return number.toFixed(6)
  if (number < 1) return number.toFixed(4)
  return number.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
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
