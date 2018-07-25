const { Client } = require('../dist');
const { inspect } = require('util');
const { Client: Gateway } = require('@spectacles/gateway');

const gateway = new Gateway(process.env.TOKEN);
const client = new class extends Client {
  constructor() {
    super({
      password: 'youshallnotpass',
      userID: process.env.USER_ID,
      hosts: {
        rest: 'http://localhost:8081',
        ws: 'http://localhost:8080',
      },
    });
  }

  send(guild, packet) {
    return gateway.connections.get(0).send(packet);
  }
}

gateway.on('READY', console.log);

gateway.on('MESSAGE_CREATE', async (shard, m) => {
  console.log(m.content);
  if (m.content === 'join') await client.players.get('281630801660215296').join('281630801660215297');
  if (m.content === 'leave') await client.players.get('281630801660215296').leave();

  if (m.content === 'play') {
    const trackResponse = await client.load('https://www.twitch.tv/monstercat');
    client.players.get('281630801660215296').play(trackResponse.tracks[0]);
  }

  if (m.content === 'reconnect') gateway.connections.get(0).reconnect();
});

gateway.on('VOICE_STATE_UPDATE', (shard, s) => client.voiceStateUpdate(s));
gateway.on('VOICE_SERVER_UPDATE', (shard, s) => client.voiceServerUpdate(s));
gateway.on('close', console.log);
gateway.on('error', (shard, err) => console.log(inspect(err, { depth: 2 })));

(async () => {
  try {
    await gateway.spawn();
  } catch (e) {
    console.error(e);
  }
})();
