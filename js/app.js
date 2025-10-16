// === ИНИЦИАЛИЗАЦИЯ FIREBASE ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

import { firebaseConfig } from "./firebase-config.js";
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// === ПЕРЕКЛЮЧЕНИЕ КАРТОЧЕК ===
window.showLogin = function () {
  document.getElementById("registerCard").classList.add("hidden");
  document.getElementById("loginCard").classList.remove("hidden");
};

window.showRegister = function () {
  document.getElementById("loginCard").classList.add("hidden");
  document.getElementById("registerCard").classList.remove("hidden");
};

// === РЕГИСТРАЦИЯ ===
document.getElementById("btnRegister").addEventListener("click", async () => {
  const fullname = document.getElementById("reg_fullname").value.trim();
  const phone = document.getElementById("reg_phone").value.trim();
  const password = document.getElementById("reg_password").value.trim();
  const pvz = document.getElementById("reg_pvz").value;

  if (!fullname || !phone || !password) {
    alert("Пожалуйста, заполните все поля!");
    return;
  }

  const code = "AC" + Math.floor(100000 + Math.random() * 900000);

  try {
    await set(ref(db, "users/" + phone.replace(/\+/g, "")), {
      fullname,
      phone,
      password, // для настоящего сайта лучше использовать хэш!
      pvz,
      code,
      role: phone === "+996550997000" ? "admin" : "user",
      registeredAt: new Date().toISOString(),
    });

    alert("✅ Регистрация успешна! Ваш код: " + code);
    localStorage.setItem("phone", phone);
    localStorage.setItem("role", phone === "+996550997000" ? "admin" : "user");
    window.location.href = "dashboard.html"; // страница личного кабинета
  } catch (error) {
    console.error(error);
    alert("Ошибка при регистрации: " + error.message);
  }
});

// === ВХОД ===
document.getElementById("btnLogin").addEventListener("click", async () => {
  const phone = document.getElementById("login_phone").value.trim();
  const password = document.getElementById("login_password").value.trim();

  if (!phone || !password) {
    alert("Введите телефон и пароль!");
    return;
  }

  try {
    const snapshot = await get(child(ref(db), "users/" + phone.replace(/\+/g, "")));
    if (!snapshot.exists()) {
      alert("Пользователь не найден!");
      return;
    }

    const data = snapshot.val();
    if (data.password !== password) {
      alert("Неверный пароль!");
      return;
    }

    localStorage.setItem("phone", phone);
    localStorage.setItem("role", data.role || "user");

    if (data.role === "admin") {
      alert("Добро пожаловать, администратор!");
    } else {
      alert("Вход выполнен успешно!");
    }

    window.location.href = "dashboard.html";
  } catch (error) {
    console.error(error);
    alert("Ошибка при входе: " + error.message);
  }
});
  
