import { 
  config as defaultConfig, 
  Configuration 
} from './../config/config';

export default class Logger {
  private config: Configuration;
  constructor(config: Configuration = defaultConfig) {
    this.config = config;
  }
  
  info(message: string, infos: any = null) {
    if(this.config.debugShow.bus && infos) console.log(`[bus-message] ${message}`, infos);
    else console.log(message);
  }

  error(message: string, error: Error) {
    if(this.config.debugShow.bus) console.log(`[bus-message] [error] ${message}`, error);
    throw error
  }
}