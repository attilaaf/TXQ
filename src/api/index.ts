import TxRoute from './v1/tx/index';
import QueueRoute from './v1/queue/index';
import TxoutRoute from './v1/txout/index';
import TxoutgroupRoute from './v1/txoutgroup/index';
import ChannelRoute from './v1/channel/index';
import SSERoute from './v1/sse/index';
import MapiRoute from './v1/mapi/index';
import TxstoreRoute from './v1/txstore/index';
import SystemRoute from './system/status/index';
import AssetRoute from './v1/assets/index';
import BlockfilterRoute from './v1/txfilter/index';
import StatsRoute from './v1/stats/index';

export default [
    ...TxRoute, ...QueueRoute, ...TxoutRoute, ...ChannelRoute, ...SSERoute,
    ...TxoutgroupRoute, ...MapiRoute, ...SystemRoute, ...TxstoreRoute, ...AssetRoute, ...BlockfilterRoute, ...StatsRoute
];
