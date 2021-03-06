const express = require('express');
const fs = require('fs')
const crypto = require('crypto');
const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 443

//colors
CReset = "\x1b[0m"
CYellow = "\x1b[33m"

/*
TODO:
dockerfile
asymetric encryption of uploaded files (not needed)
*/

var app = express();

app.use(express.static('website'))

//http://172.17.0.2/api/12345/self
app.get("/api/:key/:cmd*",async function(req, res){
	var key = checkKey(req.params.key);
	if(key){
		//get vars from url
		var cmd = req.params.cmd;
		var wildcard=req.params[0].substring(1)
		var query=req.url.split("?").slice(1).join("?") 
		
		//add queries to wildcard
		if(query.length>0){
			wildcard+="?"+query
		}


		console.log("access granted from: " + req.ip.split(':')[3]  +" to "+CYellow+"ID: "+CReset+ key.id+CYellow+" CMD: "+CReset+cmd+"/"+wildcard)

		execAPI(key,cmd,wildcard,req, callback =>{
			res.writeHead(callback.head.code,callback.head.metadata);
			res.write(callback.body);
			res.end();
		})
	}
	else{
		console.log("access denied from: " + req.ip.split(':')[3])
	}
});

//https://stackoverflow.com/questions/17981677/using-post-data-to-write-to-local-file-with-node-js-and-express
//curl -d 'this string will be saved to a file' -X POST https://[server]]/api/id.key/upload
// app.post('/api/:key/upload', function(req, res) {
// 	var key = checkKey(req.params.key);
// 	if(key){
// 		var body = ''
// 		filePath = 'uploads.txt'
// 		req.on('data', function(data) {
// 			body += data
// 		});
// 		body+="\n"

// 		req.on('end', function (){
// 			console.log(body)
// 			fs.appendFile(filePath, body, function() {
// 				res.end()
// 			})
// 		});
		
// 	}
// });



function checkKey(key){
	//get keys from secrets.json
	var raw = fs.readFileSync('secrets.json');
	KEYS = JSON.parse(raw);

	//check for valid key
	var keyArr = key.split(".");
	for(i=0;i<KEYS.length;i++){
		if(keyArr[0]==KEYS[i].id){
			var hash = crypto.createHash('sha256').update(keyArr[1]).digest('hex');
			if(hash==KEYS[i].keyHash){
				//check expiration date
				if(new Date(KEYS[i].expiration)>new Date()){
					return KEYS[i]
				}
			}
		}
	}
	return false
}

function execAPI(key,cmd,wildcard,req,callback){

	//return the source code for this project
	if(cmd=="source" && key.perms.includes("root")){
		callback({
			head:{
				code:200,
				metadata:{"Content-Type": "text/plain; charset=UTF-8"}
			},
			body:fs.readFileSync('./index.js').toString()
		})
	}

	//return info on used key
	else if(cmd=="self" && key.perms.includes("dev")){
		callback({
			head:{
				code:200,
				metadata:{"Content-Type": "application/json"}
			},
			body:JSON.stringify(key)
		})
	}

	//return a key with given properties
	//ex mywebsite.com/api/id.key/keygen/name=exampleKey&id=exampleid&perms=dev,vpn&expiration=2021-07-17T03:30:55.632Z
	else if(cmd=="keygen" && key.perms.includes("dev")){

		var err=""

		plus30days=new Date(new Date().getTime()+30*24*60*60*1000).toISOString()

		var keyProperties= {
			name: "placeholder key",
			id: "placeholder",
			perms: [],
			expiration: plus30days,
			keyHash: ""
		}

		//get properties from query
		var input=wildcard.split("&")
		input.forEach(function(property){
			var split=property.split("=")
			var key=split[0]
			var value=split[1]
			
			if(key=="name"){
				keyProperties.name=value
			}
			else if(key=="id"){
				keyProperties.id=value
			}
			else if(key=="perms"){
				value.split(",").forEach(function(perm){
					keyProperties.perms.push(perm)
				})
			}
			else if(key=="expiration"){
				keyProperties.expiration=value
			}
			
			else{
				err="invalid tokengen property: "+property+"\n\n"
				err+="available properties:\n"
				err+="name=string\n"
				err+="id=string\n"
				err+="perms=string,comma,seporated\n"
				err+="expiration=ISOString"
			}
		})

		//generate 20 char alphanumeric token
		var token="";
		var possible="ABCDEFGHJKLMNPRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"; //excluding look alike chars
		for(i=0;i<20;i++){
			token+=possible.charAt(Math.floor(Math.random()*possible.length));
		}
		keyProperties.keyHash=crypto.createHash('sha256').update(token).digest('hex')

		output = "[\n{\"key\":\""+keyProperties.id+"."+token+"\"},\n"
		output+=JSON.stringify(keyProperties)+"\n]"


		if(err==""){
			callback({
				head:{
					code:200,
					metadata:{"Content-Type": "application/json"}
				},
				body:output
			})
		}
		else{
			callback({
				head:{
					code:200,
					metadata:{"Content-Type": "text/plain; charset=UTF-8"}
				},
				body:err
			})
		}

	}

	//return the permissions for the active key
	else if(cmd=="perms"){
		callback({
			head:{
				code:200,
				metadata:{"Content-Type": "text/plain; charset=UTF-8"}
			},
			body:key.perms.toString()
		})
	}

	//return the current date
	else if(cmd=="date" && key.perms.includes("dev")){
		callback({
			head:{
				code:200,
				metadata:{"Content-Type": "text/plain; charset=UTF-8"}
			},
			body:new Date().toISOString()
		})
	}

	//returns the wildcard
	else if(cmd=="wildcard" && key.perms.includes("dev")){
		callback({
			head:{
				code:200,
				metadata:{"Content-Type": "text/plain; charset=UTF-8"}
			},
			body:wildcard
		})
	}

	//returns hash of wildcard
	//ex mywebsite.com/api/id.key/hash/wildcard
	else if(cmd=="hash" && key.perms.includes("dev")){
		callback({
			head:{
				code:200,
				metadata:{"Content-Type": "text/plain; charset=UTF-8"}
			},
			body:crypto.createHash('sha256').update(wildcard).digest('hex')
		})
	}
}

/*
//for http
app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`)
})
*/
//module.exports = app;

https.createServer({
	key: fs.readFileSync('./app.key'),
	cert: fs.readFileSync('./app.crt')
  }, app)
  .listen(PORT, function () {
	console.log(`Example app listening at https://localhost:${PORT}`)
})
