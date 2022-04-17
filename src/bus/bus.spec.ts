import { send } from './bus';
import * as dotenv from "dotenv";
import path from 'path';
dotenv.config({path: path.join(__dirname, '../../..', 'database.env')})

import Knex from 'knex'
import knexConfig from '../../knexfile';
import { Model } from 'objection'
const knex = Knex(knexConfig.development)
Model.knex(knex)

describe("Check Send api", () => {
  test('Check if single message is created ', async () => {
    const message =  {
      related_to: 'orderService',
      source: "order",
      departure: '2022-04-16',
      url: 'string',
      payload: {
        quantity: 10,
        productId: 111
      },
      path: 'orderApp'
    }
    const result = await send(message)

    console.debug(result?.messages)

    expect(typeof result?.tx_id).toEqual('string');
    expect(result?.tx_id).toHaveLength(28);
    expect(typeof result?.parent).toEqual('string');
    expect(result?.parent).toHaveLength(68);
  });

  test('Check if multiple messages are created ', async () => {
    const message =  [{
      related_to: 'orderService',
      source: "order",
      departure: '2022-04-16',
      url: 'string',
      payload: {
        quantity: 10,
        productId: 111
      },
      path: 'orderApp'
    },
    {
      related_to: 'paymentService',
      source: "payment",
      url: 'string',
      payload: {
        sellingPrice: 1000,
        liftingPrice: 800
      },
      path: 'paymentApp'
    },
    {
      related_to: 'shipmentService',
      source: "shipment",
      url: 'string',
      payload: {
        address: 'House 39 Road 7 Hamilton road'
      },
      path: 'shipmentApp'
    },
    ]
    const result = await send(message) as any

    console.debug(result?.messages)

    expect(typeof result?.tx_id).toEqual('string');
    expect(result?.tx_id).toHaveLength(28);
    expect(typeof result?.parent).toEqual('string');
    expect(result?.parent).toHaveLength(68);
    expect(result?.messages).toHaveLength(3);

    expect(result?.messages[0].id).toBeGreaterThanOrEqual(1);
    expect(result?.messages[1].id).toBeGreaterThanOrEqual(1);
  });
  
});