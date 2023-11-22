const WebSocket = require('ws');

const okxSocketUrl = 'wss://wspap.okx.com:8443/ws/v5/business?brokerId=9999';
const binanceSocketUrl = 'wss://stream.binance.com:9443/ws/btcusdt@kline_1s';

const okxWs = new WebSocket(okxSocketUrl);
const binanceWs = new WebSocket(binanceSocketUrl);

let okxBtcPrice = {
    price: 0
};

let binanceBtcPrice = {
    price: 0
};

let averagePrice = {
    price: 0
};

function updateAveragePrice() {
    averagePrice.price = (okxBtcPrice.price + binanceBtcPrice.price) / 2;
    // console.log('Average BTC Price:', averagePrice);
}

okxWs.on('open', () => {
    console.log('OKX WebSocket connection opened');

    try {
        const initMessage = {
            op: 'subscribe',
            args: [
                {
                    channel: 'candle1s',
                    instId: 'BTC-USDT',
                },
            ],
        };

        okxWs.send(JSON.stringify(initMessage));
    } catch (error) {
        console.log('OKX Socket Open Error == ', error);
    }
});

binanceWs.on('open', () => {
    console.log('Binance WebSocket connection opened');

    // Binance subscription message
    // binanceWs.send(JSON.stringify({
    //     method: 'SUBSCRIBE',
    //     params: [
    //         `btcusdt@kline_1s`
    //     ],
    //     id: 1,
    // }));
});

function handlePriceUpdate(priceObject, source) {
    if (source === 'OKX') {
        if (priceObject.data) {
            let price = Number(priceObject.data[0][4]) * 10 ** 10;
            okxBtcPrice.price = price;
        }
    } else if (source === 'Binance') {
        let price = Number(priceObject.o) * 10 ** 10;
        binanceBtcPrice.price = price;
    }

    updateAveragePrice();
}

okxWs.on('message', (data) => {
    const messageString = data.toString('utf8');
    try {
        const parsedData = JSON.parse(messageString);
        handlePriceUpdate(parsedData, 'OKX');
    } catch (error) {
        console.error('OKX Error parsing JSON:', error);
    }
});

binanceWs.on('message', (data) => {
    const messageString = data.toString('utf8');
    try {
        const parsedData = JSON.parse(messageString);
        handlePriceUpdate(parsedData.k, 'Binance');
    } catch (error) {
        console.error('Binance Error parsing JSON:', error);
    }
});

function handleWebSocketClose(source, code, reason) {
    console.log(`${source} WebSocket connection closed with code ${code} and reason: ${reason}`);
}

okxWs.on('close', (code, reason) => {
    handleWebSocketClose('OKX', code, reason);
});

binanceWs.on('close', (code, reason) => {
    handleWebSocketClose('Binance', code, reason);
});

function handleWebSocketError(source, error) {
    console.error(`${source} WebSocket error:`, error);
}

okxWs.on('error', (error) => {
    handleWebSocketError('OKX', error);
});

binanceWs.on('error', (error) => {
    handleWebSocketError('Binance', error);
});

module.exports = {
    averagePrice,
};