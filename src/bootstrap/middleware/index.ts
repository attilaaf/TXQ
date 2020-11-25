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

  await dependencyInjectorLoader({
    models: [statusDI],
    logger,
    db,
  });

  applyMiddleware(expressMiddleware, app);

  applyMiddleware(apiDocs, app);

  applyRoutes(Routes, app);

  applyMiddleware(errorMiddleware, app);
  console.log(`Application bootstrap middleware loaded.`);

};
