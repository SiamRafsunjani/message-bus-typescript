import Message from 'src/interfaces/messages';
import { BusService } from './bus.service';
import moment from 'moment';
import * as dotenv from "dotenv";
import path from 'path';
dotenv.config({path: path.join(__dirname, '../..', 'database.env')})

import Knex from 'knex'
import knexConfig from '../../knexfile';
import { Model } from 'objection'
import Bus from '../models/Bus';
const knex = Knex(knexConfig.development)
Model.knex(knex)

describe("Check data Crud", () => {
  const busService = new BusService();
  test('Basic Data insertion', async () => {
    const messages: Message[] = [
      {
        related_to: "order",
        source: "order",
        tx_id: "12345",
        ao_id: "1235678",
        parent: "123",
        departure: moment('2022-01-01').toISOString(),
        next: "1235679",
        previous: '125661',
        url: 'http://test.com',
        payload: 'Hello world',
        path: 'orderPayment' 
      },
      {
        related_to: "order",
        source: "order",
        tx_id: "12345",
        ao_id: "1235679",
        parent: "123",
        departure: moment('2022-01-01').toISOString(),
        next: "1235680",
        previous: '1235678',
        url: 'http://test.com',
        payload: 'Hello world',
        path: 'orderPayment' 
      },
      {
        related_to: "order",
        source: "order",
        tx_id: "12345",
        ao_id: "1235680",
        parent: "123",
        departure: moment('2022-01-01').toISOString(),
        next: "125666",
        previous: '125661',
        url: 'http://test.com',
        payload: 'Hello world',
        path: 'orderPayment' 
      }
    ]
    const ids = await busService.insertMessages(messages);
    expect(ids).toHaveLength(3)
  });

  test('Get Bus by ao_id if exists', async () => {
    const expectedResult = '"Done properly"'
    const result = await busService.getBusResultByAoId('ao_ozwpyxvgdftrmoggshtzmmbsmarmftwvhkercztyjwopfpinadxgzhbggmbknamle');
    expect(result).toBe(expectedResult);
  });

  test('Get Bus by ao_id if result does not exist', async () => {
    const result = await busService.getBusResultByAoId('No result');
    expect(result).toBe(undefined);
  });

  test('Update a message and put next one to consumable', async () => {
    await busService.consumeMessage(
      'done', 'Done properly', 
      'ao_ozwpyxvgdftrmoggshtzmmbsmarmftwvhkercztyjwopfpinadxgzhbggmbknamle', 
      'ao_ihhqjmvxdzzsvaavdzzbypabggdghrwacmzcygpwyzryoldrpvgtgxyqfgiwlwnep'
    );
    const updatedCurrent = await Bus.query().where('ao_id', '=', 'ao_ozwpyxvgdftrmoggshtzmmbsmarmftwvhkercztyjwopfpinadxgzhbggmbknamle').select('status');
    const updatedNext = await Bus.query().where('ao_id', '=', 'ao_ihhqjmvxdzzsvaavdzzbypabggdghrwacmzcygpwyzryoldrpvgtgxyqfgiwlwnep').select('status');
    
    expect(updatedCurrent[0].status).toBe('done');
    expect(updatedNext[0].status).toBe('consumable');
  });

  test('Update a message to be retried later', async() => {
    const messageToBeRetriedLater = await busService.retryMessages(
      moment().add(1, 'minutes').toISOString(),
      "hello world",
      'ao_ihhqjmvxdzzsvaavdzzbypabggdghrwacmzcygpwyzryoldrpvgtgxyqfgiwlwnep'
    )
    
    expect(messageToBeRetriedLater.target).toBe('current');
  })
  
});

// describe("Check message order, aoId and txId", () => {})
