const axios = require("axios");
const crypto = require("crypto");
const { URLSearchParams } = require("url");

const SYMBOL = "BTCUSDT";
const API_URL = "https://testnet.binance.vision";
const QUANTITY = "0.001";
const API_KEY = "rpA6Ail86jepLh8D3MbbBFiM62P0e8puNCLtr9tNjUMJc0ahMNlTgvwEJcsKShNL";
const SECRET_KEY = "sAXJh4oecZ4R2eBvJwgBijKI1YpVF2X0cbIchZoOQPLAxO2hhpwBwzZXLE72okRx";

let isOpened = false;

function calcSMA(data){
    const closes = data.map(candle => parseFloat(candle[4]));
    const sum = closes.reduce((a,b) => a + b);
    return sum / data.length;
}

async function start(){
    const { data } = await axios.get(API_URL+"/api/v3/klines?limit=21&interval=15m&symbol="+SYMBOL);
    const candle = data[data.length - 1];
    const price = parseFloat(candle[4]);
    
    console.clear();
    console.log("Price: " + price);

    const sma = calcSMA(data);
    console.log("SMA", + sma);
    console.log("Is Opened? "+ isOpened);

    if(price <= (sma * 0.9) && isOpened === false){
        console.log("comprar");
        isOpened = true;
        await newOrder(SYMBOL, QUANTITY, "buy");
    } else if(price >= (sma * 1.1) && isOpened === true){
        console.log("vender");
        isOpened = false;
        await newOrder(SYMBOL, QUANTITY, "sell");
    } else {
        console.log("aguardando ...");
    }
};

async function newOrder(symbol, quantity, side){
    const order = { symbol, quantity, side };
    order.type = "MARKET";
    order.timestamp = Date.now();
    order.recvWindow = 60000;

    const signature = crypto
        .createHmac("sha256", SECRET_KEY)
        .update(new URLSearchParams(order).toString())
        .digest("hex");
    
    order.signature = signature;

    try{
        const {data} = await axios.post(
            API_URL+"/api/v3/order",
            new URLSearchParams(order).toString(),
            { headers: { "X-MBX-APIKEY": API_KEY } }
        )

        console.log(data);

    } catch(err){
        console.error(err.response.data);
    }
}

setInterval(start, 3000);

start();