export const routes = {
  'test': {
    get: { status: 200 },
  },
  'users/something': {
    delete(req: any, res: any) {
      return res.writeHead(301, 'google.ca');
    },
  },
};
