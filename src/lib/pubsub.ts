export interface IPubSub {
  publish: <T>(channel: string, content?: T) => void
  subscribe: <T>(channel: string, callback: (arg: T) => void) => void
  unsubscribe: (channel: string, callback: (arg: unknown) => void) => void
}

export class PubSub implements IPubSub {
  private channelMap: {
    [channel: string]: {
      user: string
      callback: (arg: unknown) => void
    }[]
  }
  private lastEmitTime: number

  constructor() {
    this.channelMap = {}
    this.lastEmitTime = 0
  }

  /**
   * Publish to a channel.
   * @param channel 
   * @param content 
   */
  publish<T>(channel: string, content?: T): void {
    const subscribers = this.channelMap[channel]
    if (subscribers && subscribers.length > 0) {
      for (let i = 0; i < subscribers.length; i++) {
        subscribers[i].callback(content)
      }
    }
    const now = Date.now()
    if (now - this.lastEmitTime > 16) {
      /** Exclude its own message to prevent oscillation. */
      if (channel !== 'messenger::publish')
        this.publish('messenger::publish', { channel })
    }
    this.lastEmitTime = now
  }

  /**
   * Subscribe to a channel.
   * @param channel 
   * @param callback 
   */
  subscribe<T>(channel: string, callback: (arg: T) => void): void {
    const subscribers = this.channelMap[channel]
    const newSubscriber = { user: '', callback }
    if (subscribers && subscribers.length > 0) {
      subscribers.push(newSubscriber)
    } else {
      this.channelMap[channel] = [newSubscriber]
    }

    this.emitStatus()
  }

  unsubscribe(channel: string, callback: (arg: unknown) => void): void {
    const subscribers = this.channelMap[channel]
    if (subscribers && subscribers.length > 0) {
      for (let i = 0; i < subscribers.length; i++) {
        if (subscribers[i].callback === callback) {
          subscribers.splice(i, 1)
          break
        }
      }
    }

    this.emitStatus()
  }

  private emitStatus(): void {
    const channels = Object.entries(this.channelMap).map(channelInfo => {
      return {
        name: channelInfo[0],
        subNum: channelInfo[1].length
      }
    })
    this.publish('messenger::subscribe', { channels })
  }
}

/**
 * https://github.com/developit/mitt does the same thing.
 */