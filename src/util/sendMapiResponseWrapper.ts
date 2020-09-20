
export const sendMapiResponseWrapper = async (req: any, res: any, code: number, data: any) => {
  res.api.status = code || 200;
  res.status(res.api.status);
  res.api.result = data;
  res.send(data.result ? data.result : data);
};
