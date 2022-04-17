import { Options, Request } from './../../interfaces/options';
import moment from 'moment';
import Logger from "../../helpers/logger";
import { BusService } from "../../services/bus.service";
import groupBy from "lodash/groupBy";
import cloneDeep from "lodash/cloneDeep";
import { RETRY_MAX_ATTEMPTS, RETRY_INTERVAL_MINUTES } from '../../constants/retry' 

const log = new Logger();
const busService = new BusService()


export const is_parent = (message: Request): boolean => { 
  if( message && message.parent && message.ao_id && message.ao_id === message.parent) return true
  return false;
}

  // -- Back-off how many minutes to wait each try: 1, 2, 5, 10 then 15 minutes --
export const retryConsume = (req: any, result: any, current: string): any => {
  const retry_wait = RETRY_INTERVAL_MINUTES[req.tries__c - 1] || 15;
  const retry_departure = moment().add(retry_wait, 'minutes').toISOString();

  return {
    func: busService.retryMessages,
    arg: [retry_departure, result, current]
  }
}

export const runUpdates = async (updates: any) => {
  return await Promise.all(updates.map((update:any) => {
      return update.func(...update.arg)
    }
  ))
}

export const logResults = (
    updatedResult: any, trace: string, next: string | null, parent: string, current: string, req: Request
  ) => {
  if (!updatedResult.current || updatedResult.current.length !== 1) {
    log.info(
      `[${trace}][bus-message][error] only one current message should have been updated current:${current} | #updates: ${(updatedResult.current || {}).length} | updates: %j`, 
      updatedResult.current
    );
  }

  if (next && (!updatedResult.next || updatedResult.next.length !== 1)) {
    log.info(
      `[${trace}][bus-message][error] only one next message should have been updated next:${next} | #updates: ${(updatedResult.next || {}).length} | updates: %j`, 
      updatedResult.next
    );
  }

  if (!is_parent(req) && parent && (!updatedResult.parent || updatedResult.parent.length !== 1)) {
    log.info(
      `[${trace}][bus-message][error] only one parent message should have been updated parent:${parent} | #updates: ${(updatedResult.parent || {}).length} | updates: %j`, 
      updatedResult.parent
    );
  }

  log.info(`[${trace}][bus-message] sent acknowledgement current:${current} | next:${next}`);
}

export const consume = async (options: Options) => {
  try {
    let result = options.result || {};
    const req = options.req;
    const is_error = !!options.error;
    const status = is_error ? 'error' : 'received';
    const no_retry = is_error && !!options.no_retry;

    let { next } = req;
    const current = req.ao_id;
    const { parent } = req;
    const trace = req.tx_id || req.ao_id || 'no trace';
    // Internal options for the shot --
    const __options = (req.payload || {}).__options || {};

    // If shot passed silent parameter, we won't add any result output --
    if (__options.silent) { result = { __debug: null }; }

    log.info(`[${trace}][bus-message] consuming message request: %j | result: %j`, [req, result])

    // HACK for not sending acks if request comes from different source than bus --
    if (!req.tx_id || !current) {
      log.info(`[${trace}][bus-message] warning, no tx_id therefore we prevent acknowledgement request: %j | result: %j`,[req, result])    
      return;
    }
    // If there is an error we prevent further execution of messages in chain --
    if (is_error) {
      log.info(`[${trace}][bus-message] acknowledging an error, not scheduling next message in chain message_id: ${current}`)    
      next = null;
    }

    // -- Retrieve parent if it's defined --
    let parent_result = null;
    try {
      if (!is_parent(req) && parent) {
        // -- Look for parent and attach to message --
        log.info(`[${trace}][bus-message] looking for parent message current message: ${current} | parent: ${parent}`)    
        parent_result = busService.getBusResultByAoId(parent);
      }
    } catch (error: any) {
      log.error(
        `[${trace}][bus-message][error] parent not reachable for message: %j | error: ${error} | stack: %j`, (error || {}).stack
      )
    }

    // -- Debug info --
    const debug = cloneDeep(parent.__debug) || {};
    const debug_id = `message${debug.length + 1}`;
    debug[debug_id] = cloneDeep(result || {});

    // -- If current message is a parent then we store debug value --
    if (is_parent(req)) {
      result.__debug = debug;
    }

    // -- Updating current message and next one --
    log.info(`[${trace}][bus-message] updating current message with result: %o | next: ${next}`, result)    
    
    let updates = [];
    updates.push({
      func: busService.consumeMessage,
      arg: [status, result, current, next]
    })

    // -- If shot failed and retry option is enabled, we try resending up to 8 times --
    if (is_error && !no_retry && req.attempts <= RETRY_MAX_ATTEMPTS) {
      updates = retryConsume(req, result, current)
    }
    
    // -- If current Shot is not parent then merge result object with previously resolved and save in parent --
    if (!is_parent(req)) {
      // -- Merge result payloads and push to parent --
      parent_result = {...parent_result, ...result};
      parent_result.__debug = debug;

      log.info(`[${trace}][bus-message] updating parent message id:${parent} | current message: ${current} | result: %j`, result);

      updates.push({
        func: busService.updateResultByAoId,
        arg: [parent, result]
      })
    }

    try {
      log.info(
        `[${trace}][bus-message] sending acknowledgement current:${current} | next:${next} | is_error: ${is_error} - updates: %j`, 
        updates
      );

      let results = await runUpdates(updates);

      results = results.map((item: any) => item[0]);
      const updatedResult = groupBy(results, 'target');
      
      logResults(updatedResult, trace, next, parent, current, req)
      
      return true
    } catch (error: any) {
      log.error(
        `[${trace}][bus-message][error] acknowledgement couldn't be saved current:${current} | next:${next} | is_error: ${is_error} | error: ${error} | stack: %j`, (error || {}).stack
      );
    }
  } catch (error: any) {
    log.error('[bus-message][error] An error occurred', error);
  }
}