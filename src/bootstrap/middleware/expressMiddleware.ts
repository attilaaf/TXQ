import { Router } from 'express';
import * as cors from 'cors';
import * as parser from 'body-parser';
import * as compression from 'compression';
import { handleHelmet } from './helmetMiddleware';
import { HandleLogger } from './logger';
import * as pretty from 'express-prettify';
const handleCors = (router: Router) => {
  router.use(cors({
    origin: true
  }));
  router.options('*', cors());
  router.get('*', cors());
  router.post('*', cors());
};

function defaultContentTypeMiddleware (req, res, next) {
  req.headers['content-type'] = req.headers['content-type'] || 'application/json';
  next();
}

const handleBodyRequestParsing = (router: Router) => {
  router.use(defaultContentTypeMiddleware);
  router.use(parser.urlencoded({ extended: true }));
  router.use(parser.json({limit: '50mb'}));
  router.use(pretty({ query: 'pretty' }));

};


const handleCompression = (router: Router) => {
  router.use(compression());
};

export default [handleCors, handleBodyRequestParsing, handleCompression, handleHelmet, HandleLogger];
