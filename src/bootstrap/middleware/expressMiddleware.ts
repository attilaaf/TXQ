import { Router } from 'express';
import * as cors from 'cors';
import * as parser from 'body-parser';
import * as compression from 'compression';
import { handleHelmet } from './helmetMiddleware';
import { HandleLogger } from './logger';
import * as pretty from 'express-prettify';
const handleCors = (router: Router) => {
  // For mapi proxy we must set it in express-factory
  router.use(cors({
    origin: true
  }));
};

function defaultContentTypeMiddleware (req, res, next) {
  req.headers['content-type'] = req.headers['content-type'] || 'application/json';
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Headers', 'Content-Type,api_key');
  res.header('Access-Control-Allow-Methods', 'POST,GET,HEAD,DELETE,OPTIONS');
  next();
}

const handleBodyRequestParsing = (router: Router) => {
  router.use(defaultContentTypeMiddleware);
  router.use(parser.urlencoded({ extended: true, limit: '100mb'}));
  router.use(parser.json({limit: '100mb'}));
  router.use(parser.raw({limit: '100mb'}));
  router.use(pretty({ query: 'pretty' }));
};

const handleCompression = (router: Router) => {
  router.use(compression());
};

export default [handleCors, handleBodyRequestParsing, handleCompression, handleHelmet, HandleLogger];
