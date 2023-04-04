const http = require ('http');
const express = require ('express');
const bodyParser = require ('body-parser');
var cors = require ('cors');
const app = express ();
app.use (bodyParser.urlencoded ({extended: false}));
app.use (bodyParser.json ());
app.use (cors ());
app.use ('/', (req, res, next) => {
  next ();
});
const crypto = require ('crypto');
const {default: axios} = require ('axios');

const id = crypto.randomBytes (16).toString ('hex');

const SEND_INTERVAL = 2000;
const MY_PORT = process.env.PORT || 5000;

const writeEvent = (res, sseId, data) => {
  res.write (`id: ${sseId}\n`);
  res.write (`data: ${data}\n\n`);
};

const sendEvent = (_req, res) => {
  res.writeHead (200, {
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Content-Type': 'text/event-stream',
  });

  const sseId = new Date ().toDateString ();

  setInterval (() => {
    writeEvent (res, sseId, JSON.stringify (InitialCallMaker));
  }, SEND_INTERVAL);

  writeEvent (res, sseId, JSON.stringify (InitialCallMaker));
};

app.get ('/dashboard', (req, res) => {
  if (req.headers.accept === 'text/event-stream') {
    sendEvent (req, res);
  } else {
    res.json ({message: 'Ok'});
  }
});
// For notifying server status to the Monitor
const writeStatusEvent = (res, sseId, data) => {
  res.write (`id: ${sseId}\n`);
  res.write (`data: ${data}\n\n`);
};

const sendStatusEvent = (_req, res) => {
  res.writeHead (200, {
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Content-Type': 'text/event-stream',
  });

  const sseId = new Date ().toDateString ();

  setInterval (() => {
    writeStatusEvent (res, sseId, JSON.stringify (CallCenterStatus));
  }, SEND_INTERVAL);

  writeStatusEvent (res, sseId, JSON.stringify (CallCenterStatus));
};

app.get ('/callCenterStatus', (req, res) => {
  if (req.headers.accept === 'text/event-stream') {
    sendStatusEvent (req, res);
  } else {
    res.json ({message: 'Ok'});
  }
});

// My last update for github
let InitialCallMaker = {
  username: 'No Call Maker',
  callTakerId: '',
  url: '',
  latitude: '0.0',
  longitude: '0.0',
};

let CallCenterStatus = {
  allCallMakers: 0,
  callMakersUnderWaiting: 0,
  servedCallMakers: 0,
  activeCallTaker: 0,
  busyCallTaker: 0,
  offlineCallTaker: 0,
  onTalkCallMakerID: 'No One___',
  onTalkCallMakerName: 'No One___',
  onTalkCallLine: 'No One___',
  onTalkCallTakerID: 'No One___',
  onTalkCallTakerName: 'No One___',
  onTalkPairList: [],
};

var callMakerPendingList = [];
var allCallMakerList = [];
var callMakerServedList = [];
var callTakerActiveList = [];
var callTakerInActiveList = [];
var callTakerBusyList = [];
var callTakerOfflineList = [];
var activeMoniterList = [];
var serviceModu = 'no file';
var onRecivingCall = [];

app.post ('/moniter-registration', function (req, res) {
  let incomingMonitor = {
    username: req.body.username,
    monitorID: req.body.moniterID,
  };

  console.log ('New Monitoring Unit ...');
  console.log (incomingMonitor);
  activeMoniterList.push (incomingMonitor);
});

