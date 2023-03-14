const TelegramBot = require('node-telegram-bot-api');
const ccxt = require('ccxt');
const qrcode = require('qrcode'); 
const depositAddress  = '3PNAvrbLg1MAEzkUmgnKFF61CJbfV2jLPNj';
const UrlAddressUSDT = 'https://waves.exchange/withdraw/USDT';
const UrlAddressBTC = 'https://waves.exchange/withdraw/BTC';
const token = '5968461940:AAF8ow-Z8usdlDC1AZZQXBiIuX5cCqrSPH8';
const bot = new TelegramBot(token, { polling: true });

// Command /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Добро пожаловать в WX Currency Bot\nВведите /currency, чтобы получить информацию об обменном курсе BTC/USDT\nВведите /trade, чтобы получить информацию об обмене валюты");
});

// Command /currency
bot.onText(/\/currency/, (msg) => {
  bot.sendMessage(msg.chat.id, "Чтобы узнать курс обмена BTC/USDT, нажмите кнопку «Получить».", {
    reply_markup: {
      inline_keyboard: [[
        {
          text: "Получить",
          callback_data: "get_exchange_rate"
        }
      ]]
    }
  });
});

// Command /trade
bot.onText(/\/trade/, (msg) => {
  bot.sendMessage(msg.chat.id, "Для обмена валюты нажмите соответствующую кнопку", {
    reply_markup: {
      inline_keyboard: [[
        {
          text: "Обмен USDT/BTC",
          callback_data: "exchange_usdt_btc"
        },
        {
          text: "Обмен BTC/USDT",
          callback_data: "exchange_btc_usdt"
        }
      ]]
    }
  });
});


  bot.on('callback_query', async (callbackQuery) => {
    const message = callbackQuery.message;
    const data = callbackQuery.data;
    const [action, baseCurrency, quoteCurrency, amount] = data.split('_');
    const chatId = callbackQuery.message.chat.id;
    const qrCodeDataURLUSDT = `https://api.qrserver.com/v1/create-qr-code/?data=${UrlAddressUSDT}&size=200x200`;
    const qrCodeDataURLBTC = `https://api.qrserver.com/v1/create-qr-code/?data=${UrlAddressBTC}&size=200x200`;
    const messageTextUSDT = `Оплата на бирже Waves.Exchange по qr-коду\n\nОплата на бирже Waves.Exchange по ссылке: ${UrlAddressUSDT}\n\nАдрес кошелька для депозита USDT на бирже Waves.Exchange: ${depositAddress}`;
    const messageTextBTC = `Оплата на бирже Waves.Exchange по qr-коду\n\nОплата на бирже Waves.Exchange по ссылке: ${UrlAddressBTC}\n\nАдрес кошелька для депозита BTC на бирже Waves.Exchange: ${depositAddress}`;
  
    if (data === "get_exchange_rate") {
      const exchange = new ccxt.wavesexchange();
      const ticker = await exchange.fetchTicker('BTC/USDT');
      const exchangeRate = ticker.last;
      bot.sendMessage(chatId, `Текущий курс обмена BTC/USDT составляет ${exchangeRate}`);
    }
    
    if (data.startsWith("buy_usdt_btc_")) {
      bot.sendPhoto(chatId, qrCodeDataURLUSDT, { caption: messageTextUSDT });
    }
    
    if (data.startsWith("buy_btc_usdt_")) {
      bot.sendPhoto(chatId, qrCodeDataURLBTC, { caption: messageTextBTC });
    }
    
    if (data === "exchange_usdt_btc") {
      bot.sendMessage(chatId, "Введите сумму USDT, которую вы хотите обменять на BTC");
      bot.once('message', async (replyMessage) => {
        const usdtAmount = parseFloat(replyMessage.text);
        const exchange = new ccxt.wavesexchange();
        const ticker = await exchange.fetchTicker('BTC/USDT');
        const exchangeRate = ticker.last;
        const btcAmount = usdtAmount / exchangeRate;
        bot.sendMessage(chatId, `Текущий курс обмена <b>BTC/USDT</b> составляет: ${exchangeRate}\n\nВы получите ${btcAmount} BTC\n\nЧтобы купить, нажмите кнопку «Купить» или нажмите кнопку «Отмена», чтобы отменить`, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[
              {
                text: "✅ Купить",
                callback_data: `buy_usdt_btc_${btcAmount}`
              },
              {
                text: "❌ Отменить",
                callback_data: "cancel_exchange"
              }
            ]]
          }
        });
      });
    }
  
    if (data === "exchange_btc_usdt") {
      bot.sendMessage(chatId, "Введите сумму BTC, которую вы хотите обменять на USDT");
      bot.once('message', async (replyMessage) => {
        console.log('Reply received');
        const btcAmount = parseFloat(replyMessage.text);
        const exchange = new ccxt.wavesexchange();
        const ticker = await exchange.fetchTicker('BTC/USDT');
        const exchangeRate = ticker.last;
        const usdtAmount = btcAmount * exchangeRate;
        bot.sendMessage(chatId, `Текущий курс обмена <b>BTC/USDT</b> составляет: ${exchangeRate}\n\nВы получите ${usdtAmount} USDT\n\nЧтобы купить, нажмите кнопку «Купить» или нажмите кнопку «Отмена», чтобы отменить`, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[
              {
                text: "✅ Купить",
                callback_data: `buy_btc_usdt_${usdtAmount}`
              },
              {
                text: "❌ Отменить",
                callback_data: "cancel_exchange"
              }
            ]]
          }
        });
      });
    }
    if (action === "cancel") {
      bot.answerCallbackQuery(callbackQuery.id, { text: 'Вы отменили операцию', showAlert: false });
      const messageId = callbackQuery.message.message_id;
      const responseMsg = "Операция отменена";
      bot.editMessageText(responseMsg, { chat_id: chatId, message_id: messageId });
    }
    
  });
