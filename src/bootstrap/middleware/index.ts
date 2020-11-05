import { Router } from 'express';
import expressMiddleware from './expressMiddleware';
import errorMiddleware from './errorMiddleware';
import dataMiddleware from './dataMiddleware';
import apiDocs from './apiDocs';
import { statusDI } from './di/diModel';
import dependencyInjectorLoader from './dependencyInjector';
import { applyMiddleware, applyRoutes } from './../../util';
import { logger } from './logger';
import db from './di/diContextFactory';
import Routes from './../../api/index';

export const middlewareLoader = async (app: Router) => {
  applyMiddleware(dataMiddleware, app);
  console.log(`Data handlers loaded`);

  await dependencyInjectorLoader({
    models: [statusDI],
    logger,
    db,
  });
  console.log('✌️ Dependency Injector loaded');

  applyMiddleware(expressMiddleware, app);
  console.log(`expressMiddleware loaded`);

  applyMiddleware(apiDocs, app);
  console.log(`Documentation loaded`);

  applyRoutes(Routes, app);
  console.log(`Routes loaded`);

  applyMiddleware(errorMiddleware, app);
  console.log(`Error handlers loaded`);

};
