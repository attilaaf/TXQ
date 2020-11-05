export interface IAccountContext {
  projectId?: any;    //
  apiKey?: any;       // API key used by client to access data
  serviceKey?: any;   // Alternate key used by dashboard to make calls on behalf of client
  host?: string;
}
