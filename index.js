require('dotenv').config();
process.env["NTBA_FIX_350"] = 1;
var admin = require("firebase-admin");

var serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS;
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

var TelegramBot = require('node-telegram-bot-api');
const textToSpeech = require('@google-cloud/text-to-speech');
const client = new textToSpeech.TextToSpeechClient();

const token = process.env.TOKEN;

var bot = new TelegramBot(token, { webHook:{
    host:"0.0.0.0",
    port: process.env.PORT || 5000
}});

bot.setWebHook(process.env.URL);

const fs = require('fs');
const util = require('util');

var userID;
var language;

bot.setMyCommands([
    { command: '/tospeech', description: "Converting text to speech" },
    { command: '/language', description: "Changing language of speech " }
])

bot.onText(/\/start/, (msg) => {
    userID = msg.chat.id;
    bot.sendMessage(userID,
        `*Welcome to this bot\\. Here you can make your text a voice message with /tospeech \\*your text\\*
Now 2 languages are available\: english and ukrainian\\. To switch between them use /language*`,
        { parse_mode: "MarkdownV2" });
    db.collection("users").doc(msg.from.username).set({ lang: "uk-UA" });
})

bot.onText(/\/language/, async (msg) => {
    userID = msg.chat.id;
    db.collection("users").doc(msg.from.username).get().then(doc => { language = doc.data().lang });
    setTimeout(async () => {
        if (language == "uk-UA") {
            var deleteMessage = await bot.sendMessage(userID, "Яку мову ви хочете обрати?", {
                "reply_markup": {
                    "inline_keyboard": [[{ text: "англійська", callback_data: "english" }, { text: "українська", callback_data: "ukrainian" }]]
                }
            })
            setTimeout(async () => {
                try {
                    await bot.deleteMessage(userID, deleteMessage.message_id);
                }
                catch (err) { }
            }, 50000)  
        } else if (language == "en-US") {
            var deleteMessage = await bot.sendMessage(userID, "What language do you want to choose?", {
                "reply_markup": {
                    "inline_keyboard": [[{ text: "english", callback_data: "english" }, { text: "ukrainian", callback_data: "ukrainian" }]]
                }
            })
            setTimeout(async () => {
                try {
                    await bot.deleteMessage(userID, deleteMessage.message_id);
                }
                catch (err) { }
            }, 50000)
        }
    }, 550)
     
});

bot.on('callback_query', (msg) => {
    userID = msg.message.chat.id;
    if (msg.data == "english") {
        db.collection("users").doc(msg.from.username).update({ lang: "en-US" });
        bot.sendMessage(userID, "Language was set to english");
        bot.deleteMessage(userID, msg.message.message_id);
        bot.setMyCommands([
            { command: '/tospeech', description: "Converting text to speech" },
            { command: '/language', description: "Changing language of speech" }
        ])
    } else if (msg.data == "ukrainian") {
        db.collection("users").doc(msg.from.username).update({ lang: "uk-UA" });
        bot.sendMessage(userID, "Мова була змінена на українську");
        bot.deleteMessage(userID, msg.message.message_id);
        bot.setMyCommands([
            { command: '/tospeech', description: "Конвертує текст у аудіо" },
            { command: '/language', description: "Змінити мову" }
        ])
    }
})

bot.onText(/\/tospeech (.+)/, (msg, match) => {
    userID = msg.chat.id;
    var text = match.input.replace(/(\r\n|\n|\r|\/tospeech)/gm, " ").replace(/\s{2,}/, "");
    db.collection("users").doc(msg.from.username).get().then(doc => { language = doc.data().lang });
    setTimeout(async () => {
        const request = {
            input: { text: text },
            voice: { languageCode: language, ssmlGender: 'FEMALE' },
            audioConfig: { audioEncoding: 'MP3' }
        }
        const [response] = await client.synthesizeSpeech(request);
        const writeFile = util.promisify(fs.writeFile);
        await writeFile(`#${msg.from.username}.mp3`, response.audioContent, 'binary');
        setTimeout(() => {
            bot.sendVoice(userID, `#${msg.from.username}.mp3`, { reply_to_message_id: msg.message_id });
            setTimeout(() => {
                fs.unlinkSync(`#${msg.from.username}.mp3`);
            }, 10);
        }, 1000);
    }, 550)
});

bot.onText(/\/tospeech\s*$/, async msg => {
    userID = msg.chat.id;
    db.collection("users").doc(msg.from.username).get().then(doc => { language = doc.data().lang });
    setTimeout(async () => {
        if (language == "uk-UA") {
            var message_to_reply = await bot.sendMessage(userID, "Введіть ваш текст у відповідь на це повідомлення", {
                reply_markup: {
                    force_reply: true,
                    input_field_placeholder: "ваш текст"
                }
            })
            bot.onReplyToMessage(userID, message_to_reply.message_id, async (msg) => {
                var text = msg.text.replace(/(\r\n|\n|\r)/gm, "").replace(/\s{2,}/, "");
                const request = {
                    input: { text: text },
                    voice: { languageCode: language, ssmlGender: 'FEMALE' },
                    audioConfig: { audioEncoding: 'MP3' }
                }
                const [response] = await client.synthesizeSpeech(request);
                const writeFile = util.promisify(fs.writeFile);
                await writeFile(`#${msg.from.username}.mp3`, response.audioContent, 'binary');
                setTimeout(() => {
                    bot.sendVoice(userID, `#${msg.from.username}.mp3`, { reply_to_message_id: msg.message_id });
                    setTimeout(() => {
                        fs.unlinkSync(`#${msg.from.username}.mp3`);
                    }, 10);
                }, 1000);
            });
        } else if (language == "en-US") {
            var message_to_reply = await bot.sendMessage(userID, "Write your text in reply for this message", {
                reply_markup: {
                    force_reply: true,
                    input_field_placeholder: "your text"
                }
            })
            bot.onReplyToMessage(userID, message_to_reply.message_id, async (msg) => {
                var text = msg.text.replace(/(\r\n|\n|\r)/gm, "").replace(/\s{2,}/, "");
                const request = {
                    input: { text: text },
                    voice: { languageCode: language, ssmlGender: 'FEMALE' },
                    audioConfig: { audioEncoding: 'MP3' }
                }
                const [response] = await client.synthesizeSpeech(request);
                const writeFile = util.promisify(fs.writeFile);
                await writeFile(`#${msg.from.username}.mp3`, response.audioContent, 'binary');
                setTimeout(() => {
                    bot.sendVoice(userID, `#${msg.from.username}.mp3`, { reply_to_message_id: msg.message_id });
                    setTimeout(() => {
                        fs.unlinkSync(`#${msg.from.username}.mp3`);
                    }, 10);
                }, 1000);
            });
        }
    }, 550)
})



