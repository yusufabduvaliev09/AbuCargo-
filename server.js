// server.js
const express = require("express");
const bodyParser = require("body-parser");
const TelegramBot = require("node-telegram-bot-api");

const app = express();
app.use(bodyParser.json());

// === 🔑 ВСТАВЬ СВОЙ ТОКЕН ===
const TOKEN = "8144352720:AAEoGHZv9ngCzwQqeEo_OdnuA-BfMtsEtZM";
const bot = new TelegramBot(TOKEN);

// === ⚙️ 1. Команда /start ===
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || "друг";

  // Генерируем ссылку на регистрацию с Telegram ID
  const registerUrl = `https://abucargo.lovable.app/register?tg_id=${chatId}`;

  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "💬 Написать менеджеру", url: "https://wa.me/996997111118" },
        ],
        [{ text: "📝 Пройти регистрацию", url: registerUrl }],
      ],
    },
  };

  const text = `
👋 Привет, ${firstName}!
Я чат-бот карго-компании *ABU Cargo*.

Я помогу вам получить персональный код и правильно заполнить адрес склада в Китае 🇨🇳

С уважением, команда ABU Cargo🧡
  `;

  bot.sendMessage(chatId, text, {
    parse_mode: "Markdown",
    reply_markup: options.reply_markup,
  });
});

// === ⚙️ 2. API /notify: сайт сообщает о регистрации ===
// Сайт вызывает этот endpoint, когда пользователь завершил регистрацию
app.post("/notify", async (req, res) => {
  try {
    const { telegramId, fio, code, phone, pvz } = req.body;

    if (!telegramId) {
      return res.status(400).send("Нет telegramId пользователя");
    }

    // Определяем номер менеджера по выбранному ПВЗ
    let pvzNumber = "+996997111118"; // твой номер по умолчанию
    if (pvz === "Нариман и Достук") pvzNumber = "+996997111118";
    else if (pvz === "Жийдалик УПТК") pvzNumber = "+996558105551";

    // === Добавляем кнопку "Мой личный кабинет" ===
    const cabinetUrl = `https://abucargo.lovable.app/profile?tg_id=${telegramId}`;
    const options = {
      reply_markup: {
        inline_keyboard: [
          [{ text: "👤 Мой личный кабинет", url: cabinetUrl }],
        ],
      },
    };

    // === Сообщение пользователю ===
    const message = `
🎉 *Регистрация прошла успешно!* 🎉
Спасибо, что подписались!

📃 *Ваш профиль* 📃
🪪 *Персональный код:* ${code}
👤 *ФИО:* ${fio}
📞 *Номер:* ${phone}
📍 *ПВЗ:* ${pvz}
📍 *ПВЗ номер:* ${pvzNumber}
📍 *Часы работы:* 9:00 до 18:00

📩 Скопируйте ниже. Это адрес склада в Китае 🇨🇳:
御玺${code}
15727306315
浙江省金华市义乌市北苑街道春晗二区36栋好运国际货运5697库
入仓号: 御玺${code}
`;

    // Отправляем сообщение пользователю
    await bot.sendMessage(telegramId, message, {
      parse_mode: "Markdown",
      reply_markup: options.reply_markup,
    });

    res.send("✅ Сообщение пользователю отправлено");
  } catch (err) {
    console.error("❌ Ошибка при отправке:", err);
    res.status(500).send("Ошибка сервера");
  }
});

// === ⚙️ 3. Проверка статуса сервера ===
app.get("/", (req, res) => {
  res.send("🤖 ABU Cargo Telegram Bot работает!");
});

// === ⚙️ 4. Запуск сервера ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Сервер запущен на порту ${PORT}`));