app.post ('/calltaker-register', function (req, res) {
  let incomingCallTaker = {
    username: req.body.username,
    callTakerId: req.body.callerId,
  };
  console.log (incomingCallTaker);
  callTakerActiveList.push (incomingCallTaker);

  if (callMakerPendingList.length > 0) {
    console.log ('Total CM-Under Waiting => ' + callMakerPendingList.length);
    const callMaker = callMakerPendingList[0];
    callMakerPendingList.shift ();
    console.log (
      'One CM-Picked To Serve Right-Now...|| (The CM-Under Serving...)'
    );
    console.log (callMaker);

    console.log (
      'After Served One CM... Remaining CM-Under Waiting => ' +
        callMakerPendingList.length
    );
    console.log (callMakerPendingList);

    let callTaker = callTakerActiveList[0];
    callTakerActiveList.shift ();
    console.log (
      'One CT Ready To Recive Call From Waiting Right-Now...|| (The CT-Ready-to-Recived a Call...)'
    );
    console.log (callTaker);
    console.log (
      'After Recived One Call... Remaining Active-CT => ' +
        callTakerActiveList.length +
        ' || Their Info...'
    );
    console.log (callTakerActiveList);

    InitialCallMaker = {
      username: callMaker.username,
      callTakerId: callTaker.callTakerId,
      url: callMaker.url,
      latitude: callMaker.latitude,
      longitude: callMaker.longitude,
    };

    onRecivingCall.push (InitialCallMaker);
    callMakerServedList.push (callMaker);
    callTakerBusyList.push (callTaker);

    console.log ('Total Served Caller-CM => ' + callMakerServedList.length);
    console.log ('Total CT-Recived-CM-Calls => ' + callTakerBusyList.length);

    // for live-call-center status
    CallCenterStatus = {
      allCallMakers: allCallMakerList.length,
      callMakersUnderWaiting: callMakerPendingList.length,
      servedCallMakers: callMakerServedList.length,
      activeCallTaker: callTakerActiveList.length,
      busyCallTaker: callTakerBusyList.length,
      offlineCallTaker: callTakerOfflineList.length,
      onTalkCallMakerID: callMaker.callMakerID,
      onTalkCallMakerName: callMaker.username,
      onTalkCallLine: callMaker.url,
      onTalkCallTakerID: callTaker.callTakerId,
      onTalkCallTakerName: callTaker.username,
      onTalkPairList: onRecivingCall,
    };
  } else {
    console.log (
      'Total Active-CT..(CT-Online) => ' +
        callTakerActiveList.length +
        ' || Their Info...'
    );
    console.log (callTakerActiveList);

    // for live-call-center status
    CallCenterStatus = {
      allCallMakers: allCallMakerList.length,
      callMakersUnderWaiting: callMakerPendingList.length,
      servedCallMakers: callMakerServedList.length,
      activeCallTaker: callTakerActiveList.length,
      busyCallTaker: callTakerBusyList.length,
      offlineCallTaker: callTakerOfflineList.length,
      onTalkCallMakerID: 'Sorry, no-one talks now..',
      onTalkCallMakerName: 'Sorry, no-one talks now..',
      onTalkCallLine: 'Sorry, no-active line right now..',
      onTalkCallTakerID: 'Sorry, no-one talks now..',
      onTalkCallTakerName: 'Sorry, no-one talks now..',
      onTalkPairList: onRecivingCall,
    };
  }
  res.send ({
    callMakerUrl: '',
    callTakerId: '',
  });
  console.log ('Statics Info...');
  console.log ('Total Served CM => ' + callMakerServedList.length);
  console.log ('Total CM-Under Waiting => ' + callMakerPendingList.length);
  console.log (
    'Total CT-Recived-CM-Calls (Busy-State) => ' + callTakerBusyList.length
  );
  console.log ('Total CT-Online (Active-CT) => ' + callTakerActiveList.length);
  console.log ('Total Number OF-CALL => ' + allCallMakerList.length);
});
app.get ('/', function (request, response) {
  console.log ('(Someone Preparing TO-Dial) ||GET request to /Homepage/');
  response.sendFile (__dirname + '/index.html');
});

app.get ('/session/:username/:latitude/:longitude', function (
  request,
  response
) {
  console.log (
    '( ' +
      request.params.username +
      ' Dialling) ||GET request to /session/' +
      request.params.username
  );
  response.sendFile (__dirname + '/session.html');
});

