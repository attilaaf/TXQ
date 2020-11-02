import { Container } from 'typedi';
import { Logger } from 'winston';
//set the db connection here
//set the logger here

type Models = {};

export default ({ models, logger, db }: { models: Models[]; logger: Logger; db: any }) => {
  try {
    models &&
      models.forEach(model => {
        Container.set(model);
      });

    Container.set('logger', logger);
    Container.set('db', db);
  } catch (e) {
    console.log('🔥 Error on dependency injector loader %o', e);
    throw e;
  }
};
