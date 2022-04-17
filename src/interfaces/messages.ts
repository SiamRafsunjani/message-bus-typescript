export default interface Message {
  related_to: string;
  source: string;
  tx_id?: string;
  ao_id?: string;
  parent?: string;
  departure?: string;
  next?: string;
  previous?: string;
  url: string;
  payload: any;
  path: string 
}