// https://dispatch-system-v2-production.up.railway.app/session/:username/:latitude/:longitude'
app.post ('/session/:username/:latitude/:longitude', async (req, res) => {
  let IncomingCallMaker = {
    callMakerID: crypto.randomBytes (16).toString ('hex'),
    username: req.params.username,
    latitude: req.params.latitude,
    longitude: req.params.longitude,
    url: `https://dispatch-system-v2-production.up.railway.app/session/${req.params.username}/${req.params.latitude}/${req.params.longitude}`,
  };

  console.log ('##################################Lat-Longt##################');
  console.log (req.params.latitude);
  console.log (req.params.longitude);
  console.log ('##################################Lat-Longt##################');

  let repatitionExistance = false;
  for (let i = 0; i < allCallMakerList.length; i++) {
    if (allCallMakerList[i].username == IncomingCallMaker.username) {
      console.log (
        'Username Already Reserved By Anothe User.|| try by another username...'
      );
      repatitionExistance = true;
    }
  }

  // https://opentok-server-production.up.railway.app/session/${IncomingCallMaker.username}
  let TenawData = await axios
    .post (
      `https://ssid-api-key-provider-server-v2-production.up.railway.app/session/${IncomingCallMaker.username}`
    )
    .then (res => {
      return res.data;
    });
  if (!repatitionExistance) {
    allCallMakerList.push (IncomingCallMaker);
    callMakerPendingList.push (IncomingCallMaker);
    console.log ('New CM-Dialling || Full Info...');
    console.log (IncomingCallMaker);
  }
  if (callTakerActiveList.length > 0 && callMakerPendingList.length > 0) {
    console.log ('Total Active-CT => ' + callTakerActiveList.length);
    let CallTaker = callTakerActiveList[0];
    console.log (CallTaker);
    console.log ('Total CM- Under Waiting => ' + callMakerPendingList.length);
    let firstCallMaker = callMakerPendingList[0];

    InitialCallMaker = {
      username: firstCallMaker.username,
      callTakerId: CallTaker.callTakerId,
      url: firstCallMaker.url,
      latitude: firstCallMaker.latitude,
      longitude: firstCallMaker.longitude,
    };

    onRecivingCall.push (InitialCallMaker);
    callMakerServedList.push (firstCallMaker);
    callTakerBusyList.push (CallTaker);
    callTakerActiveList.shift ();
    callMakerPendingList.shift ();
    console.log (
      'One CM-Picked To Serve Right-Now...|| (The CM-Under Serving...)'
    );
    console.log (firstCallMaker);
    console.log (
      'One CT Recived Incoming Call Right-Now...|| (The CT-Recived a Call...)'
    );
    console.log (CallTaker);

    console.log (
      'After Served One CM... Remaining CM-Under Waiting => ' +
        callMakerPendingList.length +
        ' || Their Info...'
    );
    console.log (callMakerPendingList);
    console.log (
      'After Recived One Call... Remaining Active-CT => ' +
        callTakerActiveList.length +
        ' || Their Info...'
    );
    console.log (callTakerActiveList);

    // for live-call-center status
    CallCenterStatus = {
      allCallMakers: allCallMakerList.length,
      callMakersUnderWaiting: callMakerPendingList.length,
      servedCallMakers: callMakerServedList.length,
      activeCallTaker: callTakerActiveList.length,
      busyCallTaker: callTakerBusyList.length,
      offlineCallTaker: callTakerOfflineList.length,
      onTalkCallMakerID: firstCallMaker.callMakerID,
      onTalkCallMakerName: firstCallMaker.username,
      onTalkCallLine: firstCallMaker.url,
      onTalkCallTakerID: CallTaker.callTakerId,
      onTalkCallTakerName: CallTaker.username,
      onTalkPairList: onRecivingCall,
    };
  } else {
    console.log (
      'Total CM-Under Waiting => ' +
        callMakerPendingList.length +
        ' || Their Info...'
    );
    console.log (callMakerPendingList);

    // for live-call-center status if there is no active call-taker
    CallCenterStatus = {
      allCallMakers: allCallMakerList.length,
      callMakersUnderWaiting: callMakerPendingList.length,
      servedCallMakers: callMakerServedList.length,
      activeCallTaker: callTakerActiveList.length,
      busyCallTaker: callTakerBusyList.length,
      offlineCallTaker: callTakerOfflineList.length,
      onTalkCallMakerID: 'Sorry, no-one talks now..',
      onTalkCallMakerName: 'Sorry, no-one talks now..',
      onTalkCallLine: 'Sorry, no-active line right now..',
      onTalkCallTakerID: 'Sorry, no-one talks now..',
      onTalkCallTakerName: 'Sorry, no-one talks now..',
      onTalkPairList: onRecivingCall,
    };
  }
  res.send ({
    sessionId: TenawData.sessionId,
    apiKey: TenawData.apiKey,
    token: TenawData.token,
  });

  console.log ('Statics Info...');
  console.log ('Total Served CM => ' + callMakerServedList.length);
  console.log ('Total CM-Under Waiting => ' + callMakerPendingList.length);
  console.log (
    'Total CT-Recived-CM-Calls (Busy-State) => ' + callTakerBusyList.length
  );
  console.log ('Total CT-Online (Active-CT) => ' + callTakerActiveList.length);
  console.log ('Total Number OF-CALL => ' + allCallMakerList.length);
});

app.post ('/calltaker-endcall/:id', function (req, res) {
  let EndCallId = req.params.id;
  console.log (EndCallId);
  for (let i = 0; i < callTakerBusyList.length; i++) {
    if (EndCallId === callTakerBusyList[i].callTakerId) {
      let calltaker = callTakerBusyList[i];
      console.log ('CT-With ID => ' + EndCallId + ' Finished Call...');

      if (callMakerPendingList.length > 0) {
        let CallMaker = callMakerPendingList[0];
        console.log (
          'One CM-Picked To Serve Right-Now...|| (The CM-Under Serving...)'
        );
        console.log (CallMaker);
        InitialCallMaker = {
          username: CallMaker.username,
          callTakerId: calltaker.callTakerId,
          url: CallMaker.url,
          latitude: CallMaker.latitude,
          longitude: CallMaker.longitude,
        };
      } else {
        callTakerActiveList.push (calltaker);
        callTakerBusyList.splice (i, 1);
        console.log (
          'CT-With ID => ' +
            EndCallId +
            ' Finished Call... Ready-TO-Recive Other Call || Full Info...'
        );
        console.log (calltaker);
      }
    }
  }

  res.send ('End Call');

  console.log ('Statics Info...');
  console.log (
    'Total CT-Recived-CM-Calls (Busy-State) => ' + callTakerBusyList.length
  );
  console.log ('Total CT-Online (Active-CT) => ' + callTakerActiveList.length);
  console.log ('Total Served CM => ' + callMakerServedList.length);
  console.log ('Total CM-Under Waiting => ' + callMakerPendingList.length);
});

app.post ('/browser-closed/:id', function (req, res) {
  let CallTecId = req.params.id;
  console.log (
    '@@@@@@@@@@@@@@@@@@@@@@The CT-With ID => ' +
      CallTecId +
      ' is Trying 2-OUT...'
  );
});
app.post ('/browser-Reload/:id', function (req, res) {
  let CallTecId = req.params.id;
  console.log (
    '#####################The CT-With ID => ' +
      CallTecId +
      ' is Trying 2-Reload...'
  );
});

const server = http.createServer (app);
server.listen (MY_PORT);
