document.addEventListener("DOMContentLoaded", () => {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  const token = localStorage.getItem("token")

  if (!currentUser || !token) {
    window.location.href = "index.html"
    return
  }

  // Token prices (you can update these from an API)
  const tokenPrices = {
    TRX: 0.066762,
    USDT: 1.0,
    USDC: 1.01,
    BNB: 610.38,
    SOL: 126.54,
    ETH: 3452.78,
    BTC: 65432.21,
    POL: 0.78,
    MAIN: 1.0,
  }

  // Token logos
  const tokenLogos = {
    TRX: "img/trx.png",
    USDT: "img/usdt.png",
    USDC: "img/usdc.png",
    BNB: "img/bnb.png",
    SOL: "img/sol.png",
    ETH: "img/eth.png",
    BTC: "img/btc.png",
    POL: "img/pol.png",
  }

  let selectedCurrency = "BTC"
  let isBalanceHidden = false

  // Initialize
  loadUserData()
  setupEventListeners()

  function setupEventListeners() {
    // Currency selector
    document.getElementById("currencySelector").addEventListener("click", () => {
      document.getElementById("currencyModal").classList.add("active")
    })

    // Currency selection
    document.querySelectorAll("#currencyModal .wallet-action-item").forEach((item) => {
      item.addEventListener("click", function () {
        selectedCurrency = this.getAttribute("data-currency")
        document.getElementById("selectedCurrency").textContent = selectedCurrency
        document.getElementById("currencyModal").classList.remove("active")
        updateBalanceDisplay()
      })
    })

    // Toggle visibility
    document.getElementById("toggleVisibility").addEventListener("click", () => {
      isBalanceHidden = !isBalanceHidden
      const icon = document.getElementById("toggleVisibility")
      icon.className = isBalanceHidden ? "far fa-eye-slash" : "far fa-eye"
      updateBalanceDisplay()
    })

    // Add Funds button
    document.getElementById("addFundsBtn").addEventListener("click", showAddFundsModal)

    // Send button
    document.getElementById("sendBtn").addEventListener("click", () => {
      window.location.href = "send.html"
    })

    // Transfer button
    document.getElementById("transferBtn").addEventListener("click", () => {
      alert("Transfer feature coming soon!")
    })

    // Tab switching
    document.getElementById("spotTab").addEventListener("click", () => {
      alert("Spot trading coming soon!")
    })

    document.getElementById("historyTab").addEventListener("click", () => {
      alert("Transaction history coming soon!")
    })

    document.getElementById("accountTab").addEventListener("click", () => {
      alert("Account view coming soon!")
    })
  }

  function loadUserData() {
    updateBalanceDisplay()
    updateWalletList()
  }

  function updateBalanceDisplay() {
    const totalBalance = calculateTotalBalance()
    const balanceInSelectedCurrency = convertToSelectedCurrency(totalBalance)

    if (currentUser.isAdmin) {
      document.getElementById("totalBalance").textContent = "∞"
      document.getElementById("totalBalanceDecimal").textContent = ""
      document.getElementById("balanceUsd").textContent = "≈ $∞"
      return
    }

    if (isBalanceHidden) {
      document.getElementById("totalBalance").textContent = "****"
      document.getElementById("totalBalanceDecimal").textContent = ""
      document.getElementById("balanceUsd").textContent = "≈ $****"
    } else {
      const [whole, decimal] = balanceInSelectedCurrency.toFixed(8).split(".")
      document.getElementById("totalBalance").textContent = whole
      document.getElementById("totalBalanceDecimal").textContent = `.${decimal}`
      document.getElementById("balanceUsd").textContent = `≈ $${formatNumber(totalBalance)}`
    }
  }

  function calculateTotalBalance() {
    let total = currentUser.balance || 0
    total += (currentUser.trxBalance || 0) * tokenPrices.TRX
    total += (currentUser.usdtBalance || 0) * tokenPrices.USDT
    total += (currentUser.usdcBalance || 0) * tokenPrices.USDC
    total += (currentUser.bnbBalance || 0) * tokenPrices.BNB
    total += (currentUser.solBalance || 0) * tokenPrices.SOL
    total += (currentUser.ethBalance || 0) * tokenPrices.ETH
    total += (currentUser.btcBalance || 0) * tokenPrices.BTC
    total += (currentUser.polBalance || 0) * tokenPrices.POL
    return total
  }

  function convertToSelectedCurrency(usdAmount) {
    if (selectedCurrency === "MAIN") return usdAmount
    return usdAmount / tokenPrices[selectedCurrency]
  }

  function updateWalletList() {
    const wallets = getWalletsWithBalance()
    const walletList = document.getElementById("walletList")
    const emptyState = document.getElementById("emptyState")

    if (wallets.length === 0) {
      emptyState.style.display = "flex"
      walletList.style.display = "none"
    } else {
      emptyState.style.display = "none"
      walletList.style.display = "block"
      walletList.innerHTML = ""

      wallets.forEach((wallet) => {
        const walletItem = createWalletItem(wallet)
        walletList.appendChild(walletItem)
      })
    }
  }

  function getWalletsWithBalance() {
    const wallets = []

    // Add main balance if > 0
    if (currentUser.balance > 0) {
      wallets.push({
        token: "MAIN",
        name: "Main Balance",
        balance: currentUser.balance,
        usdValue: currentUser.balance,
        logo: null,
      })
    }

    // Add crypto wallets if > 0
    const cryptoWallets = [
      { token: "TRX", name: "Tron", balance: currentUser.trxBalance || 0 },
      { token: "USDT", name: "Tether", balance: currentUser.usdtBalance || 0 },
      { token: "USDC", name: "USD Coin", balance: currentUser.usdcBalance || 0 },
      { token: "BNB", name: "Binance Coin", balance: currentUser.bnbBalance || 0 },
      { token: "SOL", name: "Solana", balance: currentUser.solBalance || 0 },
      { token: "ETH", name: "Ethereum", balance: currentUser.ethBalance || 0 },
      { token: "BTC", name: "Bitcoin", balance: currentUser.btcBalance || 0 },
      { token: "POL", name: "Polygon", balance: currentUser.polBalance || 0 },
    ]

    cryptoWallets.forEach((wallet) => {
      if (wallet.balance > 0) {
        wallets.push({
          token: wallet.token,
          name: wallet.name,
          balance: wallet.balance,
          usdValue: wallet.balance * tokenPrices[wallet.token],
          logo: tokenLogos[wallet.token],
        })
      }
    })

    // Sort by USD value (highest first)
    wallets.sort((a, b) => b.usdValue - a.usdValue)

    return wallets
  }

  function createWalletItem(wallet) {
    const div = document.createElement("div")
    div.className = "wallet-item"
    div.onclick = () => showWalletActions(wallet)

    const logoHtml = wallet.logo
      ? `<img src="${wallet.logo}" alt="${wallet.token}" class="wallet-icon" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'40\\' height=\\'40\\' viewBox=\\'0 0 24 24\\' fill=\\'%23F0B90B\\'><circle cx=\\'12\\' cy=\\'12\\' r=\\'10\\'/></svg>'">`
      : `<div class="wallet-icon" style="background: var(--primary-color); display: flex; align-items: center; justify-content: center;"><i class="fas fa-wallet" style="color: #000;"></i></div>`

    const balanceDisplay = currentUser.isAdmin ? "∞" : wallet.balance.toFixed(wallet.token === "MAIN" ? 2 : 8)
    const usdValueDisplay = currentUser.isAdmin ? "∞" : formatNumber(wallet.usdValue)

    div.innerHTML = `
      ${logoHtml}
      <div class="wallet-info">
        <div class="wallet-name">${wallet.name}</div>
        <div class="wallet-balance">${balanceDisplay} ${wallet.token}</div>
      </div>
      <div class="wallet-amount">
        <div class="wallet-value">$${usdValueDisplay}</div>
      </div>
    `

    return div
  }

  function showAddFundsModal() {
    const allWallets = [
      { token: "TRX", name: "Tron", balance: currentUser.trxBalance || 0 },
      { token: "USDT", name: "Tether", balance: currentUser.usdtBalance || 0 },
      { token: "USDC", name: "USD Coin", balance: currentUser.usdcBalance || 0 },
      { token: "BNB", name: "Binance Coin", balance: currentUser.bnbBalance || 0 },
      { token: "SOL", name: "Solana", balance: currentUser.solBalance || 0 },
      { token: "ETH", name: "Ethereum", balance: currentUser.ethBalance || 0 },
      { token: "BTC", name: "Bitcoin", balance: currentUser.btcBalance || 0 },
      { token: "POL", name: "Polygon", balance: currentUser.polBalance || 0 },
    ]

    const modal = document.getElementById("addFundsModal")
    const walletListContainer = document.getElementById("addFundsWalletList")

    walletListContainer.innerHTML = ""

    allWallets.forEach((wallet) => {
      const usdValue = wallet.balance * tokenPrices[wallet.token]
      const item = document.createElement("div")
      item.className = "wallet-action-item"
      item.onclick = () => {
        modal.classList.remove("active")
        showWalletActions({
          token: wallet.token,
          name: wallet.name,
          balance: wallet.balance,
          usdValue: usdValue,
          logo: tokenLogos[wallet.token],
        })
      }

      const balanceDisplay = currentUser.isAdmin ? "∞" : wallet.balance.toFixed(8)
      const usdValueDisplay = currentUser.isAdmin ? "∞" : formatNumber(usdValue)

      item.innerHTML = `
        <img src="${tokenLogos[wallet.token]}" alt="${wallet.token}" class="wallet-icon" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'40\\' height=\\'40\\' viewBox=\\'0 0 24 24\\' fill=\\'%23F0B90B\\'><circle cx=\\'12\\' cy=\\'12\\' r=\\'10\\'/></svg>'">
        <div class="wallet-action-info">
          <div class="wallet-action-title">${wallet.name}</div>
          <div class="wallet-action-desc">${balanceDisplay} ${wallet.token} • $${usdValueDisplay}</div>
        </div>
        <i class="fas fa-chevron-right" style="color: var(--text-secondary);"></i>
      `

      walletListContainer.appendChild(item)
    })

    modal.classList.add("active")
  }

  function showWalletActions(wallet) {
    const modal = document.getElementById("walletActionsModal")
    const title = document.getElementById("walletActionsTitle")
    const body = document.getElementById("walletActionsBody")

    title.textContent = `${wallet.name} Actions`
    body.innerHTML = ""

    // Receive action (always available)
    const receiveAction = createActionItem(
      "fas fa-arrow-down",
      "Receive",
      `Get ${wallet.token} address to receive funds`,
      () => {
        modal.classList.remove("active")
        window.location.href = `receive.html?token=${wallet.token}`
      },
    )
    body.appendChild(receiveAction)

    // Fund from Main action (always available)
    const fundFromMainAction = createActionItem(
      "fas fa-wallet",
      "Fund from Main",
      "Transfer from main balance to this wallet",
      () => {
        modal.classList.remove("active")
        showFundFromMainModal(wallet)
      },
    )
    body.appendChild(fundFromMainAction)

    // Send action (only if balance > 0)
    if (wallet.balance > 0) {
      const sendAction = createActionItem(
        "fas fa-arrow-up",
        "Send Coin",
        `Send ${wallet.token} to another address`,
        () => {
          modal.classList.remove("active")
          window.location.href = `send.html?token=${wallet.token}`
        },
      )
      body.appendChild(sendAction)
    }

    modal.classList.add("active")
  }

  function createActionItem(iconClass, title, description, onClick) {
    const div = document.createElement("div")
    div.className = "wallet-action-item"
    div.onclick = onClick

    div.innerHTML = `
      <div class="wallet-action-icon">
        <i class="${iconClass}"></i>
      </div>
      <div class="wallet-action-info">
        <div class="wallet-action-title">${title}</div>
        <div class="wallet-action-desc">${description}</div>
      </div>
      <i class="fas fa-chevron-right" style="color: var(--text-secondary);"></i>
    `

    return div
  }

  function showFundFromMainModal(wallet) {
    const modal = document.createElement("div")
    modal.className = "modal active"

    const availableBalance = currentUser.isAdmin ? "∞" : formatNumber(currentUser.balance || 0)

    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Fund ${wallet.name}</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <form id="fundFromMainForm">
            <div style="margin-bottom: 16px;">
              <label style="display: block; margin-bottom: 8px; color: var(--text-secondary);">Amount</label>
              <input type="number" id="fundAmount" min="0.01" step="0.01" placeholder="0.00" required
                style="width: 100%; padding: 12px; background-color: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-color);">
              <div style="margin-top: 8px; font-size: 12px; color: var(--text-secondary);">
                Available: $${availableBalance}
              </div>
            </div>
            
            <div id="fundError" style="color: var(--negative-color); margin-bottom: 16px; min-height: 20px;"></div>
            
            <button type="submit" class="action-btn primary" style="width: 100%;">
              <i class="fas fa-wallet"></i> Fund Wallet
            </button>
          </form>
        </div>
      </div>
    `

    document.body.appendChild(modal)

    document.getElementById("fundFromMainForm").addEventListener("submit", (e) => {
      e.preventDefault()
      const amount = Number.parseFloat(document.getElementById("fundAmount").value)
      const errorElement = document.getElementById("fundError")

      errorElement.textContent = ""

      if (amount <= 0) {
        errorElement.textContent = "Amount must be greater than 0"
        return
      }

      if (!currentUser.isAdmin && amount > currentUser.balance) {
        errorElement.textContent = "Insufficient balance"
        return
      }

      fetch("/api/transactions/fund-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tokenType: wallet.token,
          amount: amount,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            modal.remove()
            alert(`Successfully funded ${wallet.name} with $${amount}`)
            alert("Please logout and login again to see the updated balance")
            location.reload()
          } else {
            errorElement.textContent = data.message || "Failed to fund wallet"
          }
        })
        .catch((error) => {
          errorElement.textContent = "An error occurred. Please try again."
          console.error("Fund wallet error:", error)
        })
    })

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove()
      }
    })
  }

  function formatNumber(num) {
    if (num === undefined || num === null) return "0.00"
    return Number.parseFloat(num).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  // Refresh balances every 5 seconds
  setInterval(() => {
    fetch("/api/users/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          const updatedUser = data.user

          // Update currentUser object with new balances
          currentUser.balance = updatedUser.balance
          currentUser.trxBalance = updatedUser.trxBalance
          currentUser.usdtBalance = updatedUser.usdtBalance
          currentUser.usdcBalance = updatedUser.usdcBalance
          currentUser.bnbBalance = updatedUser.bnbBalance
          currentUser.solBalance = updatedUser.solBalance
          currentUser.ethBalance = updatedUser.ethBalance
          currentUser.btcBalance = updatedUser.btcBalance
          currentUser.polBalance = updatedUser.polBalance

          // Update localStorage
          localStorage.setItem("currentUser", JSON.stringify(currentUser))

          // Refresh the UI
          updateBalanceDisplay()
          updateWalletList()
        }
      })
      .catch((error) => {
        console.error("Error refreshing balances:", error)
      })
  }, 5000) // Changed to 5000ms (5 seconds)
})
