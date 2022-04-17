export interface Configuration {
  debugShow: {
    bus: boolean
  },
  bus: {
    host: {
      [key: string]: string;
    }
  }
}

export const config: Configuration = {
  debugShow: {
    bus: true,
  },
  bus: {
    host: {
      'order': 'newOrder',
      'payment': 'newPayment',
    }
  }
}