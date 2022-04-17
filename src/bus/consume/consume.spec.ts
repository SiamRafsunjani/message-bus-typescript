import { Options } from './../../interfaces/options';
import { BusService } from './../../services/bus.service';
import { consume, runUpdates } from '../consume/consume';
import * as dotenv from "dotenv";
import path from 'path';
dotenv.config({path: path.join(__dirname, '../../..', 'database.env')})

import Knex from 'knex'
import knexConfig from '../../../knexfile';
import { Model } from 'objection'
const knex = Knex(knexConfig.development)
Model.knex(knex)

const busService = new BusService(); 

// describe("Check data sanity", () => {});
describe("check runUpdates functions", () => {
  test('Check updated data is returned as intended', async () => {
    const updates: any = [];
    const status = 'done';
    const result = {
      message: "Successfully placed order",
      orderId: 145711,

    };
    const current = 'ao_idxxszrfrlcafyjncyzkjsqaacyrwbfpszillixbkfdgqagvoecacbakinprssyjg'; 
    const next = 'ao_vocijyrzdonlfyveeikqriqympovmnskzicikteonpkoeohvxhvboyshwiiooytol';

    updates.push({
      func: busService.consumeMessage,
      arg: [status, result, current, next]
    })

    const results = await runUpdates(updates)

    expect(results[0]).toEqual(
      [{target: "current"}, {target: "next"}]
    )
  });
});

describe("check consume function", () => {
  test('Check updated data is returned as intended', async () => {
    const options: Options = {
      result: {
        __debug: 'Hello world'
      },
      req: {
        next: 'ao_nibqyeeldksoqyvqnaabsfktbfxzezqfqlbdkdzraoedbqeyesrvcslbbznjldwfw',
        ao_id: 'ao_ltexrzfdspdxnfebwelqqxfosneehrogiiclhsnaomghwxvjijdmhvvjyyxcpjlps',
        parent: 'ao_ltexrzfdspdxnfebwelqqxfosneehrogiiclhsnaomghwxvjijdmhvvjyyxcpjlps',
        tx_id: 'tx_amdafwphlqdbdprqvktnpryjt',
        payload: {
          quantity:10,
          productId:111
        },
        attempts: 1
      },
    } 
  
    const data = await consume(options)
    console.debug(data);

    expect(data).toEqual(true)
  });
});