var TelegramBot = require('node-telegram-bot-api');
process.env["NTBA_FIX_350"] = 1;
require('dotenv').config();
const tokenTG = process.env.TOKEN;

var bot = new TelegramBot(tokenTG, {webHook:{
  host:"0.0.0.0",
  port: process.env.PORT || 5000
}});

bot.setWebHook(process.env.URL);

const request = require('request');

const tokenTryvoga = process.env.TOKENTRYVOGA;
const options = {
  url: 'https://api.alerts.in.ua/v1/iot/active_air_raid_alerts/23.json',
    headers: {
    'Authorization': `Bearer ${tokenTryvoga}`
  }
};

let status = "N";

bot.onText(/\/startbot/, msg =>{
let interval = setInterval(()=>{
  userID = msg.chat.id;
  request.get(options, (error, response, body) => {
      if (error) {
        console.error(error);
        return;
      }
      if(JSON.parse(body) == "N" && status == "A"){
        bot.sendVoice(userID, `audio\\vidbiy.mp3`)
        status = "N";
      } else if(JSON.parse(body) == "A" && status == "N"){
        bot.sendVoice(userID, `audio\\trivoga.mp3`)
        status = "A";
      }
  });
}, 30000);
bot.onText(/\/endbot/, ()=>{
  clearInterval(interval);
})
});

