require('dotenv').config();
const {
     Client, 
    IntentsBitField, 
    EmbedBuilder, 
    MessageFlags, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    PermissionFlagsBits,
    ChannelType,
    ActivityType,
    CategoryChannel,
    WebhookClient,
    SeparatorBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    REST, 
    Routes, 
    ApplicationCommandOptionType

} = require('discord.js');
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers, 
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildVoiceStates,
        IntentsBitField.Flags.DirectMessages
    ]
});
const openAI = new OpenAI({
    apiKey: process.env.API_KEY, 
    baseURL: "https://api.groq.com/openai/v1"
});

client.on('ready', (c) => {
    console.log(`Logged as ${c.user.tag}✅`);
});
client.on('messageCreate', async (msg) => {
    if (msg.author.bot) return;

    if (msg.channel.id == process.env.CHATBOT_CHANNEL_ID) {
        await msg.channel.sendTyping();

    try {
        
        const pastMessages = await msg.channel.messages.fetch({ limit: 5 });
        
        let converstionLog = [
            { 
                role: 'system', 
                content: process.env.CHATBOT_INSTRUCTIONS
            }
        ];

        const sortedMessages = Array.from(pastMessages.values()).reverse();

        for (const message of sortedMessages) {
            if (message.author.bot && message.author.id !== client.user.id) continue;
            if (message.content.startsWith('!')) continue;
            if (!message.content || message.content.trim() === '') continue;

            if (message.author.id === client.user.id) {
                converstionLog.push({ role: 'assistant', content: message.content });
            } else {
                if (!message.content) {
                    converstionLog.push({ role: 'user', content: `${message.author.displayName}: ${message}`})
                } else {
                    converstionLog.push({ role: 'user', content: `${message.author.displayName}: ${message.content}` });
                }
                
            }
        }

        const result = await openai.chat.completions.create({
            model: "openai/gpt-oss-20b",
            messages: converstionLog,
            temperature: 0.7,
            max_tokens: 1000,
        });

        let replyText = result.choices[0]?.message?.content;

        if (!replyText || replyText.trim() === '') {
            return msg.reply("I'm sorry i can't generate respond");
        }

        if (replyText.length > 1990) {
            replyText = replyText.substring(0, 1985) + "...";
        }

        await msg.reply(replyText);
        console.log(`${msg.author.displayName }(${msg.author.id}): ${msg.content} \nReply: ${replyText}`)
    } catch (error) {
        console.log("=== CHATBOT ERROR ===");
        console.error(error);
        console.log("====================");
        
        
        
        
        msg.reply("There was been error:" + error);
    }
    }
});
client.login(process.env.TOKEN);