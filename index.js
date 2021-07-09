const express = require('express');
const fs = require('fs')
const crypto = require('crypto');
const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 8000

//colors
CReset = "\x1b[0m"
CYellow = "\x1b[33m"

/*
TODO:
ssl
method of generating keys
logging
dockerfile
file uploading
	asymetric encryption of said files

*/

var app = express();

//http://172.17.0.2/api/12345/self
app.get("/api/:key/:cmd*",async function(req, res){

	//TODO: add slight random delay to stop timing attacks

	//get keys from secrets.json
	var raw = fs.readFileSync('secrets.json');
	KEYS = JSON.parse(raw);
	
	//get vars from url
	var key = req.params.key;
	var cmd = req.params.cmd;
	var wildcard=req.params[0].substring(1)

	//add queries to wildcard
	var query=req.url.split("?").slice(1).join("?")
	if(query.length>0){
		wildcard+="?"+query
	}

	//check for valid key
	var keyArr = key.split(".");
	for(i=0;i<KEYS.length;i++){
		if(keyArr[0]==KEYS[i].id){
			var hash = crypto.createHash('sha256').update(keyArr[1]).digest('hex');
			if(hash==KEYS[i].keyHash){
				//check expiration date
				if(new Date(KEYS[i].expiration)>new Date()){
					console.log("access granted to "+CYellow+"ID: "+CReset+ KEYS[i].id+CYellow+" CMD: "+CReset+cmd+"/"+wildcard)

					execAPI(KEYS[i],cmd,wildcard, callback =>{
						res.writeHead(callback.head.code,callback.head.body);
						res.write(callback.body);
						res.end();
					})
				}	
				break
			}
		}
	}
});

function execAPI(key,cmd,wildcard,callback){
	//return the source code for this project
	if(cmd=="self" && key.perms.includes("dev")){
		callback({
			head:{
				code:200,
				metadata:{"Content-Type": "text/plain; charset=UTF-8"}
			},
			body:fs.readFileSync('./index.js').toString()
		})
	}

	else if(cmd=="perms"){
		callback({
			head:{
				code:200,
				metadata:{"Content-Type": "text/plain; charset=UTF-8"}
			},
			body:key.perms.toString()
		})
	}

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
	else if(cmd=="hash" && key.perms.includes("dev")){
		callback({
			head:{
				code:200,
				metadata:{"Content-Type": "text/plain; charset=UTF-8"}
			},
			body:crypto.createHash('sha256').update(wildcard).digest('hex')
		})
	}


	//return the body of the webpage specified
	//ex mywebsite.com/api/id.key/vpn/example.com
	else if(cmd=="vpn" && key.perms.includes("vpn")){
		try{
			var pageBody="";

			//parse url
			const url = new URL(wildcard)
	
			//pick between http and https
			var client = http;
			client=(url.protocol=="https:") ? https:client;
	
			//make the request
			var request = client.request(url, function (res) {
				var data = '';
				res.on('data', function (chunk) {
					data += chunk;
				});
				res.on('end', function () {
					callback({
						head:{
							code:200,
							metadata:{"Content-Type": "text/plain; charset=UTF-8"}
						},
						body:data
					})
				});
			});

			//if something goes wrong with the request
			request.on('error', function (e) {
				err=e.message 
				console.log(err);
				callback({
					head:{
						code:200,
						metadata:{"Content-Type": "text/plain; charset=UTF-8"}
					},
					body:err
				})
			});
			request.end();
		}

		//if something else happens
		catch(e){
			callback({
				head:{
					code:200,
					metadata:{"Content-Type": "text/plain; charset=UTF-8"}
				},
				body:e.message
			})
		}
		
		
	}

	//Invalid cmd or insufficient permissions
	else{
		callback({
			head:{
				code:200,
				metadata:{"Content-Type": "text/plain; charset=UTF-8"}
			},
			body:"Error: Invalid cmd or insufficient permissions"
		})
	}
}

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`)
})
