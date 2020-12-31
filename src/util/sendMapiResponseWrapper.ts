
export const sendMapiResponseWrapper = async (req: any, res: any, code: number, data: any) => {
  let rawData = {};
  if (data && data.result) {
    rawData = data.result;
  } else if (data) {
    rawData = data;
  }
  res.api.status = code || 200;
  res.status(res.api.status);
  res.api.result = rawData;
  res.send(rawData);
};
