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

  // Setup event listeners
  setupEventListeners()

  // Calculate security score
  calculateSecurityScore()
})

function setupEventListeners() {
  // 2FA Modal
  const enable2FABtn = document.getElementById("enable2FABtn")
  const twoFAModal = document.getElementById("twoFAModal")
  const close2FAModal = document.getElementById("close2FAModal")
  const confirm2FABtn = document.getElementById("confirm2FABtn")

  enable2FABtn.addEventListener("click", () => {
    twoFAModal.classList.add("active")
    document.getElementById("overlay").classList.add("active")
  })

  close2FAModal.addEventListener("click", closeModals)

  confirm2FABtn.addEventListener("click", () => {
    const code = document.getElementById("twoFACode").value
    if (code.length !== 6) {
      showToast("Please enter a valid 6-digit code", "error")
      return
    }

    showToast("2FA enabled successfully!", "success")
    closeModals()

    // Update UI
    enable2FABtn.textContent = "Enabled"
    enable2FABtn.classList.add("btn-success")
    enable2FABtn.disabled = true

    calculateSecurityScore()
  })

  // Change Password Modal
  const changePasswordBtn = document.getElementById("changePasswordBtn")
  const changePasswordModal = document.getElementById("changePasswordModal")
  const closePasswordModal = document.getElementById("closePasswordModal")
  const confirmPasswordBtn = document.getElementById("confirmPasswordBtn")

  changePasswordBtn.addEventListener("click", () => {
    changePasswordModal.classList.add("active")
    document.getElementById("overlay").classList.add("active")
  })

  closePasswordModal.addEventListener("click", closeModals)

  confirmPasswordBtn.addEventListener("click", () => {
    const currentPassword = document.getElementById("currentPassword").value
    const newPassword = document.getElementById("newPassword").value
    const confirmPassword = document.getElementById("confirmPassword").value

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("Please fill in all fields", "error")
      return
    }

    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error")
      return
    }

    if (newPassword.length < 8) {
      showToast("Password must be at least 8 characters", "error")
      return
    }

    showToast("Password changed successfully!", "success")
    closeModals()

    // Clear form
    document.getElementById("currentPassword").value = ""
    document.getElementById("newPassword").value = ""
    document.getElementById("confirmPassword").value = ""
  })

  // Whitelist toggle
  const whitelistToggle = document.getElementById("whitelistToggle")
  whitelistToggle.addEventListener("change", (e) => {
    if (e.target.checked) {
      showToast("Withdrawal whitelist enabled", "success")
    } else {
      showToast("Withdrawal whitelist disabled", "info")
    }
    calculateSecurityScore()
  })

  // Anti-phishing
  const antiPhishingBtn = document.getElementById("antiPhishingBtn")
  antiPhishingBtn.addEventListener("click", () => {
    showToast("Anti-phishing setup coming soon", "info")
  })

  // Overlay click
  document.getElementById("overlay").addEventListener("click", closeModals)
}

function closeModals() {
  document.getElementById("twoFAModal").classList.remove("active")
  document.getElementById("changePasswordModal").classList.remove("active")
  document.getElementById("overlay").classList.remove("active")
}

function calculateSecurityScore() {
  let score = 50 // Base score for email verification

  // Check 2FA
  const enable2FABtn = document.getElementById("enable2FABtn")
  if (enable2FABtn.disabled) {
    score += 30
  }

  // Check whitelist
  const whitelistToggle = document.getElementById("whitelistToggle")
  if (whitelistToggle.checked) {
    score += 20
  }

  // Update UI
  const securityScore = document.getElementById("securityScore")
  const securityCircle = document.getElementById("securityCircle")

  securityScore.textContent = score

  // Update circle (314 is circumference of circle with r=50)
  const offset = 314 - (314 * score) / 100
  securityCircle.style.strokeDashoffset = offset

  // Update color based on score
  let color = "var(--danger)"
  let level = "Low Security"

  if (score >= 80) {
    color = "var(--success)"
    level = "High Security"
  } else if (score >= 50) {
    color = "var(--warning)"
    level = "Medium Security"
  }

  securityCircle.style.stroke = color
  securityScore.style.color = color
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
