import { Model } from 'objection'

export default class Bus extends Model {
  static tableName = 'bus'
  
  id?: number
  related_to!: string
  tx_id!: string
  ao_id!: string
  source!: string
  status!: string
  url!: string
  departure!: Date
  parent!: string
  next!: string
  previous!: string
  path!: string
  payload!: string
  result!: string
  received!: Date
  picked!: string | null
  
  createdAt?: Date
  updatedAt?: Date

  static relationMappings = () => ({})
}