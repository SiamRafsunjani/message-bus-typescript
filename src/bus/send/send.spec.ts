import { send, generateMessageSequence, mapMessages } from './send';
import * as dotenv from "dotenv";

// TODO: Move this into a generic DB connection 
import path from 'path';
dotenv.config({path: path.join(__dirname, '../../..', 'database.env')})

import Knex from 'knex'
import knexConfig from '../../../knexfile';
import { Model } from 'objection'
const knex = Knex(knexConfig.development)
Model.knex(knex)

describe("Check data sanity", () => {
  test('Check if data is empty', async () => {
    await expect( await send([])).toBe(undefined);
  });

  test('Check if data is not array', async () => {
    console.log = jest.fn();
    const message =  {
      related_to: 'test',
      tx_id: '23121',
      source: "arr3434",
      parent: "53wdeqw",
      departure: '2022-01-02',
      url: 'string',
      payload: '321313131',
      path: 'string'
    }
    await send(message)
    expect(console.log).toHaveBeenCalledWith(`[bus-message] send - single message | messages: %j`, [message]);
    await knex.destroy()
  });
});


describe("Test generateMessageSequence", () => {
  const messages = [
    {
      related_to: 'order', 
      source: 'order', 
      payload: {
        quantity: 100,
        productId: 20
      },
      path: 'orderApp',
      url: 'orderApp'
    },
    {
      related_to: 'order', 
      source: 'payment', 
      payload: {
        sellingPrice: 1000,
        liftingPrice: 800 
      },
      path: 'paymentApp',
      url: 'paymentApp'
    }
  ]
  const {tx_id, parent, linkedMessages} = generateMessageSequence(messages);

  test('Check if all the messages have ao_id, parent, and tx_id', async () => {
    expect(tx_id).toHaveLength(28)
    expect(parent).toHaveLength(68)
    expect(linkedMessages[0].ao_id).toHaveLength(68)
    expect(linkedMessages[1].ao_id).toHaveLength(68)
  })

  test('Check if all the linkups are correct', async () => {
    // Checking undefined to ensure backward compatibility
    expect(linkedMessages[1].next).toBe(undefined) 
    expect(linkedMessages[0].previous).toBe(undefined)

    expect(linkedMessages[1].previous).toBe(linkedMessages[0].ao_id)
    expect(linkedMessages[0].next).toBe(linkedMessages[1].ao_id)
  })
});

// describe('Test mapMessages', () => {
//   const {tx_id, parent, linkedMessages} = generateMessageSequence(messages);
  
//   mapMessages(tx_id, parent, linkedMessages)
// })
