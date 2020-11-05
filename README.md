# TXQ: Bitcoin Transaction Storage Queue Service
> Self-hosted Bitcoin BSV transaction publisher, storage and UTXO indexer for developers.
>
> LICENSE: MIT
>
> <a href='https://matterpool.io'>matterpool.io</a>

#### LIVE OPEN PUBLIC (US-WEST-2) SERVER: <a target="_blank" href='https://public.txq-app.com/api/v1/tx/dc7bed6c302c08b7bafd94bfb1086883a134861fe9f212fc8052fcaadcde2293?pretty=1'>PUBLIC.TXQ-APP.COM
</a>

![TXQ](https://github.com/MatterPool/TXQ/blob/master/preview.png "Bitcoin Transaction Storage Queue Service")

- [Motivation](#motivation)
- [Installation & Getting Started](#installation---getting-started)
- [Database](#database)
- [Configuration](#configuration)
    + [NOTE: Configure to use 'testnet' by setting network: 'testnet' or leave undefined (mainnet)](#note--configure-to-use--testnet--by-setting-network---testnet--or-leave-undefined--mainnet-)
- [TXQ Design Overview...](#txq-design-overview)
- [Why use TXQ?](#why-use-txq-)
- [Features](#features)
  * [Single Source of Truth](#single-source-of-truth)
  * [Automatically Sync with Miners (Merchant API)](#automatically-sync-with-miners--merchant-api-)
  * [Self-Managed UTXO and Transaction Indexing](#self-managed-utxo-and-transaction-indexing)
  * [Publish and Subscribe Server Sent Events (SSE)](#publish-and-subscribe-server-sent-events--sse-)
- [REST API Documentation](#rest-api-documentation)
  * [Submit Transaction](#submit-transaction)
  * [Get Transaction Status](#get-transaction-status)
  * [Get Transaction Status With Channel Metadata](#get-transaction-status-with-channel-metadata)
  * [Get Transactions for Default (null) Channel](#get-transactions-for-default--null--channel)
  * [Get Transactions for Channel](#get-transactions-for-channel)
  * [Get Outpoint Spend Status](#get-outpoint-spend-status)
  * [Get Outpoints Spend Status (Batch)](#get-outpoints-spend-status--batch-)
  * [Get Address Outputs](#get-address-outputs)
  * [Get Address Unspent Outputs (UTXO)](#get-address-unspent-outputs--utxo-)
  * [Get Balance By Address](#get-balance-by-address)
  * [Get Scripthash Outputs](#get-scripthash-outputs)
  * [Get Scripthash Unspent Outputs (UTXO)](#get-scripthash-unspent-outputs--utxo-)
  * [Get Balance By Scripthash](#get-balance-by-scripthash)
  * [Add Address or Scripthash to Output Group](#add-address-or-scripthash-to-output-group)
  * [Get Output Group](#get-output-group)
  * [Get Output Groups by Scriptid](#get-output-groups-by-scriptid)
  * [Delete Address or Scripthash from Output Group](#delete-address-or-scripthash-from-output-group)
  * [Get Outputs By Group](#get-outputs-by-group)
  * [Get Unspent Outputs By Group (UTXO)](#get-unspent-outputs-by-group--utxo-)
  * [Get Balance By Group](#get-balance-by-group)
  * [Get Queue Stats](#get-queue-stats)
  * [Get Dead-Letter Transactions Queue](#get-dead-letter-transactions-queue)
  * [Requeue Transactions in Dead-Letter Queue](#requeue-transactions-in-dead-letter-queue)
  * [Force Resync of Transaction](#force-resync-of-transaction)
  * [Get Queue Tasks by Sync Status](#get-queue-tasks-by-sync-status)
- [Server Sent Events (SSE)](#server-sent-events--sse-)
  * [New Transactions Stream (Default channel)](#new-transactions-stream--default-channel-)
  * [New Transactions Stream (Custom Channel)](#new-transactions-stream--custom-channel-)
  * [New and Updated Transactions Stream (Default channel)](#new-and-updated-transactions-stream--default-channel-)
  * [New and Updated Transactions Stream (Custom Channel)](#new-and-updated-transactions-stream--custom-channel-)
  * [Merchant API Log Stream](#merchant-api-log-stream)
  * [Address Updates Stream](#address-updates-stream)
  * [Scripthash Updates Stream](#scripthash-updates-stream)
  * [Output Group Updates Stream](#output-group-updates-stream)
- [Merchant API Proxy (mapi)](#merchant-api-proxy--mapi-)
  * [Storing `channel`, `metadata`, and `tags`](#storing--channel----metadata---and--tags-)
  * [Query Primary Miner Merchant API](#query-primary-miner-merchant-api)
  * [Query Specific Miner Merchant API](#query-specific-miner-merchant-api)
  * [Query by Index of Miner Merchant API](#query-by-index-of-miner-merchant-api)
- [Database Schema and Design](#database-schema-and-design)
- [Additional Resources](#additional-resources)


## Motivation

In order for Bitcoin SV apps to scale efficiently as traditional web services, apps must communicate directly with each other where possible and not rely on extra intermediaries.

Not all Bitcoin miners or transaction processors will maintain a full transaction index for public consumption. Some will instead opt to run so called "transaction pruning" nodes and instead specialize in other ways than offering data storage and indexing services.

**TXQ decouples your application from miners and other Bitcoin service providers.**

It's easy and extremely cost effective for services to simply index their own Bitcoin transactions and have the "single source of truth" be ready at hand and according to their backup needs.

TXQ makes it easy for developers to keep their entire application transaction history in their direct control or even on premise.
At the same time, transaction sending is now "fire and forget" annd synchronization with miners happens automatically via Merchant API.

![TXQ architecture](https://github.com/MatterPool/TXQ/blob/master/TXQ.png "Bitcoin Transaction Storage Queue Service")

## Installation & Getting Started

Requirements:
- Node 10.19+
- Postgres 10.6+

[NodeJS](https://nodejs.org/en/)

Install global TypeScript and TypeScript Node

```
npm install -g typescript ts-node
```

**Setup and Run**

Copy `.env.example` to `.env` for productionn environment. See database instructions below.

Install deps:

```
npm install
```

Developer testing:
```
npm run start-dev
```

Production build:

```
npm run build
```

Production run:
```
node ./dist/bootstrap/index.js
```

Testing:
```
jest
```

## Database

Initial Schema:

`src/database/202006210000-init-schema.sql`

Migrations:

- None

## Configuration

#### NOTE: Configure to use 'testnet' by setting network: 'testnet' or leave undefined (mainnet)

See `cfg/config.sample.js` for available options.

## TXQ Design Overview...

![TXQ architecture](https://github.com/MatterPool/TXQ/blob/master/TXQ.png "Bitcoin Transaction Storage Queue Service")

- Complete transaction storage engine (self-hosted)
- Automatic Merchant API (mapi) sending queue
- Search UTXO by address, scripthash, txoutput,
- Address and scripthash history
- Forward-Spend Indexes (For NFT colored coins implementations)

*Enterprise ready*

**Relational Database (Postgres)**
- Using as **ACID compliant "NoSQL" (join-less)** datastore and leveraging `jsonb`
- Powerful custom indexes for precisely what your service requires.

**Easy to integrate API and Real-time Sockets**
- TXQ exposes a simple, yet powerful API for storing, sending and streaming transactions to peers
- Server-Sent Events (SSE)

**Open Source and Schema**
- MIT License
- Domain Driven Design Architecture (Use Cases)
- Simple and extendible open SQL database schema

**Enterprise and Paid Hosting**
- <a href='https://matterpool.io'>matterpool.io</a>
- <a href='mailto:attila@matterpool.io?subject=TXQ'>Email Us</a>

## Why use TXQ?

**TL;DR**: Sending transactions is now "fire and forget". TXQ is a concurrent work queue that synchronizes transaction status with miners automatically — so you, the developer, do not have to worry it. TXQ complements your infrastructure and gives you full control over your apps slice of the BSV blockchain universe. Out-of-the-box you have your own TX and UTXO indexer for addresses, scripthashes, outpoints and spend indexes. Transaction processors (miners) now can focus on building and time-stamping blocks and leave it to apps to backup and own their own transaction data.

Up until now, Bitcoin SV "apps" relied on miners and blockchain cloudhosting services to get UTXO and transaction data. TXQ means app developers do not need to rely on 3rd parties for UTXO and transaction data &mdash; as long as all transactions of interest are saved to TXQ. That's it.

In order for Bitcoin SV applications to be able to scale as efficiently as traditional web services, the applications must be able to interoperate peer-to-peer and not rely on extra intermediaries.

To scale, Bitcoin applications must act more like peers and use the `rawtx` format as the **application data medium of exchange**.  Each service provider will maintain a copy of the `rawtx` for all transactions in traditional storage and backed up to their policy.

TXQ abstracts the transaction settlement process with miners so developers focus on building and integrating your applications.

## Features

### Single Source of Truth

Provide your application and services with a consistent picture of it's "Bitcoin State" without relying on 3rd parties for lookups and indexing.

### Automatically Sync with Miners (Merchant API)

Reliably broadcast transactions to a set of miners to get them reliably settled. Queue configuration options allow customizing the concurrency limit, exponential back off, and other behaviors.

All Merchant API requests are logged to the database and also streamed in real-time to the SSE event interface.

### Self-Managed UTXO and Transaction Indexing

TXQ automatically stores and indexes UTXOs and transactions without relying on miners and cloud providers.
Your businness always has transaction history and UTXOs ready-at-hand and can easily scale with no miner or vendor lock-in.

### Publish and Subscribe Server Sent Events (SSE)

Easily connect TXQ with your other services via SSE sockets for subscribing to new transactions and events in real-time.

## REST API Documentation

Try it at: `https://public.txq-app.com`

Example:

<a href='https://public.txq-app.com/api/v1/tx/dc7bed6c302c08b7bafd94bfb1086883a134861fe9f212fc8052fcaadcde2293?pretty=1'>https://public.txq-app.com/api/v1/tx/dc7bed6c302c08b7bafd94bfb1086883a134861fe9f212fc8052fcaadcde2293?pretty=1</a>


### Submit Transaction

Save a transaction and/or txid, attaching optional metadata. The txid must match the rawtx's txid.

NOTE: To only store the trasaction and not attempt to broadcas or get miner status set `nosync: true` (See example below)

`POST /api/v1/tx`

```javascript

//Request:
// Note: you can set multiple transactions in a single call
{
   "channel": null, // Optional channel queue name
   "set":{
      "94aaa2f1a7e0042ba19fbb8bb87be87ecb8d025aa88844b8bea85eb7cb2d678d":{
        "rawtx": "0100000002af6d598d7ee12bec6b20e460e97b99d048ea6c73bab291827e42dd99ba34704d020000006a47304402203b9b01392167dfd15259d5f7782521852809a384b30f44b8009fa516a4e76fe0022006cbae89516bdb5a3c135aefaf29cdfa7545b5f2ea9d6394e8689735a040d575412102119ebe4639964590bcf358539740f8ea4b6546b8416cbbbf6de12fafd3a13d1affffffffaf6d598d7ee12bec6b20e460e97b99d048ea6c73bab291827e42dd99ba34704d010000006b483045022100bb1c98453c2ea76eee6ee17a1961a9b8b418d1a0a0ee4b1c8b19d7f45d4bba9a02201a7d259ff8203c357ba5dcdb5141f9fd2b35f167429e556c6ea90cf8d534928a412102119ebe4639964590bcf358539740f8ea4b6546b8416cbbbf6de12fafd3a13d1affffffff02000000000000000019006a026d0213706f73746420746f206d6465646464646d6f21089d0000000000001976a914161e9c31fbec37d9ecb297bf4b814c6e189dbe5288ac00000000",
         "metadata":{
            "title":"some title",
            "content":"any content",
            "url":"https://www.nintendo.com",
            "image":"",
            "description":"DOOOOOO"
         },
         "tags":[ "bitcoin", "bsv"],
         "nosync": false // Set to true to not attempt synchronizing
      }
   }
}

// Response:
// Note: you can set multiple transactions in a single call
{
    "status": 200,
    "errors": [],
    "result": [
        "94aaa2f1a7e0042ba19fbb8bb87be87ecb8d025aa88844b8bea85eb7cb2d678d"
    ]
}
```

### Get Transaction Status

`GET /api/v1/tx/94aaa2f1a7e0042ba19fbb8bb87be87ecb8d025aa88844b8bea85eb7cb2d678d?pretty`

Params:
- pretty: whether to pretty print

Retrieve the transaction status and metadata for the `null` default channel. `complete` will be set to `true` when the transaction is confirmed.

```javascript

// Response:
{
  "status": 200,
  "errors": [],
  "result": {
    "txid": "94aaa2f1a7e0042ba19fbb8bb87be87ecb8d025aa88844b8bea85eb7cb2d678d",
    "rawtx": "0100000002af6d598d7ee12bec6b20e460e97b99d048ea6c73bab291827e42dd99ba34704d020000006a47304402203b9b01392167dfd15259d5f7782521852809a384b30f44b8009fa516a4e76fe0022006cbae89516bdb5a3c135aefaf29cdfa7545b5f2ea9d6394e8689735a040d575412102119ebe4639964590bcf358539740f8ea4b6546b8416cbbbf6de12fafd3a13d1affffffffaf6d598d7ee12bec6b20e460e97b99d048ea6c73bab291827e42dd99ba34704d010000006b483045022100bb1c98453c2ea76eee6ee17a1961a9b8b418d1a0a0ee4b1c8b19d7f45d4bba9a02201a7d259ff8203c357ba5dcdb5141f9fd2b35f167429e556c6ea90cf8d534928a412102119ebe4639964590bcf358539740f8ea4b6546b8416cbbbf6de12fafd3a13d1affffffff02000000000000000019006a026d0213706f73746420746f206d6465646464646d6f21089d0000000000001976a914161e9c31fbec37d9ecb297bf4b814c6e189dbe5288ac00000000",
    "h": "00000000000000000324d7ada9f810f08b254dffce4786bc4cf30374ee23a4db",
    "i": 640259,
    "send": null,
    "status": {
      "valid": true,
      "payload": {
        "minerId": "0211ccfc29e3058b770f3cf3eb34b0b2fd2293057a994d4d275121be4151cdf087",
        "blockHash": "00000000000000000324d7ada9f810f08b254dffce4786bc4cf30374ee23a4db",
        "timestamp": "2020-06-21T01:02:42.952Z",
        "apiVersion": "0.1.0",
        "blockHeight": 640259,
        "returnResult": "success",
        "confirmations": 25,
        "resultDescription": "",
        "txSecondMempoolExpiry": 0
      },
      "encoding": "UTF-8",
      "mimetype": "application/json",
      "publicKey": "0211ccfc29e3058b770f3cf3eb34b0b2fd2293057a994d4d275121be4151cdf087",
      "signature": "30440220281148a447cf041fcebfeba8bba0ad022299d321a6dc7641b3ad54239f505eaf02207cffd042ebb18285e7160429fe51fb9bcac005b04469877248afdc509e41de61"
    },
    "completed": true,
    "updated_at": 1592765256,
    "created_at": 1592697895,
    "channel": "",
    "id": 43, // stream message identifier
    "metadata":{
        "title":"some title",
        "content":"any content",
        "url":"https://www.nintendo.com",
        "image":"",
        "description":"DOOOOOO"
    },
    "tags":[ "bitcoin", "bsv"]
    "extracted": {}
  }
}
```

### Get Transaction Status With Channel Metadata

`GET /api/v1/tx/94aaa2f1a7e0042ba19fbb8bb87be87ecb8d025aa88844b8bea85eb7cb2d678d/channel/somechannelchannel?pretty`

Params:
- pretty: whether to pretty print

Retrieve the transaction status and metadata for the `somechannelchannel` default channel. `complete` will be set to `true` when the transaction is confirmed.

```javascript

// Response:
{
  "status": 200,
  "errors": [],
  "result": {
    "txid": "94aaa2f1a7e0042ba19fbb8bb87be87ecb8d025aa88844b8bea85eb7cb2d678d",
    "rawtx": "0100000002af6d598d7ee12bec6b20e460e97b99d048ea6c73bab291827e42dd99ba34704d020000006a47304402203b9b01392167dfd15259d5f7782521852809a384b30f44b8009fa516a4e76fe0022006cbae89516bdb5a3c135aefaf29cdfa7545b5f2ea9d6394e8689735a040d575412102119ebe4639964590bcf358539740f8ea4b6546b8416cbbbf6de12fafd3a13d1affffffffaf6d598d7ee12bec6b20e460e97b99d048ea6c73bab291827e42dd99ba34704d010000006b483045022100bb1c98453c2ea76eee6ee17a1961a9b8b418d1a0a0ee4b1c8b19d7f45d4bba9a02201a7d259ff8203c357ba5dcdb5141f9fd2b35f167429e556c6ea90cf8d534928a412102119ebe4639964590bcf358539740f8ea4b6546b8416cbbbf6de12fafd3a13d1affffffff02000000000000000019006a026d0213706f73746420746f206d6465646464646d6f21089d0000000000001976a914161e9c31fbec37d9ecb297bf4b814c6e189dbe5288ac00000000",
    "h": "00000000000000000324d7ada9f810f08b254dffce4786bc4cf30374ee23a4db",
    "i": 640259,
    "send": null,
    "status": {
      "valid": true,
      "payload": {
        "minerId": "0211ccfc29e3058b770f3cf3eb34b0b2fd2293057a994d4d275121be4151cdf087",
        "blockHash": "00000000000000000324d7ada9f810f08b254dffce4786bc4cf30374ee23a4db",
        "timestamp": "2020-06-21T01:02:42.952Z",
        "apiVersion": "0.1.0",
        "blockHeight": 640259,
        "returnResult": "success",
        "confirmations": 25,
        "resultDescription": "",
        "txSecondMempoolExpiry": 0
      },
      "encoding": "UTF-8",
      "mimetype": "application/json",
      "publicKey": "0211ccfc29e3058b770f3cf3eb34b0b2fd2293057a994d4d275121be4151cdf087",
      "signature": "30440220281148a447cf041fcebfeba8bba0ad022299d321a6dc7641b3ad54239f505eaf02207cffd042ebb18285e7160429fe51fb9bcac005b04469877248afdc509e41de61"
    },
    "id": 43,
    "completed": true,
    "updated_at": 1592765256,
    "created_at": 1592697895,
    "channel": "",
    "metadata":{
        "title":"some title",
        "content":"any content",
        "url":"https://www.nintendo.com",
        "image":"",
        "description":"DOOOOOO"
    },
    "tags":[ "bitcoin", "bsv"]
    "extracted": {}
  }
}
```

### Get Transactions for Default (null) Channel

`GET /api/v1/channel?pretty=1&rawtx=1&id=0&limit=1000`

Params:
- id: select including and after this id
- rawtx: whether to include rawtx
- limit: results returned
- pretty: whether to pretty print

Retrieve the transactions from most recently added in the default `null` channel queue

```javascript

// Response:
{
  "status": 200,
  "errors": [],
  "result": [
    {
      "txid": "4d7034ba99dd427e8291b2ba736cea48d0997be960e4206bec2be17e8d596daf",
      "i": 640259,
      "h": "00000000000000000324d7ada9f810f08b254dffce4786bc4cf30374ee23a4db",
      "rawtx": "0100000001f743dd880dde880b0e5baf3403352c25005ad94fcafc79abc35d2ee52a212bd4020000006b483045022100aff74f1335bbc691cc62c7405a77c09744626363397dc47cfe97e235e5a0143102203357855791f03b4ae3332808f9964af8f24e0b63e7bd32f6788f77e2d2da7b50412102119ebe4639964590bcf358539740f8ea4b6546b8416cbbbf6de12fafd3a13d1affffffff03000000000000000019006a026d0213706f73746420746f206d6465646464646d6f2168100000000000001976a914161e9c31fbec37d9ecb297bf4b814c6e189dbe5288acc58d0000000000001976a914161e9c31fbec37d9ecb297bf4b814c6e189dbe5288ac00000000",
      "send": null,
      "status": {
        "valid": true,
        "payload": {
          "minerId": "0211ccfc29e3058b770f3cf3eb34b0b2fd2293057a994d4d275121be4151cdf087",
          "blockHash": "00000000000000000324d7ada9f810f08b254dffce4786bc4cf30374ee23a4db",
          "timestamp": "2020-06-21T01:02:41.139Z",
          "apiVersion": "0.1.0",
          "blockHeight": 640259,
          "returnResult": "success",
          "confirmations": 25,
          "resultDescription": "",
          "txSecondMempoolExpiry": 0
        },
        "encoding": "UTF-8",
        "mimetype": "application/json",
        "publicKey": "0211ccfc29e3058b770f3cf3eb34b0b2fd2293057a994d4d275121be4151cdf087",
        "signature": "304402204e4d4d8e03182a80608f7a583db008a783d40895a67339e3576b9abf09e6992c022047b5eb1de9103ed628f4accfce632755921527f3306831d346f0936c5fcd6026"
      },
      "completed": true,
      "updated_at": 1592701751,
      "created_at": 1592701361,
      "channel": "",
      "metadata": {
        "url": "url",
        "image": "adfsfsdfsdfdf",
        "title": "abc",
        "content": "content123",
        "description": "DOOOOOO"
      },
      "tags": [
        "ckitty",
        "cat"
      ],
      "extracted": {}
    }
  ]
}
```

### Get Transactions for Channel

`GET /api/v1/channel/:channel?pretty=1&rawtx=1&id=0&limit=1000`

Params:
- id: select including and after this id
- rawtx: whether to include rawtx
- limit: results returned
- pretty: whether to pretty print

Retrieve the transactions from most recently added in the default `:channel` channel queue

```javascript

// Response:
{
  "status": 200,
  "errors": [],
  "result": [
    {
      "txid": "dc7bed6c302c08b7bafd94bfb1086883a134861fe9f212fc8052fcaadcde2293",
      "i": 640464,
      "h": "000000000000000000e3564e4a8d9be13fb24cb21d546cb999d514c650c3b2dc",
      "rawtx": "0200000003c3be676ae826227bcff47e605bdffff85c4aa42e3c868e4dfad9a97e2244aef5000000006a4730440220692e3f1fb99e26e494c8e446621584564e67e1388b06e7be769f3adde6b5c3c60220148e97efbc41dda03d80de2249be68c332b12ff7148e61847a72e93eee2e06864121037e7bcc2cdc24646fd8e320c74f156367027c1b67564c0dee420262eca71fca56feffffffd8fa56930181c8431c4d7d503d8b5d5948f22e4c9311d3fb19847b2318dd227d010000006b483045022100f5b8bf9905e5ec051573fd522c522295a5944e460255869dba427f64e6a094d3022032cbb4814b62daf1647570a35903f211143e3d82a8446986761612910936b95c4121037e7bcc2cdc24646fd8e320c74f156367027c1b67564c0dee420262eca71fca56feffffff1c2067e5d0212cc015e3ece148c218008a44eff32a5f6eb4acc238477d9e034a010000006a47304402205d525e4846f964c69c8d830fd9a1823e78ba3085d95405071e822136576326a40220676a18f3e0eb77ff1e9a2b91d54a61cc9642745e2dd55dd0564122010db2266f4121037e7bcc2cdc24646fd8e320c74f156367027c1b67564c0dee420262eca71fca56feffffff022f130873070000001976a914a1f93cb1d124a82f8f86b06ef97a4fd6d77c04e288aca6386727000000001976a9140ca78f443c75e178674bd40337e9fe7f8745cbc088ac9f860100",
      "send": null,
      "status": {
        "valid": true,
        "payload": {
          "minerId": "0211ccfc29e3058b770f3cf3eb34b0b2fd2293057a994d4d275121be4151cdf087",
          "blockHash": "000000000000000000e3564e4a8d9be13fb24cb21d546cb999d514c650c3b2dc",
          "timestamp": "2020-06-22T10:05:15.165Z",
          "apiVersion": "0.1.0",
          "blockHeight": 640464,
          "returnResult": "success",
          "confirmations": 1,
          "resultDescription": "",
          "txSecondMempoolExpiry": 0
        },
        "encoding": "UTF-8",
        "mimetype": "application/json",
        "publicKey": "0211ccfc29e3058b770f3cf3eb34b0b2fd2293057a994d4d275121be4151cdf087",
        "signature": "304402201029251d228486f7c2b100fb1fd519053b71480c15332d55e694ebb60baa906d02205a61406d5b4c55864381a4053484739fb01ce36f49179463731be442048863b1"
      },
      "completed": true,
      "updated_at": 1592820315,
      "created_at": 1592820315,
      "channel": "somechannelchannel",
      "metadata": {
        "url": "https://www.nintendo.com",
        "image": "",
        "title": "some title",
        "content": "any content",
        "description": "DOOOOOO"
      },
      "tags": [
        "bitcoin",
        "bsv"
      ],
      "extracted": {}
    }
  ]
}
```

### Get Outpoint Spend Status

`GET /api/v1/txout/txid/:txid/:index?pretty=1`

Params:
- txid: transaction to get outpoint
- index: transaction outpoint index
- pretty: whether to pretty print

Retrieve spent status of a txoutput (txid + index)

```javascript
{
  "status": 200,
  "errors": [],
  "result": {
    "txid": "dc7bed6c302c08b7bafd94bfb1086883a134861fe9f212fc8052fcaadcde2293",
    "index": 0,
    "script": "76a914a1f93cb1d124a82f8f86b06ef97a4fd6d77c04e288ac",
    "address": "1FmSNBWW2m6d6FDUWxDjaJo9jhNAs9Pekr",
    "scripthash": "ee7beac2fcc315b37f190530d743769f255b1d413edd6e51bbc003022753f909",
    "satoshis": 31994680111,
    "is_receive": true,
    "spend_txid": null,
    "spend_index": null
  }
}
```

### Get Outpoints Spend Status (Batch)

`GET /api/v1/txout/outpoints/:txouts?pretty=1`

Example: Use for `txouts` single outpoints like `dc7bed6c302c08b7bafd94bfb1086883a134861fe9f212fc8052fcaadcde2293_o0` or multiple: `dc7bed6c302c08b7bafd94bfb1086883a134861fe9f212fc8052fcaadcde2293_o0,dc7bed6c302c08b7bafd94bfb1086883a134861fe9f212fc8052fcaadcde2293_o0`

`https://public.txq-app.com/api/v1/txout/txid/39e6f4652c9464eae17219d2c9ed031e917942fc3539ba98ce1639df024659cc_o0,39e6f4652c9464eae17219d2c9ed031e917942fc3539ba98ce1639df024659cc_o1?pretty=1`

Params:
- txouts: transaction outputs.  Ex: `dc7bed6c302c08b7bafd94bfb1086883a134861fe9f212fc8052fcaadcde2293_o0`
- index: transaction outpoint index
- pretty: whether to pretty print

Retrieve spent status of a txoutput (txid + index)

```javascript
{
  "status": 200,
  "errors": [],
  "result": [
    {
      "txid": "dc7bed6c302c08b7bafd94bfb1086883a134861fe9f212fc8052fcaadcde2293",
      "index": 0,
      "script": "76a914a1f93cb1d124a82f8f86b06ef97a4fd6d77c04e288ac",
      "address": "1FmSNBWW2m6d6FDUWxDjaJo9jhNAs9Pekr",
      "scripthash": "ee7beac2fcc315b37f190530d743769f255b1d413edd6e51bbc003022753f909",
      "satoshis": 31994680111,
      "is_receive": true,
      "spend_txid": null,
      "spend_index": null
    }
  ]
}
```

### Get Address Outputs

`GET /api/v1/txout/address/:address?pretty=1&offset=0&limit=1000`

**NOTE:** You can specify multiple addresses with the comma ',' example:

`GET /api/v1/txout/address/12k3rKTAsDFtydSJsKueMFxXAfAmfQGJqP,1KkjsX6d3cFiCKb6vcSAw3KAm41JdhjQkP?pretty=1&offset=0&limit=1000`

Params:
- offset: Skip this many outputs
- limit: results returned
- pretty: whether to pretty print

Retrieve outputs involving address. Note: receives are tracked only for now.

```javascript
{
  "status": 200,
  "errors": [],
  "result": [
    {
      "txid": "dc7bed6c302c08b7bafd94bfb1086883a134861fe9f212fc8052fcaadcde2293",
      "index": 0,
      "script": "76a914a1f93cb1d124a82f8f86b06ef97a4fd6d77c04e288ac",
      "address": "1FmSNBWW2m6d6FDUWxDjaJo9jhNAs9Pekr",
      "scripthash": "ee7beac2fcc315b37f190530d743769f255b1d413edd6e51bbc003022753f909",
      "satoshis": 31994680111,
      "is_receive": true,
      "spend_txid": null,
      "spend_index": null
    }
  ]
}
```

### Get Address Unspent Outputs (UTXO)

`GET /api/v1/txout/address/:address/utxo?pretty=1&offset=0&limit=1000`

**NOTE:** You can specify multiple addresses with the comma ',' example:

`GET /api/v1/txout/address/12k3rKTAsDFtydSJsKueMFxXAfAmfQGJqP,1KkjsX6d3cFiCKb6vcSAw3KAm41JdhjQkP/utxo?pretty=1&offset=0&limit=1000`

Params:
- offset: Skip this many outputs
- limit: results returned
- pretty: whether to pretty print

Retrieve outputs involving address. Note: receives are tracked only for now.

```javascript
{
  "status": 200,
  "errors": [],
  "result": [
    {
      "txid": "dc7bed6c302c08b7bafd94bfb1086883a134861fe9f212fc8052fcaadcde2293",
      "vout": 0,
      "outputIndex": 0,
      "value": 31994680111,
      "satoshis": 31994680111,
      "script": "76a914131c6436d67d360e0d56f5fd78f8eb8719e9b2e288ac",
      "address": "1FmSNBWW2m6d6FDUWxDjaJo9jhNAs9Pekr",
      "scripthash": "ee7beac2fcc315b37f190530d743769f255b1d413edd6e51bbc003022753f909"
    }
  ]
}
```

### Get Balance By Address

`GET /api/v1/txout/address/:addresses/balance?pretty=1`

Params:
- pretty: whether to pretty print

Retrieve the balance for addresses

```javascript
{
  "status": 200,
  "errors": [],
  "result": [
    {
      "confirmed": 432454,
      "unconfirmed": 0
    }
  ]
}
```

### Get Scripthash Outputs

`GET /api/v1/txout/scripthash/:scripthash?pretty=1&offset=0&limit=1000`


**NOTE:** You can specify multiple scripthashes with the comma ',' example:

`GET /api/v1/txout/scripthash/d4f225bdd856437e519cf65c1ec9a108b3c2d10f993cd5a66e5078792105eb7e,17f0fb74c18f2989f69d8396cd36df665ba15492000281a484545a9ec3b1c66e?pretty=1&offset=0&limit=1000`


Params:
- offset: Skip this many outputs
- limit: results returned
- pretty: whether to pretty print

Retrieve outputs involving scripthash. Note: receives are tracked only for now.


```javascript
{
  "status": 200,
  "errors": [],
  "result": [
    {
      "txid": "dc7bed6c302c08b7bafd94bfb1086883a134861fe9f212fc8052fcaadcde2293",
      "index": 0,
      "script": "76a914a1f93cb1d124a82f8f86b06ef97a4fd6d77c04e288ac",
      "address": "1FmSNBWW2m6d6FDUWxDjaJo9jhNAs9Pekr",
      "scripthash": "ee7beac2fcc315b37f190530d743769f255b1d413edd6e51bbc003022753f909",
      "satoshis": 31994680111,
      "is_receive": true,
      "spend_txid": null,
      "spend_index": null
    }
  ]
}
```

### Get Scripthash Unspent Outputs (UTXO)

`GET /api/v1/txout/scripthash/:scripthash/utxo?pretty=1&offset=0&limit=1000`


**NOTE:** You can specify multiple scripthashes with the comma ',' example:

`GET /api/v1/txout/scripthash/d4f225bdd856437e519cf65c1ec9a108b3c2d10f993cd5a66e5078792105eb7e,17f0fb74c18f2989f69d8396cd36df665ba15492000281a484545a9ec3b1c66e/utxo?pretty=1&offset=0&limit=1000`


Params:
- offset: Skip this many outputs
- limit: results returned
- pretty: whether to pretty print

Retrieve outputs involving scripthash. Note: receives are tracked only for now.


```javascript
{
  "status": 200,
  "errors": [],
  "result": [
    {
      "txid": "dc7bed6c302c08b7bafd94bfb1086883a134861fe9f212fc8052fcaadcde2293",
      "vout": 0,
      "outputIndex": 0,
      "value": 31994680111,
      "satoshis": 31994680111,
      "script": "76a914a1f93cb1d124a82f8f86b06ef97a4fd6d77c04e288ac",
      "address": "1FmSNBWW2m6d6FDUWxDjaJo9jhNAs9Pekr",
      "scripthash": "ee7beac2fcc315b37f190530d743769f255b1d413edd6e51bbc003022753f909"
    }
  ]
}
```

### Get Balance By Scripthash

`GET /api/v1/txout/scripthash/:scripthashes/balance?pretty=1`

Params:
- pretty: whether to pretty print

Retrieve the balance for scripthashes

```javascript
{
  "status": 200,
  "errors": [],
  "result": [
    {
      "confirmed": 432454,
      "unconfirmed": 0
    }
  ]
}
```


### Add Address or Scripthash to Output Group

`POST /api/v1/txoutgroup/:groupname`

Optionally provide `metadata` to tag addresses and scripts with metadata (ex: track child derivation paths or anything)

POST Request Body:

```javascript
{
 "items": [
   { "scriptid": "032132442", "metadata": { "foo": 1233 } },
   { "scriptid": "13jbh6Ps6p4GEfNVbZpp6AwqWFrkWQmaWN" },
   { "scriptid": "scripthash1", "metadata": { "something": "else" } }
 ]
}

```
Add the output script pattern tagged into the group.  Can be an address or scripthash. This allows you to group outputs by xpub, userid, or any category.

Simply use the xpub as the 'groupname' and then you have a full xpub wallet index and utxos.

### Get Output Group

`GET /api/v1/txoutgroup/:groupname`

Get all the subscribed addresses and scripthashes for this groupname.

Response Body

```javascript
{
    "status": 200,
    "errors": [],
    "result": [
        {
            "groupname": "mykey",
            "scriptid": "131xY3twRUJ1Y9Z9jJFKGLUa4SAdRJppcW",
            "created_at": 1594930920,
            "metadata": null
        },
        {
            "groupname": "mykey",
            "scriptid": "13jbh6Ps6p4GEfNVbZpp6AwqWFrkWQmaWN",
            "created_at": 1594921596,
            "metadata": { "something": "else" }
        }
    ]
}

```
Get all scriptids subscribed to the groupname. Scriptid can be an address or a scripthash to match outputs.

### Get Output Groups by Scriptid

`GET /api/v1/txoutgroup/scriptid/:scriptids`

Reverse lookup get all output groups that have scriptids (address, scripthash, etc). Use comma seperated values for multiple.

Response Body

```javascript
{
    "status": 200,
    "errors": [],
    "result": [
        {
            "groupname": "mykey",
            "scriptid": "131xY3twRUJ1Y9Z9jJFKGLUa4SAdRJppcW",
            "created_at": 1594930920
        },
        {
            "groupname": "mykey",
            "scriptid": "13jbh6Ps6p4GEfNVbZpp6AwqWFrkWQmaWN",
            "created_at": 1594921596
        }
    ]
}

```
Get all output groups for the given identifiers such as address or scripthash that was registered.


### Delete Address or Scripthash from Output Group

`DELETE /api/v1/txoutgroup/:groupname`

DELETE Request Body:

```javascript
{
 "scriptids": [
   "0012",
   "address1",
   "scripthash1"
 ]
}
```
Delete the addreses and scripthashes from the group

### Get Outputs By Group

*NOTE:* Requires creating a group using the Output Group API calls.

`GET /api/v1/txout/group/:groupname?pretty=1&offset=0&limit=1000&script=1`

Params:
- offset: Skip this many outputs
- limit: results returned
- script: Set to '0' to exclude returning the script
- pretty: whether to pretty print

Retrieve outputs that share a address or scripthash with the txoutgroup.scriptid. Note: receives are tracked only for now.

```javascript
{
  "status": 200,
  "errors": [],
  "result": [
    {
      "txid": "dc7bed6c302c08b7bafd94bfb1086883a134861fe9f212fc8052fcaadcde2293",
      "index": 0,
      "script": "76a914a1f93cb1d124a82f8f86b06ef97a4fd6d77c04e288ac",
      "address": "1FmSNBWW2m6d6FDUWxDjaJo9jhNAs9Pekr",
      "scripthash": "ee7beac2fcc315b37f190530d743769f255b1d413edd6e51bbc003022753f909",
      "satoshis": 31994680111,
      "is_receive": true,
      "spend_txid": null,
      "spend_index": null
    }
  ]
}
```

### Get Unspent Outputs By Group (UTXO)

*NOTE:* Requires creating a group using the Output Group API calls.

`GET /api/v1/txout/group/:groupname/utxo?pretty=1&offset=0&limit=1000&script=1`

Params:
- offset: Skip this many outputs
- limit: results returned
- script: Set to '0' to exclude returning the script
- pretty: whether to pretty print

Retrieve unspent outputs that share a address or scripthash with the txoutgroup.scriptid. Note: receives are tracked only for now.

```javascript
{
  "status": 200,
  "errors": [],
  "result": [
    {
      "txid": "dc7bed6c302c08b7bafd94bfb1086883a134861fe9f212fc8052fcaadcde2293",
      "index": 0,
      "script": "76a914a1f93cb1d124a82f8f86b06ef97a4fd6d77c04e288ac",
      "address": "1FmSNBWW2m6d6FDUWxDjaJo9jhNAs9Pekr",
      "scripthash": "ee7beac2fcc315b37f190530d743769f255b1d413edd6e51bbc003022753f909",
      "satoshis": 31994680111,
      "is_receive": true,
      "spend_txid": null,
      "spend_index": null
    }
  ]
}
```

### Get Balance By Group

*NOTE:* Requires creating a group using the Output Group API calls.

`GET /api/v1/txout/group/:groupname/balance?pretty=1`

Params:
- pretty: whether to pretty print

Retrieve the balance for all the addresses and scripthashes tagged by groupname.

```javascript
{
  "status": 200,
  "errors": [],
  "result": [
    {
      "confirmed": 432454,
      "unconfirmed": 0
    }
  ]
}
```


### Get Queue Stats

`GET /api/v1/queue/stats`

Retrieve queue settings and general stats.

```javascript
{
  "status": 200,
  "errors": [],
  "result": {
    "config": {
      "concurrency": 3,
      "maxDelay": 600000,
      "numOfAttempts": 20,
      "startingDelay": 60000,
      "jitter": "none",
      "timeMultiple": 2,
      "checkPendingTimeSec": 60
    },
    "stats": {
      "tasks_pending": 0,
      "tasks_enq": 0,
      "tasks_dup": 0,
      "tasks_expired": 0,
      "tasks_completed": 0
    }
  }
}
```

### Get Dead-Letter Transactions Queue

`GET /api/v1/queue/dlq`

Retrieve any transaction that were unable to be synced (ie: `completed: false`) after the max `numOfAttempts` was reached.
All transactions expired get tagged in the default dead-letter queue called `dlq`

A transaction that is expired, will not be retried unless it is forced to `resync` and start the retry again.

```javascript
{
  "status": 200,
  "errors": [],
  "result": [ 'dc7bed6c302c08b7bafd94bfb1086883a134861fe9f212fc8052fcaadcde2293' ]
}
```

### Requeue Transactions in Dead-Letter Queue

`POST /api/v1/queue/requeue?limit=20`
`POST /api/v1/queue/requeue/:dlq?limit=20`

Retry up to `limit` dead letter queued transactions. Returns the array of txids that are requeued.
The `limit` gives you the ability to slowly requeue insstead of all at once.

```javascript
{
  "status": 200,
  "errors": [],
  "result": [ 'dc7bed6c302c08b7bafd94bfb1086883a134861fe9f212fc8052fcaadcde2293' ]
}
```


### Force Resync of Transaction

`POST /api/v1/tx/dc7bed6c302c08b7bafd94bfb1086883a134861fe9f212fc8052fcaadcde2293/resync`

Use this method to restart any transactions found in the dead-letter queue (dlq).

Sets `tx.completed = false` and resets `sync = 1` (pending) and kick starts the sync of the send and status of transaction.

```javascript
{
  "status": 200,
  "errors": [],
  "result": {} // Success is empty
}
```

### Get Queue Tasks by Sync Status

Retrieves the txids in the various sync states:
`GET /api/v1/queue/sync/success?offset=0&limit=1000&pretty`
`GET /api/v1/queue/sync/failure?offset=0&limit=1000&pretty`
`GET /api/v1/queue/sync/none?offset=0&limit=1000&pretty`
`GET /api/v1/queue/sync/pending?offset=0&limit=1000&pretty`

Params:
- offset: Skip items
- limit: Limit ites returned
- pretty: whether to pretty print

Retrieve pending txid's that are either `success`, `failure`, `pending`, or `none`

```javascript
{{
   "status":200,
   "errors":[

   ],
   "result":[
      "663ee4c9a17070ee5e91eee7f863eaa92ad6ff3144aab94248d4e3ae7380244d",
      "a59c5fc76654390239dcb573aee752ad6f2f40ea0e238eac95942ee87f2b9043",
      "60fa2f8f144ca71e7f573681940f3fcb63125c4d52d12a647e04ff8b408a16ba",
      "3af19895c4a40b8bb49c5623609099068777a2f4451d5a4186105e2fa2e4c27b"
   ]
}
```

## Server Sent Events (SSE)

Use <a href='https://developer.mozilla.org/en-US/docs/Web/API/EventSource' target="_blank">EventSource</a> to reliably receive updates.

The `EventSource` automatically handles sending `Last-EventId` as a header when the stream reconnects so you will always get any missed updates.

Example streams:
- <a href='https://public.txq-app.com/sse/channel/inserts' target="_blank">Tx Inserts</a>
- <a href='https://public.txq-app.com/sse/channel/inserts/channelNameHere' target="_blank">Tx Inserts (with Channel</a>
- <a href='https://public.txq-app.com/sse/channel/updates' target="_blank">Tx Updates</a>
- <a href='https://public.txq-app.com/sse/channel/updates/channelNameHere' target="_blank">Tx Updates (with Channel)</a>
- <a href='https://public.txq-app.com/sse/merchantapilogs' target="_blank">Merchant API Log</a>
- <a href='https://public.txq-app.com/sse/txout/address/131xY3twRUJ1Y9Z9jJFKGLUa4SAdRJppcW' target="_blank">Address Updates</a>
- <a href='https://public.txq-app.com/sse/txout/scripthash/ee7beac2fcc315b37f190530d743769f255b1d413edd6e51bbc003022753f909' target="_blank">Scripthash Updates</a>
- <a href='https://public.txq-app.com/sse/txout/group/myGroupName' target="_blank">Output Group Updates</a>

### New Transactions Stream (Default channel)

Stream all newly created inserts for the default queue channel

`GET /sse/channel/inserts` (SSE)

Example: <a href='https://public.txq-app.com/sse/channel/inserts' target="_blank">Inserts</a>

```javascript
id: -1
data: ["connected"]

id: 101
data: {
   "eventType":"newtx",
   "entity":{
      "txid":"f093a1e67bd88cbc8a3fbafb70a8b0bb439b7e5c6b2421ea0c5b49df87e9c2b8",
      "rawtx":"01000000017708156b6e84cfc73d0d2c549e3e5e3ca9b9886df57ebc1ffae45de1c0d40025010000006b483045022100ab349f73f2334a2f72d68eeb45f2ac6bcfb6c87a00985ae72f43164fdec4b14502204734294f0d403d03f601f1ccc7cf1156701bea371080fc059700957a52846234412102119ebe4639964590bcf358539740f8ea4b6546b8416cbbbf6de12fafd3a13d1affffffff02000000000000000022006a026d021c706f737420746f6420646d64653364646464646464646564646d6f211f5d0400000000001976a914161e9c31fbec37d9ecb297bf4b814c6e189dbe5288ac00000000",
      "h":"00000000000000000264cab8156c13cc9ea600c7506a4c74640e41c400730711",
      "i":640721,
      "send":{
         "payload":{
            "txid":"f093a1e67bd88cbc8a3fbafb70a8b0bb439b7e5c6b2421ea0c5b49df87e9c2b8",
            "minerId":"0211ccfc29e3058b770f3cf3eb34b0b2fd2293057a994d4d275121be4151cdf087",
            "timestamp":"2020-06-24T03:48:46.740Z",
            "apiVersion":"0.1.0",
            "returnResult":"success",
            "resultDescription":"",
            "txSecondMempoolExpiry":0,
            "currentHighestBlockHash":"000000000000000003e4685f4a5b4ad32f66f6fde535679138bf9eaa760999cb",
            "currentHighestBlockHeight":640720
         },
         "encoding":"UTF-8",
         "mimetype":"application/json",
         "publicKey":"0211ccfc29e3058b770f3cf3eb34b0b2fd2293057a994d4d275121be4151cdf087",
         "signature":"3045022100c505903f06b0a944c93b04b10161755e40d4a8e0b95287b35ca8a07dade040d4022026bb44dcef2434de20a2ec0c8ee5591becb92a7628b68872c28e572f371ceefa"
      },
      "status":{
         "valid":true,
         "payload":{
            "minerId":"0211ccfc29e3058b770f3cf3eb34b0b2fd2293057a994d4d275121be4151cdf087",
            "blockHash":"00000000000000000264cab8156c13cc9ea600c7506a4c74640e41c400730711",
            "timestamp":"2020-06-24T03:50:45.083Z",
            "apiVersion":"0.1.0",
            "blockHeight":640721,
            "returnResult":"success",
            "confirmations":1,
            "resultDescription":"",
            "txSecondMempoolExpiry":0
         },
         "encoding":"UTF-8",
         "mimetype":"application/json",
         "publicKey":"0211ccfc29e3058b770f3cf3eb34b0b2fd2293057a994d4d275121be4151cdf087",
         "signature":"3044022038dc38e06d66027cce75aef000a581abe92c97ad9240e31f7af043f7dafd7eb50220783fdf925c8ae7f69ef3a0fa81ed10515f70cd265b65b6554252218ea73ec11d"
      },
      "completed":true,
      "updated_at":1592971756,
      "created_at":1592970930,
      "id":226,
      "channel":"bab3",
      "metadata":{
         "url":"https://www.nintendo.com",
         "image":"",
         "title":"some title",
         "content":"any content",
         "description":"DOOOOOO"
      },
      "tags":[
         "bitcoin",
         "bsv"
      ],
      "extracted":{

      }
   }
}

```

### New Transactions Stream (Custom Channel)

Stream all newly created inserts for the provided custom queue channel

`GET /sse/channel/inserts/:channelName` (SSE)

Example: <a href='https://public.txq-app.com/sse/channel/inserts/someChannelName' target="_blank">Inserts (with Channel)</a>

```javascript
id: -1
data: ["connected"]

id: 101
data: {
   "eventType":"newtx",
   "entity":{
      "txid":"f093a1e67bd88cbc8a3fbafb70a8b0bb439b7e5c6b2421ea0c5b49df87e9c2b8",
      "rawtx":"01000000017708156b6e84cfc73d0d2c549e3e5e3ca9b9886df57ebc1ffae45de1c0d40025010000006b483045022100ab349f73f2334a2f72d68eeb45f2ac6bcfb6c87a00985ae72f43164fdec4b14502204734294f0d403d03f601f1ccc7cf1156701bea371080fc059700957a52846234412102119ebe4639964590bcf358539740f8ea4b6546b8416cbbbf6de12fafd3a13d1affffffff02000000000000000022006a026d021c706f737420746f6420646d64653364646464646464646564646d6f211f5d0400000000001976a914161e9c31fbec37d9ecb297bf4b814c6e189dbe5288ac00000000",
      "h":"00000000000000000264cab8156c13cc9ea600c7506a4c74640e41c400730711",
      "i":640721,
      "send":{
         "payload":{
            "txid":"f093a1e67bd88cbc8a3fbafb70a8b0bb439b7e5c6b2421ea0c5b49df87e9c2b8",
            "minerId":"0211ccfc29e3058b770f3cf3eb34b0b2fd2293057a994d4d275121be4151cdf087",
            "timestamp":"2020-06-24T03:48:46.740Z",
            "apiVersion":"0.1.0",
            "returnResult":"success",
            "resultDescription":"",
            "txSecondMempoolExpiry":0,
            "currentHighestBlockHash":"000000000000000003e4685f4a5b4ad32f66f6fde535679138bf9eaa760999cb",
            "currentHighestBlockHeight":640720
         },
         "encoding":"UTF-8",
         "mimetype":"application/json",
         "publicKey":"0211ccfc29e3058b770f3cf3eb34b0b2fd2293057a994d4d275121be4151cdf087",
         "signature":"3045022100c505903f06b0a944c93b04b10161755e40d4a8e0b95287b35ca8a07dade040d4022026bb44dcef2434de20a2ec0c8ee5591becb92a7628b68872c28e572f371ceefa"
      },
      "status":{
         "valid":true,
         "payload":{
            "minerId":"0211ccfc29e3058b770f3cf3eb34b0b2fd2293057a994d4d275121be4151cdf087",
            "blockHash":"00000000000000000264cab8156c13cc9ea600c7506a4c74640e41c400730711",
            "timestamp":"2020-06-24T03:50:45.083Z",
            "apiVersion":"0.1.0",
            "blockHeight":640721,
            "returnResult":"success",
            "confirmations":1,
            "resultDescription":"",
            "txSecondMempoolExpiry":0
         },
         "encoding":"UTF-8",
         "mimetype":"application/json",
         "publicKey":"0211ccfc29e3058b770f3cf3eb34b0b2fd2293057a994d4d275121be4151cdf087",
         "signature":"3044022038dc38e06d66027cce75aef000a581abe92c97ad9240e31f7af043f7dafd7eb50220783fdf925c8ae7f69ef3a0fa81ed10515f70cd265b65b6554252218ea73ec11d"
      },
      "completed":true,
      "updated_at":1592971756,
      "created_at":1592970930,
      "id":226,
      "channel":"someChannelName",
      "metadata":{
         "url":"https://www.nintendo.com",
         "image":"",
         "title":"some title",
         "content":"any content",
         "description":"DOOOOOO"
      },
      "tags":[
         "bitcoin",
         "bsv"
      ],
      "extracted":{

      }
   }
}

```


### New and Updated Transactions Stream (Default channel)

Stream all newly created inserts and updated transactions for the default queue channel

`GET /sse/channel/updates` (SSE)

Example: <a href='https://public.txq-app.com/sse/channel/updates' target="_blank">Updates</a>

```javascript
id: -1
data: ["connected"]

id: 101
data: {
   "eventType":"newtx",
   "entity":{
      "txid":"f093a1e67bd88cbc8a3fbafb70a8b0bb439b7e5c6b2421ea0c5b49df87e9c2b8",
      "rawtx":"01000000017708156b6e84cfc73d0d2c549e3e5e3ca9b9886df57ebc1ffae45de1c0d40025010000006b483045022100ab349f73f2334a2f72d68eeb45f2ac6bcfb6c87a00985ae72f43164fdec4b14502204734294f0d403d03f601f1ccc7cf1156701bea371080fc059700957a52846234412102119ebe4639964590bcf358539740f8ea4b6546b8416cbbbf6de12fafd3a13d1affffffff02000000000000000022006a026d021c706f737420746f6420646d64653364646464646464646564646d6f211f5d0400000000001976a914161e9c31fbec37d9ecb297bf4b814c6e189dbe5288ac00000000",
      "h":"00000000000000000264cab8156c13cc9ea600c7506a4c74640e41c400730711",
      "i":640721,
      "send":{
         "payload":{
            "txid":"f093a1e67bd88cbc8a3fbafb70a8b0bb439b7e5c6b2421ea0c5b49df87e9c2b8",
            "minerId":"0211ccfc29e3058b770f3cf3eb34b0b2fd2293057a994d4d275121be4151cdf087",
            "timestamp":"2020-06-24T03:48:46.740Z",
            "apiVersion":"0.1.0",
            "returnResult":"success",
            "resultDescription":"",
            "txSecondMempoolExpiry":0,
            "currentHighestBlockHash":"000000000000000003e4685f4a5b4ad32f66f6fde535679138bf9eaa760999cb",
            "currentHighestBlockHeight":640720
         },
         "encoding":"UTF-8",
         "mimetype":"application/json",
         "publicKey":"0211ccfc29e3058b770f3cf3eb34b0b2fd2293057a994d4d275121be4151cdf087",
         "signature":"3045022100c505903f06b0a944c93b04b10161755e40d4a8e0b95287b35ca8a07dade040d4022026bb44dcef2434de20a2ec0c8ee5591becb92a7628b68872c28e572f371ceefa"
      },
      "status":{
         "valid":true,
         "payload":{
            "minerId":"0211ccfc29e3058b770f3cf3eb34b0b2fd2293057a994d4d275121be4151cdf087",
            "blockHash":"00000000000000000264cab8156c13cc9ea600c7506a4c74640e41c400730711",
            "timestamp":"2020-06-24T03:50:45.083Z",
            "apiVersion":"0.1.0",
            "blockHeight":640721,
            "returnResult":"success",
            "confirmations":1,
            "resultDescription":"",
            "txSecondMempoolExpiry":0
         },
         "encoding":"UTF-8",
         "mimetype":"application/json",
         "publicKey":"0211ccfc29e3058b770f3cf3eb34b0b2fd2293057a994d4d275121be4151cdf087",
         "signature":"3044022038dc38e06d66027cce75aef000a581abe92c97ad9240e31f7af043f7dafd7eb50220783fdf925c8ae7f69ef3a0fa81ed10515f70cd265b65b6554252218ea73ec11d"
      },
      "completed":true,
      "updated_at":1592971756,
      "created_at":1592970930,
      "id":226,
      "channel":"bab3",
      "metadata":{
         "url":"https://www.nintendo.com",
         "image":"",
         "title":"some title",
         "content":"any content",
         "description":"DOOOOOO"
      },
      "tags":[
         "bitcoin",
         "bsv"
      ],
      "extracted":{

      }
   }
}

```

### New and Updated Transactions Stream (Custom Channel)

Stream all newly created inserts and updated transactions for the provided custom queue channel

`GET /sse/channel/updates/:channelName` (SSE)

Example: <a href='https://public.txq-app.com/sse/channel/updates/someChannelName' target="_blank">Updates (with Channel)</a>

Event Types: `newtx`, `updatetx`

```javascript
id: -1
data: ["connected"]

id: 101
data: {
   "eventType":"newtx",
   "entity":{
      "txid":"f093a1e67bd88cbc8a3fbafb70a8b0bb439b7e5c6b2421ea0c5b49df87e9c2b8",
      "rawtx":"01000000017708156b6e84cfc73d0d2c549e3e5e3ca9b9886df57ebc1ffae45de1c0d40025010000006b483045022100ab349f73f2334a2f72d68eeb45f2ac6bcfb6c87a00985ae72f43164fdec4b14502204734294f0d403d03f601f1ccc7cf1156701bea371080fc059700957a52846234412102119ebe4639964590bcf358539740f8ea4b6546b8416cbbbf6de12fafd3a13d1affffffff02000000000000000022006a026d021c706f737420746f6420646d64653364646464646464646564646d6f211f5d0400000000001976a914161e9c31fbec37d9ecb297bf4b814c6e189dbe5288ac00000000",
      "h":"00000000000000000264cab8156c13cc9ea600c7506a4c74640e41c400730711",
      "i":640721,
      "send":{
         "payload":{
            "txid":"f093a1e67bd88cbc8a3fbafb70a8b0bb439b7e5c6b2421ea0c5b49df87e9c2b8",
            "minerId":"0211ccfc29e3058b770f3cf3eb34b0b2fd2293057a994d4d275121be4151cdf087",
            "timestamp":"2020-06-24T03:48:46.740Z",
            "apiVersion":"0.1.0",
            "returnResult":"success",
            "resultDescription":"",
            "txSecondMempoolExpiry":0,
            "currentHighestBlockHash":"000000000000000003e4685f4a5b4ad32f66f6fde535679138bf9eaa760999cb",
            "currentHighestBlockHeight":640720
         },
         "encoding":"UTF-8",
         "mimetype":"application/json",
         "publicKey":"0211ccfc29e3058b770f3cf3eb34b0b2fd2293057a994d4d275121be4151cdf087",
         "signature":"3045022100c505903f06b0a944c93b04b10161755e40d4a8e0b95287b35ca8a07dade040d4022026bb44dcef2434de20a2ec0c8ee5591becb92a7628b68872c28e572f371ceefa"
      },
      "status":{
         "valid":true,
         "payload":{
            "minerId":"0211ccfc29e3058b770f3cf3eb34b0b2fd2293057a994d4d275121be4151cdf087",
            "blockHash":"00000000000000000264cab8156c13cc9ea600c7506a4c74640e41c400730711",
            "timestamp":"2020-06-24T03:50:45.083Z",
            "apiVersion":"0.1.0",
            "blockHeight":640721,
            "returnResult":"success",
            "confirmations":1,
            "resultDescription":"",
            "txSecondMempoolExpiry":0
         },
         "encoding":"UTF-8",
         "mimetype":"application/json",
         "publicKey":"0211ccfc29e3058b770f3cf3eb34b0b2fd2293057a994d4d275121be4151cdf087",
         "signature":"3044022038dc38e06d66027cce75aef000a581abe92c97ad9240e31f7af043f7dafd7eb50220783fdf925c8ae7f69ef3a0fa81ed10515f70cd265b65b6554252218ea73ec11d"
      },
      "completed":true,
      "updated_at":1592971756,
      "created_at":1592970930,
      "id":226,
      "channel":"someChannelName",
      "metadata":{
         "url":"https://www.nintendo.com",
         "image":"",
         "title":"some title",
         "content":"any content",
         "description":"DOOOOOO"
      },
      "tags":[
         "bitcoin",
         "bsv"
      ],
      "extracted":{

      }
   }
}

```


### Merchant API Log Stream

Stream all merchant API sends and status updates. This allows you to track confirmation status of tx's.

`GET /sse/merchantapilogs` (SSE)

Example: <a href='https://public.txq-app.com/sse/merchantapilogs' target="_blank">Merchant API Log Streaming</a>

```javascript
id: -1
data: ["connected"]

id: 171
data: {
  "miner": "matterpool.io",
  "eventType":"statustx",
  "entity":{
      "txid":"1b7182a2d6ca5f0caa06ba2ac15ade4e5009e6b8d942ddc958d12b0087a37d34",
      "payload":{
         "apiVersion":"0.1.0",
         "timestamp":"2020-06-24T04:34:45.678Z",
         "returnResult":"success",
         "resultDescription":"",
         "blockHash":"",
         "blockHeight":0,
         "confirmations":0,
         "minerId":"0211ccfc29e3058b770f3cf3eb34b0b2fd2293057a994d4d275121be4151cdf087",
         "txSecondMempoolExpiry":0
      },
      "signature":"3044022076ec2649ef04d8c3b4780a2d113afe0e42de12451cbeb8fc0138a54ab23b6b62022068f17187888c6c537a71459e75dca5f3eec742691f7f8e9989a9414427d406d4",
      "publicKey":"0211ccfc29e3058b770f3cf3eb34b0b2fd2293057a994d4d275121be4151cdf087",
      "encoding":"UTF-8",
      "mimetype":"application/json",
      "valid":true
   }
}

id: 174
data: {
  "miner": "matterpool.io",
  "eventType":"pushtx",
  "entity":{
      "txid":"a64c070d13d22e48f06c5edb692c0498f81d27d97fe6d0e092eebd1cd1063633",
      "payload":{
         "apiVersion":"0.1.0",
         "timestamp":"2020-06-24T04:34:54.001Z",
         "txid":"a64c070d13d22e48f06c5edb692c0498f81d27d97fe6d0e092eebd1cd1063633",
         "returnResult":"success",
         "resultDescription":"",
         "minerId":"0211ccfc29e3058b770f3cf3eb34b0b2fd2293057a994d4d275121be4151cdf087",
         "currentHighestBlockHash":"000000000000000002f1ac414cf470fa4e1d07794ad15fd75347524119910bc7",
         "currentHighestBlockHeight":640730,
         "txSecondMempoolExpiry":0
      },
      "signature":"3045022100ea9b5f918323b95b6bd21b49c5ce6ecfaa2652d3d9ad4d05e42f07b5b3b87144022079bf641752a94b33425ded243459c47209b8a072fac992842c8f1102462400b2",
      "publicKey":"0211ccfc29e3058b770f3cf3eb34b0b2fd2293057a994d4d275121be4151cdf087",
      "encoding":"UTF-8",
      "mimetype":"application/json"
   }
}

```

### Address Updates Stream

Stream all newly created outputs by address

`GET /sse/txout/address/:address` (SSE)

Example: <a href='https://public.txq-app.com/sse/txout/address/131xY3twRUJ1Y9Z9jJFKGLUa4SAdRJppcW' target="_blank">Address Stream</a>

```javascript

id: -1
data: ["connected"]

id: 2
data: {
   "entity":{
      "txid":"10ad1739b568d2060831b91771d9b836e0f4efcb113d3a866732bbb9b8ca7ae2",
      "index":1,
      "address":"131xY3twRUJ1Y9Z9jJFKGLUa4SAdRJppcW",
      "scripthash":"525d063bd0c861fddc4d4881cb495038652bf432c9e2586cc37d49e98a3cc60e",
      "script":"76a914161e9c31fbec37d9ecb297bf4b814c6e189dbe5288ac",
      "satoshis":284442
   },
   "eventType":"txout"
}

```

### Scripthash Updates Stream

Stream all newly created outputs by scripthash

`GET /sse/txout/scripthash/:scripthash` (SSE)

Example: <a href='https://public.txq-app.com/sse/txout/scripthash/525d063bd0c861fddc4d4881cb495038652bf432c9e2586cc37d49e98a3cc60e' target="_blank">Scripthash stream</a>


```javascript

id: -1
data: ["connected"]

id: 2
data: {
   "entity":{
      "txid":"10ad1739b568d2060831b91771d9b836e0f4efcb113d3a866732bbb9b8ca7ae2",
      "index":1,
      "address":"131xY3twRUJ1Y9Z9jJFKGLUa4SAdRJppcW",
      "scripthash":"525d063bd0c861fddc4d4881cb495038652bf432c9e2586cc37d49e98a3cc60e",
      "script":"76a914161e9c31fbec37d9ecb297bf4b814c6e189dbe5288ac",
      "satoshis":284442
   },
   "eventType":"txout"
}

```


### Output Group Updates Stream

Stream all newly created outputs by whether the scriphash or address (of each output of the tx) matches any Output Group ('Txoutgroup')

`GET /sse/txout/group/:groupname` (SSE)

Example: <a href='https://public.txq-app.com/sse/txout/group/myGroupName' target="_blank">Output Group Stream</a>


```javascript

id: -1
data: ["connected"]

id: 2
data: {
   "entity":{
      "txid":"10ad1739b568d2060831b91771d9b836e0f4efcb113d3a866732bbb9b8ca7ae2",
      "index":1,
      "address":"131xY3twRUJ1Y9Z9jJFKGLUa4SAdRJppcW",
      "scripthash":"525d063bd0c861fddc4d4881cb495038652bf432c9e2586cc37d49e98a3cc60e",
      "script":"76a914161e9c31fbec37d9ecb297bf4b814c6e189dbe5288ac",
      "satoshis":284442
   },
   "eventType":"txout"
}

```


## Merchant API Proxy (mapi)

**Motivation**

TXQ exposes a `/mapi` endpoint proxy that allows clients to communicate with TXQ directly using the Merchant API.

TXQ automatically saves successfully broadcasted transactions under the default (empty) channel and then retries them as normal until they are settled or expired into the dead-letter queue.

Enable this in the configuration file with (default enabled):

```javascript
merchantapi: {
    ...
    enableProxy: true,                        // Exposes Merchant API proxy endpointts
    ...
}

```

Resources:

- <a href='https://developers.matterpool.io/#merchant-api' target="_blank">Merchant API Documentation (MatterPool)</a>
- <a href='https://github.com/bitcoin-sv-specs/brfc-merchantapi' target="_blank">BRFC Merchant API Specification (Official)</a>

### Storing `channel`, `metadata`, and `tags`

The Merchant API specification does not accept anything other than `rawtx` for `POST /mapi/tx` (push tx) therefore we leverage HTTP
headers to allow the client to specify `channel`, `metadata`, and `tags`.

For example, set the following HTTP headers to attach additional information:

`channel` : `someChannelName`

`metadata`: `{"description": "mydescription", "title": "a cool title"}`

`tags`: `["animals", "bitcoin"]`

When pushing a tx (POST /mapi/tx) you might want to check if the transaction was confirmed long ago and then force it to be saved:

`checkstatus`: `true`

If you do not set `checkstatus: true` when attempting to broadcast a really old (but confirmed) transaction, then TXQ will not save it in the
database because the Merchant API returns `ERROR: Missing inputs`.  This is because of course miners may not keep old transactions (ie: prune)
and therefore we must have a way to first check whether the transaction is confirmed long ago.

Set `checkstatus` to indicate to TXQ to do a "pre-flight" check with `statustx` to know whether we should save this confirmed transaction or not despite whether the push broadcast returns `ERROR: Missing inputs` or not.

### Query Primary Miner Merchant API

Use the first Merchant API endpoint for the request.

All events are logged to the database (enabled by default) under `proxypushtx`, `proxystatustx` and `proxyfeequote`.

**Transaction status examples:**

`GET /mapi/tx/10ad1739b568d2060831b91771d9b836e0f4efcb113d3a866732bbb9b8ca7ae2`

**Push transaction examples:**

`POST /mapi/tx`

**Fee quote examples:**

`GET /mapi/feeQuote`

### Query Specific Miner Merchant API

Select a specific miner to send the Merchant API request to. The identifer `<miner-name>` must match the name in the configuration file.
All events are logged to the database (enabled by default) under `proxypushtx`, `proxystatustx` and `proxyfeequote`.

**Transaction status examples:**

`GET /merchantapi/taal.com/mapi/tx/10ad1739b568d2060831b91771d9b836e0f4efcb113d3a866732bbb9b8ca7ae2`

`GET /merchantapi/matterpool.io/mapi/tx/10ad1739b568d2060831b91771d9b836e0f4efcb113d3a866732bbb9b8ca7ae2`

`GET /merchantapi/mempool.io/mapi/tx/10ad1739b568d2060831b91771d9b836e0f4efcb113d3a866732bbb9b8ca7ae2`

**Push transaction examples:**

`POST /merchantapi/taal.com/mapi/tx`

`POST /merchantapi/matterpool.io/mapi/tx`

`POST /merchantapi/mempool.io/mapi/tx`

**Fee quote examples:**

`GET /merchantapi/taal.com/mapi/feeQuote`

`GET /merchantapi/matterpool.io/mapi/feeQuote`

`GET /merchantapi/mempool.io/mapi/feeQuote`

### Query by Index of Miner Merchant API

Select a specific miner by index (ie: 0 is the first, 1 is the second, etc) to send the Merchant API request to. The identifer `<miner-endpoint-index>` must match the name in the configuration file.

All events are logged to the database (enabled by default) under `proxypushtx`, `proxystatustx` and `proxyfeequote`.

**Transaction status examples:**

`GET /merchantapi/0/mapi/tx/10ad1739b568d2060831b91771d9b836e0f4efcb113d3a866732bbb9b8ca7ae2`

`GET /merchantapi/1/mapi/tx/10ad1739b568d2060831b91771d9b836e0f4efcb113d3a866732bbb9b8ca7ae2`

`GET /merchantapi/2/mapi/tx/10ad1739b568d2060831b91771d9b836e0f4efcb113d3a866732bbb9b8ca7ae2`

**Push transaction examples:**

`POST /merchantapi/0/mapi/tx`

`POST /merchantapi/1/mapi/tx`

`POST /merchantapi/2/mapi/tx`

**Fee quote examples:**

`GET /merchantapi/0/mapi/feeQuote`

`GET /merchantapi/1/mapi/feeQuote`

`GET /merchantapi/2/mapi/feeQuote`

## Database Schema and Design

The database chosen is postgres because it provides important features for developers and enterprises:

- High performance relational database
- Excellent `jsonb` storage and custom indexes
    - Operating as high performance "NoSQL"
- Known scaling properties
    - TimescaleDB provides a chronological partitioning
    - Master-Slave replication
- ACID Compliant

Future work:  Abstract away storage and allow developer to choose storage engine.

## Additional Resources

<a href='https://developers.matterpool.io'>MATTERPOOL DEVELOPER DOCUMENTATION</a>

<a href='https://matterpool.io'>matterpool.io</a>

<a href='mailto:attila@matterpool.io?subject=Hello TXQ'>Say Hello</a>
