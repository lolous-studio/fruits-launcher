const axios = require('axios');
const express = require('express');
const app = express();
const port = 3000;

const app_id = "19b827cd-b22d-4417-9e99-38c4bfc5e256";
const app_secret = "Qsn8Q~5XPat5NyPTq1zEitudVKl9CuTvZu0dPbY3";
const app_id_secret = "ae388251-a757-41b4-95b1-a88e3def402d";
const redirect_uri = "http://localhost:3000/redirect";

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/pages/index.html');
});

app.get('/auth', (req, res) => {
  res.redirect(`https://login.live.com/oauth20_authorize.srf?client_id=${app_id}&response_type=code&redirect_uri=${redirect_uri}&scope=XboxLive.signin%20offline_access&display=popup`);
});

app.get('/api/v1/user/me', (req, res) => {
  if (!req.query.MCtoken){
    res.send();
    return
  }
  axios
    .get(`https://api.minecraftservices.com/minecraft/profile`, 
      {headers: {"Accept": 'application/json',"Authorization":`Bearer ${req.query.MCtoken}`}})
    .then(result => {
      // console.log(res.data.access_token);
      res.send(result.data);
    })
    .catch(error => {
      console.error(error);
    });
});
function getUserName(MCtoken, callback){
  axios
    .get(`https://api.minecraftservices.com/minecraft/profile`, 
      {headers: {"Accept": 'application/json',"Authorization":`Bearer ${MCtoken}`}})
    .then(result => {
      // console.log(res.data.access_token);
      return callback(result.data.name, MCtoken, result.data.id);
    })
    .catch(error => {
      console.error(error);
    });
}
app.get('/api/v1/user/me/names', (req, res) => {
  if (!req.query.MCtoken){
    res.send();
    return
  }
  getUserName(req.query.MCtoken, (userName, MCtoken, uuid)=>{
    axios
    .get(`https://api.mojang.com/user/profiles/${uuid}/names`, 
      {headers: {"Accept": 'application/json',"Authorization":`Bearer ${req.query.MCtoken}`}})
    .then(result => {
      // console.log(res.data.access_token);
      res.send(result.data);
    })
    .catch(error => {
      console.error(error);
    });
  });
});
app.get('/api/v1/user/me/pfp', (req, res) => {
  if (!req.query.MCtoken){
    res.send();
    return
  }
  getUserName(req.query.MCtoken, (userName, MCtoken, uuid)=>{
    axios
    .get(`https://minecraft-api.com/api/skins/${userName}/head/0.0/0/12/json`,
      {headers: {"Accept": 'image/png',"Authorization":`Bearer ${req.query.MCtoken}`}})
    .then(result => {
      // console.log(res.data.access_token);
      res.send(result.data);
    })
    .catch(error => {
      console.error(error);
    });
  });
});


// https://api.minecraftservices.com/minecraft/profile

app.get('/auth/failed', (req, res) => {
  if (!req.query.error){
    res.send(`<h1>Oups... something went wrong :/</h1><p>Looks like you tried to connect to your microsoft account and it saddly failed in an unknown way...</p>`);
    return
  }
  res.send(`<h1>${req.query.error}</h1>`);
});

app.get('/auth/success', (req, res) => {
  if (!req.query.MCtoken){
    res.redirect("/auth/failed");
    return
  }
  res.send(`<body><script>localStorage.MCtoken='${req.query.MCtoken}';window.close();</script></body>`);
});

app.get('/redirect', (req, res) => {
  axios
    .post(`https://login.live.com/oauth20_token.srf?client_id=&client_secret=${app_secret}&code=${req.query.code}&grant_type=authorization_code&redirect_uri=${redirect_uri}`, 
      `client_id=${app_id}&redirect_uri=${redirect_uri}&client_secret=${app_secret}&code=${req.query.code}&grant_type=authorization_code`,
      {headers: {"content-type": 'application/x-www-form-urlencoded',}})
    .then(result => {
      // console.log(res.data.access_token);
      XBLauth(result.data.access_token, (haveMC, MCtoken)=>{
        if (!haveMC){
          res.redirect("/auth/failed?error=You don't have Minecraft !");
        }
        res.redirect("/auth/success?MCtoken=" + MCtoken);
      });
    })
    .catch(error => {
      console.error(error);
    });
});

function XBLauth(access_token, callback){
  axios
    .post(`https://user.auth.xboxlive.com/user/authenticate`, 
      {
        "Properties": {
            "AuthMethod": "RPS",
            "SiteName": "user.auth.xboxlive.com",
            "RpsTicket": `d=${access_token}` // your access token from step 2 here
        },
        "RelyingParty": "http://auth.xboxlive.com",
        "TokenType": "JWT"
      },
      {headers: {"content-type": 'application/json',"Accept": 'application/json'}})
    .then(res => {
      xbl_token = res.data.Token;
      XSTSauth(xbl_token, (haveMC, MCtoken)=>{
        return callback(haveMC, MCtoken);
      });
    })
    .catch(error => {
      console.error(error);
    });
}

