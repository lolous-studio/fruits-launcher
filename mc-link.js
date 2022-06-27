const express = require('express');
const app = express();
var cors = require('cors');
const port = 1992;

app.use(cors());
var corsOptions = {
  origin: 'fruits.lolous.studio, localhost',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.get('/', cors(corsOptions), (req, res) => {
  res.sendStatus(200);
});

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
