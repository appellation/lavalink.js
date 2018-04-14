import Client, { VoiceServerUpdate } from './Client';
import { EventEmitter } from 'events';

export enum Status {
  INSTANTIATED,
  PLAYING,
  PAUSED,
  ENDED,
  ERRORED,
}

export default class Player extends EventEmitter {
  public readonly client: Client;
  public guildID: string;
  public status: Status = Status.INSTANTIATED;

  constructor(client: Client, guildID: string) {
    super();
    this.client = client;
    this.guildID = guildID;

    this.on('event', (d) => {
      if (d.type === 'TrackEndEvent') this.status = Status.ENDED;
      else this.status = Status.ERRORED;
    })
  }

  public get playing() {
    return this.status === Status.PLAYING;
  }

  public get paused() {
    return this.status === Status.PAUSED;
  }

  public leave() {
    return this.client.send(this.guildID, {
      op: 4,
      d: {
        guild_id: this.guildID,
        channel_id: null,
        self_mute: false,
				self_deaf: false
      },
    });
  }

  public join(channel: string, { deaf = false, mute = false } = {}) {
    this.client.voiceServers.delete(this.guildID);
    this.client.voiceStates.delete(this.guildID);

    return this.client.send(this.guildID, {
      op: 4,
      d: {
        guild_id: this.guildID,
        channel_id: channel,
        self_deaf: deaf,
        self_mute: mute,
      },
    })
  }

  public async play(track: string, { start = 0, end = 0 }: { start?: number, end?: number } = {}) {
    await this.send('play', {
      track,
      startTime: start,
      endTime: end,
    });

    this.status = Status.PLAYING;
  }

  public setVolume(vol: number) {
    return this.send('volume', { volume: vol });
  }

  public seek(position: number) {
    return this.send('seek', { position });
  }

  public pause(paused: boolean = true) {
    if (paused) this.status = Status.PAUSED;
    else this.status = Status.PLAYING;

    return this.send('pause', { pause: paused });
  }

  public async stop() {
    await this.send('stop');
  }

  public voiceUpdate(sessionId: string, event: VoiceServerUpdate) {
    return this.send('voiceUpdate', {
      event,
      sessionId,
    });
  }

  public send(op: string, d: any = {}) {
    const conn = this.client.connection;
    if (conn) {
      return conn.send(Object.assign({
        op,
        guildId: this.guildID,
      }, d));
    } else {
      return Promise.reject(new Error('no WebSocket connection available'));
    }
  }
}
