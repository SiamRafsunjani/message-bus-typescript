import randomstring from 'randomstring';
import { RANDOM_STRING_SEED } from '../constants/constants';

const randomString = (length: number) => randomstring.generate({
  length,
  charset: RANDOM_STRING_SEED,
});

export const util = {
  generate_tx_id: () => `tx_${randomString(25)}`,
  generate_ao_id: () => `ao_${randomString(65)}`,
}
