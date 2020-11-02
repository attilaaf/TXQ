
export const sendMapiErrorWrapper = async (res: any, code: number, error: string) => {
  res.api.status = code || 500;
  res.status(res.api.status);
  res.api.errors.push(error.toString());
  res.send(res.api);
};
