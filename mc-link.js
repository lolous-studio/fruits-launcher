const express = require('express');
const app = express();
var cors = require('cors');
const port = 1992;

app.use(cors());
var corsOptions = {
  origin: 'https://fruits.lolous.studio',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.get('/', cors(corsOptions), (req, res) => {
  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Fruits listening on port ${port}`);
});



const { Client, Authenticator } = require('minecraft-launcher-core');
const { v4: uuidv4 } = require('uuid')
const launcher = new Client();

let versions = {
  "forge_1.13.2":{minecraftVersion:"1.13.2", modLinks:[], versionType:"release", texturepacksLinks[]:, shaderpacksLinks:[], mapsLinks:[], isForge: true, forgeLink: "https://fruits.lolous.studio/forge-1.13.2.jar"},
  "forge_1.12.2":{minecraftVersion:"1.12.2", modLinks:[], versionType:"release", texturepacksLinks[]:, shaderpacksLinks:[], mapsLinks:[], isForge: true, forgeLink: "https://fruits.lolous.studio/forge-1.12.2.jar"},
  "minecraft_1.19":{minecraftVersion:"1.19", modLinks:[], versionType:"release", texturepacksLinks[]:, shaderpacksLinks:[], mapsLinks:[], isForge: false},
  "minecraft_1.18":{minecraftVersion:"1.18", modLinks:[], versionType:"release", texturepacksLinks[]:, shaderpacksLinks:[], mapsLinks:[], isForge: false},
  "minecraft_1.12":{minecraftVersion:"1.12", modLinks:[], versionType:"release", texturepacksLinks[]:, shaderpacksLinks:[], mapsLinks:[], isForge: false},
}

MCuuid = uuidv4();
const user = {
  access_token: "",
  client_token: MCuuid,
  uuid: "",
  name: ""
}

app.get("/api/v1/launch/:versionID", (req, res)=>{
  versionID = req.params.versionID;
  let opts = {
    clientPackage: null,
    authorization: user,
    root: "./minecraft",
    checkFiles:true,
    version: {
      number: versions[versionID].minecraftVersion,
      type: versions[versionID].versionType
    },
    memory: {
      max: "6G",
      min: "4G"
    }
  }
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
