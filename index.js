"use strict";
var config = require('./config');
const ccxt = require ('ccxt');
const { wavesexchange } = require('ccxt');
const we = new wavesexchange({
    apiKey: config.API_KEY,
    secret: config.SECRET_KEY,
});

const TelegramApi = require('node-telegram-bot-api')


const token = config.TELEGRRAM_TOKEN

const bot = new TelegramApi(token, {polling: true})

const chats = {}

const currencyOptions = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{text: 'Получить', callback_data: 'get_BTCUSDT'}],
        ]
    })
}
const tradeOptions = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{text: 'Обменять BTC на USDT', callback_data: 'trade_BTCUSDT'},{text: 'Обменять WAVES на BTC', callback_data: 'trade_WAVESBTC'}],
        ]
    })
}

const startCurrency = async (chatId) => {
    await bot.sendMessage(chatId, 'Добро пожаловать в WX Currency Bot \nВведите /currency, чтобы получить информацию о курсе BTC/USDT \nВведите /trade, чтобы получить информацию об обмене валют');
}
const smallCurrency = async (chatId) => {
    await bot.sendMessage(chatId, 'Что получить курс BTC/USDT нажми кнопку "Получить"',currencyOptions);
}
const startTrade = async (chatId) => {
    await bot.sendMessage(chatId, 'Для обмена BTC на USDT или WAVES на BTC, нажмите на соответствующую кнопку',tradeOptions);
}
const currencyFT = async (chatId) => {
    (async () => {
        await we.loadMarkets();
        const exchanges = [
            'wavesexchange',
        ]
    
        const symbol = 'BTC/USDT'
        const tickers = {}
    
        await Promise.all (exchanges.map (exchangeId =>
    
            new Promise (async (resolve, reject) => {
    
                const exchange = new ccxt[exchangeId] ()
    
                
    
                    const ticker = await exchange.fetchTicker (symbol)
                    tickers[exchangeId] = ticker
    
                    Object.keys (tickers).map (exchangeId => {
                        const ticker = tickers[exchangeId]
                        console.log (ticker['datetime'], exchangeId, ticker['last'], ticker['ask'])   
                        bot.sendMessage(chatId, 'Текущий курс '+ symbol + ' : ' + ticker['last'] + '$')
                    })
                
    
            })
    
        ))
    
    }) ()
}

const BuyOrderUSDTBTC = async (chatId) => {
    const symbol = 'BTC/USDT';
    const amount = 1; // количество, которое вы хотите купить
    const price = 20000; // цена, по которой вы хотите купить

    we.createLimitBuyOrder(symbol, amount, price).then(order => {
        console.log(order);
    }).catch(error => {
        console.log('Ошибка при создании ордера:', error);
        bot.sendMessage(chatId, 'У вас недостаточно средств ни для одной из приемлемых комиссий за активы')
    });
}

const BuyOrderBTCWAVES = async (chatId) => {
    const symbol = 'WAVES/BTC'; // Wavesexchange торговой пары USDT/BTC не имеет
    const amount = 26300; // количество, которое вы хотите купить
    const price = 1; // цена, по которой вы хотите купить

    we.createLimitBuyOrder(symbol, amount, price).then(order => {
        console.log(order);
    }).catch(error => {
        console.log('Ошибка при создании ордера:', error);
        bot.sendMessage(chatId, 'У вас недостаточно средств ни для одной из приемлемых комиссий за активы')
    });
}

const Razrab = async (chatId) => {
        bot.sendMessage(chatId, 'В разработке 🕒')
}
const start = async () => {

    

    bot.setMyCommands([
        {command: '/start', description: 'Начальное приветствие'},
        {command: '/currency', description: 'Информация о курсе валют'},
        {command: '/trade', description: 'Информация об обмене валюты'},
    ])

    bot.on('message', async msg => {
        const text = msg.text;
        const chatId = msg.chat.id;

        try {
            if (text === '/start') {
                return startCurrency(chatId);
            }
            if (text === '/currency') {
                return smallCurrency(chatId);
            }
            if (text === '/trade') {
                return startTrade(chatId);
            }
            return bot.sendMessage(chatId, 'Я тебя не понимаю, попробуй еще раз!)');
        } catch (e) {
            return bot.sendMessage(chatId, 'Произошла какая то ошибочка!)');
        }

    })

    bot.on('callback_query', msg => {
        const data = msg.data;
        const chatId = msg.message.chat.id;
        if (data === 'get_BTCUSDT') {
            return currencyFT(chatId);
        }
        if (data === 'trade_BTCUSDT') {
            return BuyOrderUSDTBTC(chatId);
        }
        if (data === 'trade_WAVESBTC') {
            return BuyOrderBTCWAVES(chatId);
        }
    })
}

start()