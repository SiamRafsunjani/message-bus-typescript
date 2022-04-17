import Bus from '../models/Bus';
import { raw } from 'objection';

interface RetriedMessages {
  target: string
}

export class BusService {
  async insertMessages(messages: any): Promise<number[] | boolean>  {
    try {
      const insertedMessages = await Bus.query()
                .insertGraph(messages) as any
      
      return insertedMessages.map((message: any) => { 
        return { id: message.id} 
      });

    } catch (error: any) {
      console.log(error)
      throw new Error(error.message)
    }
  }

  async getBusResultByAoId(ao_id: string): Promise<string | undefined> {
    try {
      const message = await Bus.query().where('ao_id', '=', ao_id).select('result')
      if (!message.length) return undefined;
      return message[0].result;

    } catch (error: any) {
      console.log(error)
      throw new Error(error.message)
    }
  }

  async consumeMessage(status: string, result: any, current: string, next: string) {
    const results = await Bus.transaction(async trx => {
      const results = []
      const currentResult = await Bus.query(trx)
        .update({ 
          status: status, 
          result: JSON.stringify(result), 
          received: raw(`NOW()`) 
        })
        .where('ao_id', '=', current)
      
       if (currentResult) results.push({target: 'current'})
      
      const nextResult = await Bus.query(trx)
        .update({ 
          status: 'consumable' 
        })
        .where('ao_id', '!=', '')
        .where('ao_id', '!=', 'NULL')
        .where('ao_id', '=', next)
        
      
      if (nextResult) results.push({target: 'next'})

      return results;
    });
    return results
  }

  async retryMessages(retry_departure: string, result: any, current: string ): Promise<RetriedMessages> {
    try {
      await Bus.query().update({
        departure: new Date(retry_departure),
        result: JSON.stringify(result),
        picked: null,
        status: 'consumable',
        received: raw('NOW()')
      })
      .where('ao_id', '=', current) as any
      
      return { target: 'current' };
    } catch (error: any) {
      throw Error(error.stack)
    }
    
  }

  async updateResultByAoId(ao_id:string, result: any) {
    try {
      await Bus.query()
      .update({
          result: JSON.stringify(result)
      })
      .where('ao_id', '=', ao_id)
      return { target: 'parent' };

    } catch (error: any) {
      throw Error(error.stack)
    }
  }
}