function XSTSauth(xbl_token, callback){
  axios
    .post(`https://xsts.auth.xboxlive.com/xsts/authorize`, 
      {
        "Properties": {
          "SandboxId": "RETAIL",
          "UserTokens": [xbl_token]
        },
        "RelyingParty": "rp://api.minecraftservices.com/",
        "TokenType": "JWT"
      },
      {headers: {"content-type": 'application/json',"Accept": 'application/json',}})
    .then(res => {
      xsts_token = res.data.Token;
      userhash = res.data.DisplayClaims.xui[0].uhs;
      MINECRAFTauth(xsts_token, userhash, (haveMC, MCtoken)=>{
        return callback(haveMC, MCtoken);
      });
    })
    .catch(error => {
      console.error(error);
    });
}

function MINECRAFTauth(xsts_token, userhash, callback){
  axios
    .post(`https://api.minecraftservices.com/authentication/login_with_xbox`, 
      {
        "identityToken": `XBL3.0 x=${userhash};${xsts_token}`
      },
      {headers: {"content-type": 'application/json',"Accept": 'application/json',}})
    .then(res => {
      user_uuid = res.data.username;
      MC_access_token = res.data.access_token;
      checkMinecraftOwnership(MC_access_token, (haveMC, MC_access_token)=>{
        return callback(haveMC, MC_access_token);
      });
    })
    .catch(error => {
      console.error(error);
    });
}

function checkMinecraftOwnership(MC_access_token, callback){
  axios
    .get(`https://api.minecraftservices.com/entitlements/mcstore`,
      {headers: {"Authorization":`Bearer ${MC_access_token}`}})
    .then(res => {
      const checkGame = obj => obj.name === 'game_minecraft';
      const checkProduct = obj => obj.name === 'product_minecraft';

      if (res.data.items.some(checkGame) && res.data.items.some(checkProduct)) {
          return callback(true, MC_access_token);
      } else {
          return callback(false, MC_access_token);
      }     
    })
    .catch(error => {
      console.error(error);
    });
};

app.listen(port, () => {
  console.log(`Fruits listening on port ${port}`);
});










const { Client, Authenticator } = require('minecraft-launcher-core');
const { uuid } = require('uuidv4');
const launcher = new Client();

MCuuid = uuid();
const user = {
  access_token: "eyJhbGciOiJIUzI1NiJ9.eyJ4dWlkIjoiMjUzNTQ2MzkzNjg0NDM5NiIsImFnZyI6IkFkdWx0Iiwic3ViIjoiMzE4Nzg2MDgtNzI1NS00MGZhLTg2OGMtZjVhNWQxZDAxMjc5IiwibmJmIjoxNjU0NjM1MDY5LCJhdXRoIjoiWEJPWCIsInJvbGVzIjpbXSwiaXNzIjoiYXV0aGVudGljYXRpb24iLCJleHAiOjE2NTQ3MjE0NjksImlhdCI6MTY1NDYzNTA2OSwicGxhdGZvcm0iOiJVTktOT1dOIiwieXVpZCI6IjE2NGRkMWNiZjgwY2I1OWE4ZjJmNTQxY2Q2ZjY3MjIxIn0.rcmZrEKl0_FzivsS2U_14sm5qNULAj5jad99y67yu6E",
  client_token: MCuuid,
  uuid: "230583ff9c374626870df2d53276e72d",
  name: "LolouTheFox"
}
let opts = {
    clientPackage: null,
    // For production launchers, I recommend not passing 
    // the getAuth function through the authorization field and instead
    // handling authentication outside before you initialize
    // MCLC so you can handle auth based errors and validation!
    authorization: user,
    root: "./minecraft",
    checkFiles:true,
    version: {
        number: "1.19",
        type: "release"
    },
    memory: {
        max: "6G",
        min: "4G"
    }
}

app.get("/api/v1/launch/:versionname", (req, res)=>{
  launcher.launch(opts);
});

launcher.on('debug', (e) => console.log("[DEBUG]" + e));
launcher.on('data', (e) => console.log("[DATA]" + e));
launcher.on('error', (e) => console.log("[ERROR]" + e));
launcher.on('download-status', (e) => {
  console.log("[Downloading " + e.type + "]", "[" + e.name + "]", Math.round(e.current/e.total*100));
});
launcher.on('verification-status', (e) => {
  console.log("[Checking " + e.name + "]", Math.round(e.current/e.total*100));
});
launcher.on('launch', (e) => {
  console.log("[MINECRAFT]", "launching Minecraft");
});