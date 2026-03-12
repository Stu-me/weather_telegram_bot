require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const moment = require("moment-timezone");


const Token = process.env.TELEGRAM_BOT_TOKEN;
const weatherApi = process.env.OPENWEATHERMAP_API_KEY; //

const bot = new TelegramBot(Token, { polling: true });

// storage stores the result for each chartId index wise and the moment we input the chatId the storage will retrive the answer for us
const storage = {};

// on typing /start we will give two options

bot.onText(/\/ajith/, (msg) => {
  const chatId = msg.from.id;
  const userName = msg.from.username;
  console.log("chatId = ", chatId, userName + "\n");
  bot.sendMessage(
    chatId,
    `suprise suprise ${chatId} This bot can show you the weather and time for any city. To use it, please choose an option below:`
  );
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.from.id;
  const userName = msg.from.username;
  console.log("chatId = ", chatId, userName + "\n");
  bot.sendMessage(
    chatId,
    `Hello! ${userName} This bot can show you the weather and time for any city. To use it, please choose an option below:`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Get Weather", callback_data: "get_weather" }],
          [{ text: "Get Time", callback_data: "get_time" }],
        ],
      },
    },
  );
});

bot.on("callback_query", async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  console.log("at line 38",data);
  
  // The bot then listens for button presses and asks the user to enter the name of a city:
  switch (data) {
    case "get_weather":
      const userDataWeather = getUserData(chatId);
      userDataWeather.waitingForCity = true;
      userDataWeather.waitingForWeather = true;
      bot.sendMessage(
        chatId,
        "Please enter the name of the city to gets its WEATHER or send /stop to cancel the process ",
      );
      break;
    case "get_time":
      const userDataTime = getUserData(chatId);
      userDataTime.waitingForCity = true;
      userDataTime.waitingForTime = true;
      bot.sendMessage(
        chatId,
        "Please enter the name of the city to get its TIME  or  /stop to stop the process ",
      );
      break;
    default:
      break;
  }
});
// getUserData function intializes or retrives user's state form the storage
function getUserData(chatId) {
  let userData = storage[chatId];
  if (!userData) {
    // if userData is empty put the following values
    // create one and put
    userData = {
      waitingForCity: false,
      waitingForWeather: false,
      waitingForTime: false,
    };
    storage[chatId] = userData; // input our created data
  }
  return userData; // send back userData for the chatId
}
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  const userData = getUserData(chatId);
  if (userData && userData.waitingForCity) {
    const city = text;
    let messageText = "";
    if (userData.waitingForWeather) {
      messageText = await getWeatherData(city);
    } else if (userData.waitingForTime) {
      messageText = await getTimeData(city);
    }
    bot.sendMessage(chatId, messageText);
    resetUserData(chatId);// after sending the data reset 
  }
});

// reseting the user data to default
function resetUserData(chatId) {
  const userData = getUserData(chatId);
  userData.waitingForCity = false;
  userData.waitingForWeather = false;
  userData.waitingForTime = false;
}

//fetching weather of the city
async function getWeatherData(city) {
  const response = await axios.get(
    `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${weatherApi}`,
  );
  console.log("response == ",response);
  
  const weatherData = response.data;
  const weatherDescription = weatherData.weather[0].description;
  const temperature = Math.round(weatherData.main.temp - 273.15);
  const messageText = `The weather in ${city} is currently ${weatherDescription} with a temperature of ${temperature}°C.`;
  return messageText;
}
//fetching the time of the city
async function getTimeData(city) {
  console.log("time function worked");

  const response = await axios.get(
    `http://api.geonames.org/timezoneJSON?formatted=true&lat=${city.lat}&lng=${city.lon}&username=demo&style=full`,
  );
  const data = response.data;
  const localTime = data.time;
  const messageText = `The current time in ${city} is ${localTime}.`;
  return messageText;
}
