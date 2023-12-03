var TelegramBot = require('node-telegram-bot-api');
process.env["NTBA_FIX_350"] = 1;
require('dotenv').config();
const tokenTG = process.env.TOKEN;

var bot = new TelegramBot(tokenTG, {webHook:{
  host:"0.0.0.0",
  port: process.env.PORT || 8080
}});

bot.setWebHook(process.env.URL);

const request = require('request');

const tokenTryvoga = process.env.TOKENTRYVOGA;
const options = {
  url: 'https://api.alerts.in.ua/v1/iot/active_air_raid_alerts/31.json',
    headers: {
    'Authorization': `Bearer ${tokenTryvoga}`
  }
};

let status = "N";

bot.onText(/\/startbot/, msg =>{
  console.log("bot started")
let interval = setInterval(()=>{
  userID = msg.chat.id;
  request.get(options, (error, response, body) => {
      if (error) {
        console.error(error);
        return;
      }
      if(JSON.parse(body) == "N" && status == "A"){
        bot.sendVoice(userID, `https://audio.jukehost.co.uk/BJdgmylWHp67AdD3O2RF5tS192kwPGxH`, {caption: "Відбій"})
        status = "N";
        console.log("Raid alert ended")
      } else if(JSON.parse(body) == "A" && status == "N"){
        bot.sendVoice(userID, `https://audio.jukehost.co.uk/tgrhFVEtadMyYUaDk4CG9rLac9f1r0Wd`,{caption: "Тривога"})
        status = "A";
        console.log("Raid alert started")
      } else{
        console.log("Nothing has changed")
      }
  });
}, 30000);
bot.onText(/\/endbot/, ()=>{
  clearInterval(interval);
})
});

