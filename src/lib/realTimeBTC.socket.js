const WebSocket = require('ws');

const socketUrl = 'wss://wspap.okx.com:8443/ws/v5/business?brokerId=9999';

const ws = new WebSocket(socketUrl);

let btcPrice = {
    price: 0
};

ws.on('open', () => {
    console.log('WebSocket connection opened');

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

        ws.send(JSON.stringify(initMessage));
    } catch (error) {
        console.log('Socket Open Error == ', error);
    }
});

ws.on('message', (data) => {
    // Handle incoming messages (real-time updates)
    // console.log('Received message:', data);

    const messageString = data.toString('utf8');

    // console.log("messageString", messageString);

    // Parse the data as JSON
    try {
        const parsedData = JSON.parse(messageString);
        // console.log("parsedData", parsedData);
        if (parsedData.data) {
            btcPrice.price = Number(parsedData.data[0][4]) * 10 ** 10;
        }
        // console.log("BTC Price ", Number(parsedData.data[0][4]));
    } catch (error) {
        console.error('Error parsing JSON:', error);
    }
});

ws.on('close', (code, reason) => {
    console.log(`WebSocket connection closed with code ${code} and reason: ${reason}`);
});

ws.on('error', (error) => {
    console.error('WebSocket error:', error);
});

module.exports.btcPrice = btcPrice;
