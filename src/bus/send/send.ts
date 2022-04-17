import moment from 'moment';
import Logger from "../../helpers/logger";
import Message from '../../interfaces/messages';
import { util } from '../../helpers/randomGenerator';
import { config } from '../../config/config';
import { BusService } from "../../services/bus.service";

const log = new Logger();
const busService = new BusService()

export const generateMessageSequence = (messages: Message[]) => {
  const tx_id = messages[0].tx_id || util.generate_tx_id();
    
  messages.forEach((message) => {
    message.ao_id = util.generate_ao_id();
  });

  const parent = messages[0].parent || messages[0].ao_id;

  for (let i = 0; i < messages.length - 1; i++) {
    messages[i].next = messages[i + 1].ao_id;
  }

  for (let i = 1; i < messages.length; i++) {
    messages[i].previous = messages[i - 1].ao_id;
  }

  log.info(`send - creating messages tx_id: ${tx_id} | #messages: ${messages.length} | messages: %j`, messages)
  return { tx_id, parent, linkedMessages: messages};
}

export const mapMessages = ( tx_id: string, parent: string, linkedMessages: Message[]) => {
  const inserts = linkedMessages.map((linkedMessage: Message) => {
    
    const status = (linkedMessage.ao_id === parent || linkedMessage.departure) ? 'consumable' : 'new';
    const departure = linkedMessage.departure ? moment(linkedMessage.departure).toISOString() : null;
    const url = config.bus.host[linkedMessage.url] ? config.bus.host[linkedMessage.url] : linkedMessage.url;

    log.info(`send - sending insert SQL statement tx_id: ${tx_id} | statement: ${inserts} |`)
    return {
      ...linkedMessage, status, departure, url, tx_id, parent: parent
    }
  })

  return inserts;
} 

export const send = async (events: Message | Message[]) => {
  let messages: Message[] = [];
  try {
    // Validate data and format single entry into an array
    messages = messages.concat(events)
    if (!messages || !messages.length) {
      log.info('send - no messages to be sent | messages: %j', messages);
      return undefined;
    }
    if (!Array.isArray(events)) 
      log.info('send - single message | messages: %j', messages)
    // Generate aoId, txId, link up sequences  

    const { tx_id, parent, linkedMessages } = generateMessageSequence(messages)
    // Map messages to the table structure
    let inserts;
    if (parent) inserts = mapMessages(tx_id, parent, linkedMessages)
    else {
      log.info(`send - no parent id was found`);
      return undefined
    }
    // Insert data to the bus table
    const results = await busService.insertMessages(inserts)
    log.info(`
      send - successful message/s insertion tx_id: ${tx_id} | results: %j`, results
    );

    return {
      tx_id,
      parent,
      messages: results || [],
    }; 
  } catch (error) {
    log.error(
      `send - catch an error: ${error} | stack: %j`, (error || {} as any).stack
    )
  }
}
