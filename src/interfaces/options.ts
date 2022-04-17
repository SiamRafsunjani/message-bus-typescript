interface Result {
  __debug: string | null;
}

export interface Request {
  next: string | null,
  ao_id: string,
  parent: any,
  tx_id: string,
  payload: any,
  attempts: number
}

export interface Options {
  result: Result,
  req: Request,
  error?: any,
  no_retry?: number, 
}