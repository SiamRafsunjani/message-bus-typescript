import * as dotenv from "dotenv";
import path from 'path';
dotenv.config({path: path.join(__dirname, '../..', 'database.env')})

import Knex from 'knex'
import knexConfig from '../../knexfile';
import { Model } from 'objection'
const knex = Knex(knexConfig.development)
Model.knex(knex)

import { send } from "./send/send"; 
// import { consume } from "./consume/consume"; 
import { util } from '../helpers/randomGenerator'

const error = () => {
  console.log('util')
} 

export {
  send, 
  // consume,
  util,
  error
};