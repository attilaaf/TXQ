
export const sendMapiErrorWrapper = async (res: any, code: number, error: any, ctx?: any) => {
  res.api.status = code || 500;
  res.status(res.api.status);
  res.api.errors.push(error.toString());
  res.send(res.api);
  console.log('sendMapiErrorWrapper', error, error.stack, 'ctx:', ctx);
};
