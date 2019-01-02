import { WebApi } from './webapi';
import * as Discord from 'discord.js';
import * as path from 'path';
import { Stream, Readable } from 'stream';

export class DiscordBot {
    private client = new Discord.Client();
    public webapi: WebApi;
    public baseUrl = "";
    public started = false;

    constructor() {
        this.webapi = new WebApi(this);
    }

    public start(token: string, baseUrl: string, port: number): void {
        this.baseUrl = baseUrl;

        this.webapi.discordBot = this;
        this.webapi.express.listen(port)

        console.log('Starting bot...');
        this.client.on('ready', () => {
            console.log('The bot is ready!');
            console.log('Starting server...');
            this.client.user.setActivity('/sketch');
            this.started = true;
        });

        this.client.on('message', (message) => {
            if (message.content.startsWith('/sketch')) {
                message.channel.send(baseUrl + 'sketch/' + message.channel.id);
            }
            if (message.content.startsWith('<@528166288527327262>')){
                message.channel.send('ok')
            }
        })
        this.client.login(token);
    }

    public async confirmChannel(cid: string, uid: string) {
        let data: any = {};
        let channel = this.client.channels.get(cid) as Discord.GuildChannel;
        if (channel == null) { return 'Invalid channel'; }
        let guild = channel.guild;
        let user = await this.client.fetchUser(uid);
        if (user == null) { return 'Invalid user'; }
        let member;
        try {
            member = await guild.fetchMember(user);
        }
        catch{ return 'User not in Server'; }
        if (!(
            channel.memberPermissions(member).has(Discord.Permissions.FLAGS.VIEW_CHANNEL) &&
            channel.memberPermissions(member).has(Discord.Permissions.FLAGS.SEND_MESSAGES) &&
            channel.memberPermissions(member).has(Discord.Permissions.FLAGS.ATTACH_FILES) 
        )){
            return 'Invalid user permissions';
        }
        data.guildName = guild.name;
        data.guildIconUrl = guild.iconURL;
        data.channelName = channel.name;
        return data;
    }

    public async sendImage(data, uid, cid) {
        let c = await this.confirmChannel(cid, uid);
        if(typeof(c) == "string") return c;
        let channel = this.client.channels.get(cid) as Discord.TextChannel;
        if (channel == null) { return null; }
        let guild = channel.guild;
        let user = await this.client.fetchUser(uid);
        if (channel == null) { return null; }
        let buffer = Buffer.from(data.replace("data:image/png;base64,", ""), "base64");
        channel.send(user.username + '#' + user.discriminator + ' drew:',
            new Discord.Attachment(buffer, 'image.png')
        );
        return true;
    }
}