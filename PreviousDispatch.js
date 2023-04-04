const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
var cors = require('cors');
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use('/', (req, res, next) => {
  next();
});
const crypto = require('crypto');
const { default: axios } = require('axios');

const id = crypto.randomBytes(16).toString('hex');

const SEND_INTERVAL = 2000;
const MY_PORT = process.env.PORT || 5000;

const writeEvent = (res, sseId, data) => {
  res.write(`id: ${sseId}\n`);
  res.write(`data: ${data}\n\n`);
};

const sendEvent = (_req, res) => {
  res.writeHead(200, {
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Content-Type': 'text/event-stream',
  });

  const sseId = new Date().toDateString();

  setInterval(() => {
    writeEvent(res, sseId, JSON.stringify(InitialCallMaker));
  }, SEND_INTERVAL);

  writeEvent(res, sseId, JSON.stringify(InitialCallMaker));
};

app.get('/dashboard', (req, res) => {
  if (req.headers.accept === 'text/event-stream') {
    sendEvent(req, res);
  } else {
    res.json({ message: 'Ok' });
  }
});

let InitialCallMaker = {
  username: 'No Call Maker',
  callTakerId: '',
  url: '',
};

var callMakerPendingList = [];
var allCallMakerList = [];
var callMakerServedList = [];

var callTakerActiveList = [];
var callTakerInActiveList = [];
var callTakerBusyList = [];
var serviceModu = 'no file';
app.post('/calltaker-register', function (req, res) {
  let incomingCallTaker = {
    username: req.body.username,
    callTakerId: req.body.callerId,
  };

  console.log(incomingCallTaker);
  callTakerActiveList.push(incomingCallTaker);

  if (callMakerPendingList.length > 0) {
    console.log("Number of CM- Under Waiting => " + callMakerPendingList.length)
    const callMaker = callMakerPendingList[0];
    // removeItemOnce(callMakerPendingList, callMaker);
    callMakerPendingList.shift();

    console.log("Remaining CM-Under Waiting => "+ callMakerPendingList.length)

    console.log("callMaker")
    console.log(callMaker)
    console.log("callMaker")
    let callTaker = callTakerActiveList[0];
    callTakerActiveList.shift()

    InitialCallMaker = {
      username: callMaker.username,
      callTakerId: callTaker.callTakerId,
      url: callMaker.url,
    };
    callMakerServedList.push(callMaker);
    callTakerBusyList.push(callTaker);
  } else {
    console.log("Number Of Active CT-Online => " + callTakerActiveList.length+ " |and Data Here ... ")
    console.log(callTakerActiveList);
  }
  res.send({
    callMakerUrl: '',
    callTakerId: '',
  });
});
app.get('/', function (request, response) {
  console.log('GET request to /Home Page/');
  response.sendFile(__dirname + '/index.html');
});

app.get('/session/:username', function (request, response) {
  console.log('GET request to /session/' + request.params.username);
  response.sendFile(__dirname + '/session.html');
  console.log('TenawData get');
});

app.post('/session/:username', async (req, res) => {
  let IncomingCallMaker = {
    callMakerID: crypto.randomBytes(16).toString('hex'),
    username: req.params.username,
    url: `https://dispatch-demo-production.up.railway.app/session/${req.params.username}`,
  };

  let repatitionExistance = false;
  for (let i = 0; i < allCallMakerList.length; i++) {
    if (allCallMakerList[i].username == IncomingCallMaker.username) {
      console.log("Username Already Reserved...")
      repatitionExistance = true;
    }
  }

  let TenawData = await axios
    .post(`https://opentok-server-production.up.railway.app/session/${IncomingCallMaker.username}`)
    .then((res) => {
      return res.data;
    });
    if (!repatitionExistance) {
      allCallMakerList.push(IncomingCallMaker);
      callMakerPendingList.push(IncomingCallMaker);
    }
      if (callTakerActiveList.length > 0 && callMakerPendingList.length > 0) {
        let CallTaker = callTakerActiveList[0];
        console.log(CallTaker);
        let firstCallMaker = callMakerPendingList[0];
    
        InitialCallMaker = {
          username: firstCallMaker.username,
          callTakerId: CallTaker.callTakerId,
          url: firstCallMaker.url,
        };
    
        callMakerServedList.push(firstCallMaker);
        callTakerBusyList.push(CallTaker);
        callTakerActiveList.shift();
        callMakerPendingList.shift();
      } else {
        console.log("Number of CM-Under Waiting => " + callMakerPendingList.length + " |and Data Here ... ");
        console.log(callMakerPendingList);
    }
          res.send({
          sessionId: TenawData.sessionId,
          apiKey: TenawData.apiKey,
          token: TenawData.token,
        });
});

app.post('/calltaker-endcall/:id', function (req, res) {
  let EndCallId = req.params.id;
  console.log(EndCallId);
  console.log(callTakerBusyList);
  for (let i = 0; i < callTakerBusyList.length; i++) {
    if (EndCallId === callTakerBusyList[i].callTakerId) {
      let calltaker = callTakerBusyList[i];
      console.log(calltaker);
      callTakerActiveList.push(calltaker);
      callTakerBusyList.splice(i, 1);
    }
  }
  res.send('End Call');
});

const server = http.createServer(app);
server.listen(MY_PORT);
