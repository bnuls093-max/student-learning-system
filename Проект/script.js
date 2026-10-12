// ---------- Көмекші функциялар ----------

async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || [];
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function getCurrentUser() {
  const email = localStorage.getItem("currentUser");
  if (!email) return null;
  return getUsers().find((u) => u.email === email) || null;
}

function showMessage(element, text, type) {
  element.textContent = text;
  element.className = "message " + type;
}

// Email форматын тексеру: текст@домен.com
function isValidEmail(email) {
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(email);
}

// Құпиясөзде жетіспейтін талаптарды қайтарады
function getMissingRules(password) {
  const missing = [];
  if (password.length < 8) missing.push("кемінде 8 таңба");
  if (!/\p{Lu}/u.test(password)) missing.push("бір үлкен әріп");
  if (!/\p{Ll}/u.test(password)) missing.push("бір кіші әріп");
  if (!/\d/.test(password)) missing.push("бір цифр");
  if (!/[^\p{L}\p{N}\s]/u.test(password)) missing.push("бір символ (!@#$%...)");
  return missing;
}

// ---------- Кіру беті (index.html) ----------
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  if (getCurrentUser()) {
    window.location.href = "main.html";
  }

  const registerForm = document.getElementById("registerForm");
  const tabLogin = document.getElementById("tabLogin");
  const tabRegister = document.getElementById("tabRegister");
  const regEmail = document.getElementById("regEmail");
  const regPassword = document.getElementById("regPassword");
  const emailError = document.getElementById("emailError");
  const strengthText = document.getElementById("passwordStrength");

  tabLogin.addEventListener("click", () => {
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
  });

  tabRegister.addEventListener("click", () => {
    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
    tabRegister.classList.add("active");
    tabLogin.classList.remove("active");
  });

  // Email-ді жазып жатқанда тексеру
  regEmail.addEventListener("input", () => {
    const value = regEmail.value.trim();
    if (value === "" || isValidEmail(value)) {
      emailError.textContent = "";
    } else {
      emailError.textContent = "Email қате. Дұрыс формат: текст@gmail.com";
    }
  });

  // Құпиясөздің күшін жазып жатқанда көрсету
  regPassword.addEventListener("input", () => {
    const missing = getMissingRules(regPassword.value);

    if (regPassword.value === "") {
      strengthText.textContent = "";
      strengthText.className = "strength";
    } else if (missing.length === 0) {
      strengthText.textContent = "Күшті құпиясөз";
      strengthText.className = "strength strong";
    } else if (missing.length <= 2) {
      strengthText.textContent = "Орташа құпиясөз. Жетіспейді: " + missing.join(", ");
      strengthText.className = "strength medium";
    } else {
      strengthText.textContent = "Әлсіз құпиясөз. Жетіспейді: " + missing.join(", ");
      strengthText.className = "strength weak";
    }
  });

  // Тіркелу
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = document.getElementById("registerMessage");

    const name = document.getElementById("regName").value.trim();
    const email = regEmail.value.trim().toLowerCase();
    const password = regPassword.value;

    if (!isValidEmail(email)) {
      showMessage(msg, "Email форматы қате. Мысалы: текст@gmail.com", "error");
      return;
    }

    if (getMissingRules(password).length > 0) {
      showMessage(msg, "Құпиясөз әлсіз. Барлық талапты орындаңыз", "error");
      return;
    }

    const users = getUsers();
    if (users.some((u) => u.email === email)) {
      showMessage(msg, "Бұл email бұрын тіркелген", "error");
      return;
    }

    users.push({
      name: name,
      email: email,
      passwordHash: await hashPassword(password),
      createdAt: new Date().toISOString(),
    });
    saveUsers(users);

    showMessage(msg, "Тіркелу сәтті өтті! Енді кіре аласыз", "success");
    registerForm.reset();
    strengthText.textContent = "";
    setTimeout(() => tabLogin.click(), 1200);
  });

  // Кіру
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = document.getElementById("loginMessage");

    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;
    const hash = await hashPassword(password);

    const user = getUsers().find(
      (u) => u.email === email && u.passwordHash === hash
    );

    if (!user) {
      showMessage(msg, "Email немесе құпиясөз қате", "error");
      return;
    }

    localStorage.setItem("currentUser", user.email);
    window.location.href = "main.html";
  });
}

// ---------- Мәзірлі беттер (main.html, cabinet.html) ----------
if (document.body.classList.contains("app-page")) {
  const user = getCurrentUser();

  if (!user) {
    window.location.href = "index.html";
  } else {
    const fill = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };
    fill("welcomeName", user.name);
    fill("userName", user.name);
    fill("userEmail", user.email);
  }

  document.getElementById("logoutBtn").addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("currentUser");
    window.location.href = "index.html";
  });
}
// ---------- Бүйір панельді жабу / ашу ----------
if (document.body.classList.contains("app-page")) {
  const closeSidebar = document.getElementById("closeSidebar");
  const openSidebar = document.getElementById("openSidebar");

  // Алдыңғы беттегі күйді еске түсіру
  if (localStorage.getItem("sidebarHidden") === "1") {
    document.body.classList.add("sidebar-hidden");
  }

  closeSidebar.addEventListener("click", () => {
    document.body.classList.add("sidebar-hidden");
    localStorage.setItem("sidebarHidden", "1");
  });

  openSidebar.addEventListener("click", () => {
    document.body.classList.remove("sidebar-hidden");
    localStorage.setItem("sidebarHidden", "0");
  });
}
// ---------- Бөлімдерді жинау / ашу ----------
document.querySelectorAll(".forum-section-header").forEach((header) => {
  header.addEventListener("click", () => {
    header.nextElementSibling.classList.toggle("hidden");
    header.classList.toggle("collapsed");
  });
});