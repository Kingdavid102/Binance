document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signupForm")
  const signupError = document.getElementById("signupError")
  const signupBtn = document.getElementById("signupBtn")

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const fullName = document.getElementById("fullName").value.trim()
    const email = document.getElementById("email").value.trim()
    const password = document.getElementById("password").value
    const confirmPassword = document.getElementById("confirmPassword").value

    // Clear previous errors
    signupError.textContent = ""

    // Validate inputs
    if (!fullName || !email || !password || !confirmPassword) {
      signupError.textContent = "All fields are required"
      return
    }

    if (password !== confirmPassword) {
      signupError.textContent = "Passwords do not match"
      return
    }

    if (password.length < 6) {
      signupError.textContent = "Password must be at least 6 characters"
      return
    }

    // Disable button
    signupBtn.disabled = true
    signupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...'

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email,
          password,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Store user data and token
        localStorage.setItem("currentUser", JSON.stringify(data.user))
        localStorage.setItem("token", data.token)

        // Redirect to dashboard
        window.location.href = "dashboard.html"
      } else {
        signupError.textContent = data.message || "Signup failed"
        signupBtn.disabled = false
        signupBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account'
      }
    } catch (error) {
      console.error("[v0] Signup error:", error)
      signupError.textContent = "An error occurred. Please try again."
      signupBtn.disabled = false
      signupBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account'
    }
  })
})
