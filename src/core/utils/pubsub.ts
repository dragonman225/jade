export type PubSubAction = 'publish' | 'subscribe' | 'unsubscribe'

export interface PubSubAuditMessage {
  activeChannel: string
  action: PubSubAction
  channels: {
    name: string
    subNum: number
  }[]
}

export interface IPubSub {
  publish: <T>(channel: string, content?: T) => void
  subscribe: <T>(channel: string, callback: (arg: T) => void) => void
  unsubscribe: (channel: string, callback: (arg: unknown) => void) => void
}

export type ISub = Omit<IPubSub, 'publish'>

export type PubSubOptions = {
  auditChannel?: string
}

/**
 * https://github.com/developit/mitt does the same thing.
 */
export class PubSub implements IPubSub {
  private subscriberMap: {
    [channel: string]: {
      user: string
      callback: (arg: unknown) => void
    }[]
  }
  private lastEmitTime: number
  private auditChannel: string

  constructor(options: PubSubOptions = {}) {
    this.subscriberMap = {}
    this.lastEmitTime = 0
    this.auditChannel = options.auditChannel
  }

  /**
   * Publish to a channel.
   * @param channel
   * @param content
   */
  publish = <T>(channel: string, content?: T): void => {
    const subscribers = this.subscriberMap[channel]
    if (subscribers && subscribers.length > 0) {
      for (let i = 0; i < subscribers.length; i++) {
        subscribers[i].callback(content)
      }
    }
    const now = Date.now()
    if (now - this.lastEmitTime > 16) {
      /** Exclude the audit channel to prevent infinite loops. */
      if (channel !== this.auditChannel)
        this.publishAuditMessage('publish', channel)
    }
    this.lastEmitTime = now
  }

  /**
   * Subscribe to a channel.
   * @param channel
   * @param callback
   */
  subscribe = <T>(channel: string, callback: (arg: T) => void): void => {
    const subscribers = this.subscriberMap[channel]
    const newSubscriber = { user: '', callback }
    if (subscribers && subscribers.length > 0) {
      subscribers.push(newSubscriber)
    } else {
      this.subscriberMap[channel] = [newSubscriber]
    }

    this.publishAuditMessage('subscribe', channel)
  }

  unsubscribe = (channel: string, callback: (arg: unknown) => void): void => {
    const subscribers = this.subscriberMap[channel]
    if (subscribers && subscribers.length > 0) {
      for (let i = 0; i < subscribers.length; i++) {
        if (subscribers[i].callback === callback) {
          subscribers.splice(i, 1)
          break
        }
      }
    }

    this.publishAuditMessage('unsubscribe', channel)
  }

  private publishAuditMessage(action: PubSubAction, channel: string): void {
    /** Do not publish if `auditChannel` is not set. */
    if (!this.auditChannel) return

    const channels = Object.entries(this.subscriberMap).map(channelInfo => {
      return {
        name: channelInfo[0],
        subNum: channelInfo[1].length,
      }
    })
    this.publish<PubSubAuditMessage>(this.auditChannel, {
      activeChannel: channel,
      action,
      channels,
    })
  }
}
