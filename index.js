const axios = require('axios');
const express = require('express');
const fs = require('fs');
const app = express();
const port = 4000;


// const redirect_uri = "http://localhost:3000/redirect";
const redirect_uri = "https://fruits.lolous.studio/redirect";

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

app.get('/healthz', (req, res) => {
  res.sendStatus(200);
});

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

let db = {
  "forge_1.12.2":{versionID:"forge_1.12.2", title:"Forge 1.12.2", btnText:"Jouer gratuitement", banner:"https://i.pinimg.com/originals/12/f2/d8/12f2d843f320e42a7712bb806dc20970.jpg", logo:"https://files.minecraftforge.net/static/images/logo.svg", icon:"https://pbs.twimg.com/profile_images/778706890914095109/fhMDH9o6_400x400.jpg", description:"Customize how your minecraft look and behave with the help of forge! Install mods to make your Minecraft feel like yours.", gameStat:"disponible et gratuit"},
  "minecraft_1.19":{versionID:"minecraft_1.19", title:"Minecraft 1.19", btnText:"Jouer gratuitement", banner:"/thumbs/minecraft 1.19.jpg", logo:"https://www.minecraft-france.fr/wp-content/uploads/2021/10/Minecraft_1.19_Wild_Update_Logo-768x218.png", icon:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQne0t-5uaF_3jR5ewomb8M_XfWO0qds5Qi97Tzh0hZZS7JSVWIbNZKPscUOI1FEyplpjM&usqp=CAU", description:"Lancez-vous dans l’aventure, flânez sans but ou cherchez les nouveautés dans The Wild Update ! Une infinité de choix s’offrent à vous.", gameStat:"nouveautée gratuite"},
  "minecraft_1.18":{versionID:"minecraft_1.18", title:"Minecraft 1.18", btnText:"Jouer gratuitement", banner:"https://upload.fr-minecraft.net/images/frminecraft/fr-minecraft_RFBY_caves-cliffs-update-part-i-official-trailer-mp4-snapshot-00-.jpg", logo:"https://minecraft.fr/wp-content/uploads/2020/06/minecraft-1-17-cave-grotte-falaise.png", icon:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQne0t-5uaF_3jR5ewomb8M_XfWO0qds5Qi97Tzh0hZZS7JSVWIbNZKPscUOI1FEyplpjM&usqp=CAU", description:"Découvrez des montagnes, des caves et des biomes plus grands, ainsi qu’une hauteur de monde augmentée et qu’une mise à jour de la génération de terrain dans la mise à jour Cavernes et falaises.", gameStat:"disponible et gratuit"},
  "minecraft_1.12":{versionID:"minecraft_1.12", title:"Minecraft 1.12", btnText:"Jouer gratuitement", banner:"https://minecraft.fr/wp-content/uploads/2017/06/b1c06cfe1e13734b3da8912f424e75ac-mc112_header.png", logo:"/logos/minecraft 1.12.png", icon:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQne0t-5uaF_3jR5ewomb8M_XfWO0qds5Qi97Tzh0hZZS7JSVWIbNZKPscUOI1FEyplpjM&usqp=CAU", description:"Sunlight yellow, chili red, royal blue, midnight black, grass green, lilac purple, true lime, fresh salmon, hot cappuccino, pretty much all of the off-white, annoying cyan, alpha-tested magenta, that brown-greenish barf shade... the World of Color update is here!", gameStat:"disponible et gratuit"},
  "forge_1.13":{versionID:"forge_1.13", title:"Forge 1.13", btnText:"Jouer gratuitement", banner:"https://www.teahub.io/photos/full/41-419000_minecraft-seus-shader.jpg", logo:"https://files.minecraftforge.net/static/images/logo.svg", icon:"https://pbs.twimg.com/profile_images/778706890914095109/fhMDH9o6_400x400.jpg", description:"Customize how your minecraft look and behave with the help of forge! Install mods to make your Minecraft feel like yours.", gameStat:"disponible et gratuit"},
  "forge_1.12.2":{versionID:"forge_1.12.2", title:"Forge 1.12.2", btnText:"Jouer gratuitement", banner:"https://i.pinimg.com/originals/12/f2/d8/12f2d843f320e42a7712bb806dc20970.jpg", logo:"https://files.minecraftforge.net/static/images/logo.svg", icon:"https://pbs.twimg.com/profile_images/778706890914095109/fhMDH9o6_400x400.jpg", description:"Customize how your minecraft look and behave with the help of forge! Install mods to make your Minecraft feel like yours.", gameStat:"disponible et gratuit"},
  "ftb_ultimate":{versionID:"ftb_ultimate", title:"FTB Ultimate", btnText:"Jouer gratuitement", banner:"https://wallpaper.dog/large/17064778.png", logo:"https://www.feed-the-beast.com/img/logo_ftb.417506fa.png", icon:"https://www.feed-the-beast.com/img/ftb-avatar-logo.c7da2642.png", description:"With a perfect blend of tech and magic, Ultimate provid millions of players the opportunity to play either solo or with friends and explore new worlds and dimensions as well as build massive bases filled with technological and magical constructs.", gameStat:"disponible et gratuit"},
}

app.get('/api/v1/store/banners', (req, res) => {
  res.send([
    {versionID:"forge_1.12.2", title:"Forge 1.12.2", btnText:"Jouer gratuitement", banner:"https://i.pinimg.com/originals/12/f2/d8/12f2d843f320e42a7712bb806dc20970.jpg", logo:"https://files.minecraftforge.net/static/images/logo.svg", icon:"https://pbs.twimg.com/profile_images/778706890914095109/fhMDH9o6_400x400.jpg", description:"Customize how your minecraft look and behave with the help of forge! Install mods to make your Minecraft feel like yours.", gameStat:"disponible et gratuit"},
    {versionID:"minecraft_1.19", title:"Minecraft 1.19", btnText:"Jouer gratuitement", banner:"/thumbs/minecraft 1.19.jpg", logo:"https://www.minecraft-france.fr/wp-content/uploads/2021/10/Minecraft_1.19_Wild_Update_Logo-768x218.png", icon:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQne0t-5uaF_3jR5ewomb8M_XfWO0qds5Qi97Tzh0hZZS7JSVWIbNZKPscUOI1FEyplpjM&usqp=CAU", description:"Lancez-vous dans l’aventure, flânez sans but ou cherchez les nouveautés dans The Wild Update ! Une infinité de choix s’offrent à vous.", gameStat:"nouveautée gratuite"},
    {versionID:"forge_1.13", title:"Forge 1.13", btnText:"Jouer gratuitement", banner:"https://www.teahub.io/photos/full/41-419000_minecraft-seus-shader.jpg", logo:"https://files.minecraftforge.net/static/images/logo.svg", icon:"https://pbs.twimg.com/profile_images/778706890914095109/fhMDH9o6_400x400.jpg", description:"Customize how your minecraft look and behave with the help of forge! Install mods to make your Minecraft feel like yours.", gameStat:"populaire et gratuit"},
    {versionID:"ftb_ultimate", title:"FTB Ultimate", btnText:"Jouer gratuitement", banner:"https://wallpaper.dog/large/17064778.png", logo:"https://www.feed-the-beast.com/img/logo_ftb.417506fa.png", icon:"https://www.feed-the-beast.com/img/ftb-avatar-logo.c7da2642.png", description:"With a perfect blend of tech and magic, Ultimate provid millions of players the opportunity to play either solo or with friends and explore new worlds and dimensions as well as build massive bases filled with technological and magical constructs.", gameStat:"disponible et gratuit"},
    {versionID:"minecraft_1.18", title:"Minecraft 1.18", btnText:"Jouer gratuitement", banner:"https://upload.fr-minecraft.net/images/frminecraft/fr-minecraft_RFBY_caves-cliffs-update-part-i-official-trailer-mp4-snapshot-00-.jpg", logo:"https://minecraft.fr/wp-content/uploads/2020/06/minecraft-1-17-cave-grotte-falaise.png", icon:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQne0t-5uaF_3jR5ewomb8M_XfWO0qds5Qi97Tzh0hZZS7JSVWIbNZKPscUOI1FEyplpjM&usqp=CAU", description:"Découvrez des montagnes, des caves et des biomes plus grands, ainsi qu’une hauteur de monde augmentée et qu’une mise à jour de la génération de terrain dans la mise à jour Cavernes et falaises.", gameStat:"disponible et gratuit"},
  ]);
});

app.get('/api/v1/store/freeContent', (req, res) => {
  res.send([
    {versionID:"minecraft_1.19", title:"Minecraft 1.19", btnText:"Jouer gratuitement", banner:"/thumbs/minecraft 1.19.jpg", logo:"https://www.minecraft-france.fr/wp-content/uploads/2021/10/Minecraft_1.19_Wild_Update_Logo-768x218.png", icon:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQne0t-5uaF_3jR5ewomb8M_XfWO0qds5Qi97Tzh0hZZS7JSVWIbNZKPscUOI1FEyplpjM&usqp=CAU", description:"Lancez-vous dans l’aventure, flânez sans but ou cherchez les nouveautés dans The Wild Update ! Une infinité de choix s’offrent à vous.", gameStat:"nouveautée gratuite"},
    {versionID:"minecraft_1.18", title:"Minecraft 1.18", btnText:"Jouer gratuitement", banner:"https://upload.fr-minecraft.net/images/frminecraft/fr-minecraft_RFBY_caves-cliffs-update-part-i-official-trailer-mp4-snapshot-00-.jpg", logo:"https://minecraft.fr/wp-content/uploads/2020/06/minecraft-1-17-cave-grotte-falaise.png", icon:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQne0t-5uaF_3jR5ewomb8M_XfWO0qds5Qi97Tzh0hZZS7JSVWIbNZKPscUOI1FEyplpjM&usqp=CAU", description:"Découvrez des montagnes, des caves et des biomes plus grands, ainsi qu’une hauteur de monde augmentée et qu’une mise à jour de la génération de terrain dans la mise à jour Cavernes et falaises.", gameStat:"disponible et gratuit"},
    {versionID:"minecraft_1.12", title:"Minecraft 1.12", btnText:"Jouer gratuitement", banner:"https://minecraft.fr/wp-content/uploads/2017/06/b1c06cfe1e13734b3da8912f424e75ac-mc112_header.png", logo:"/logos/minecraft 1.12.png", icon:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQne0t-5uaF_3jR5ewomb8M_XfWO0qds5Qi97Tzh0hZZS7JSVWIbNZKPscUOI1FEyplpjM&usqp=CAU", description:"Sunlight yellow, chili red, royal blue, midnight black, grass green, lilac purple, true lime, fresh salmon, hot cappuccino, pretty much all of the off-white, annoying cyan, alpha-tested magenta, that brown-greenish barf shade... the World of Color update is here!", gameStat:"disponible et gratuit"},
    {versionID:"forge_1.13", title:"Forge 1.13", btnText:"Jouer gratuitement", banner:"https://www.teahub.io/photos/full/41-419000_minecraft-seus-shader.jpg", logo:"https://files.minecraftforge.net/static/images/logo.svg", icon:"https://pbs.twimg.com/profile_images/778706890914095109/fhMDH9o6_400x400.jpg", description:"Customize how your minecraft look and behave with the help of forge! Install mods to make your Minecraft feel like yours.", gameStat:"disponible et gratuit"},
    {versionID:"forge_1.12.2", title:"Forge 1.12.2", btnText:"Jouer gratuitement", banner:"https://i.pinimg.com/originals/12/f2/d8/12f2d843f320e42a7712bb806dc20970.jpg", logo:"https://files.minecraftforge.net/static/images/logo.svg", icon:"https://pbs.twimg.com/profile_images/778706890914095109/fhMDH9o6_400x400.jpg", description:"Customize how your minecraft look and behave with the help of forge! Install mods to make your Minecraft feel like yours.", gameStat:"disponible et gratuit"},
    {versionID:"ftb_ultimate", title:"FTB Ultimate", btnText:"Jouer gratuitement", banner:"https://wallpaper.dog/large/17064778.png", logo:"https://www.feed-the-beast.com/img/logo_ftb.417506fa.png", icon:"https://www.feed-the-beast.com/img/ftb-avatar-logo.c7da2642.png", description:"With a perfect blend of tech and magic, Ultimate provid millions of players the opportunity to play either solo or with friends and explore new worlds and dimensions as well as build massive bases filled with technological and magical constructs.", gameStat:"disponible et gratuit"},
  ]);
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






app.get('/browseAPI/store/:versionID', (req, res) => {
  fs.readFile('./pages/storepage.html', 'utf8', (err, data) => {
    if (err) {console.error(err);return;}
    data = data.replaceAll('{{title}}', db[req.params.versionID].title);
    data = data.replaceAll('{{bannerSrc}}', db[req.params.versionID].banner);
    data = data.replaceAll('{{iconSrc}}', db[req.params.versionID].icon);
    data = data.replaceAll('{{logoSrc}}', db[req.params.versionID].logo);
    data = data.replaceAll('{{description}}', db[req.params.versionID].description);
    data = data.replaceAll('{{gameStat}}', db[req.params.versionID].gameStat);
    res.send(data);
  });
});

app.get('/store', (req, res) => {
  res.redirect('/');
});

app.get('/store/:versionID', (req, res) => {
  res.redirect('/?storepage=' + req.params.versionID);
});

app.get('/library', (req, res) => {
  res.redirect('/?page=library');
});

app.get('/creaMC', (req, res) => {
  res.redirect('/?page=creaMC');
});







app.use(express.static('public'));
app.listen(port, () => {
  console.log(`Fruits listening on port ${port}`);
});
