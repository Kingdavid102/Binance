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
  const depositForm = document.getElementById("depositForm")

  if (!isUpgraded) {
    upgradeNotice.classList.remove("hidden")
    depositForm.classList.add("hidden")
  } else {
    upgradeNotice.classList.add("hidden")
    depositForm.classList.remove("hidden")
    initializeDeposit()
  }
})

function initializeDeposit() {
  let selectedCrypto = "BTC"

  // Load deposit address
  loadDepositAddress(selectedCrypto)

  // Crypto selector
  document.querySelectorAll(".crypto-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".crypto-option").forEach((b) => b.classList.remove("active"))
      btn.classList.add("active")
      selectedCrypto = btn.dataset.crypto
      loadDepositAddress(selectedCrypto)
      document.getElementById("selectedCrypto").textContent = selectedCrypto
      document.getElementById("minDepositCrypto").textContent = selectedCrypto
    })
  })

  // Copy address
  document.getElementById("copyAddressBtn").addEventListener("click", () => {
    const address = document.getElementById("depositAddress").textContent
    navigator.clipboard.writeText(address).then(() => {
      showToast("Address copied to clipboard", "success")
    })
  })
}

function loadDepositAddress(crypto) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  const addressField = `${crypto.toLowerCase()}WalletAddress`
  const address = currentUser[addressField] || "Address not available"

  document.getElementById("depositAddress").textContent = address
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
