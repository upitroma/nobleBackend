const express = require('express');
const fs = require('fs')
const crypto = require('crypto');
const http = require('http');

const PORT = 8000

var app = express();

//http://172.17.0.2/api/12345/self
app.get("/api/:key/:cmd*",async function(req, res){

	//TODO: add slight random delay to stop timing attacks

	//response
	var resHeader;
	var resBody;

	//get keys from secrets.json
	var raw = fs.readFileSync('secrets.json');
	KEYS = JSON.parse(raw);
	
	//get vars from url
	var key = req.params.key;
	var cmd = req.params.cmd;
	var wildcard=req.params[0]

	//check for valid key
	var userkey;
	var accessGranted=false
	var keyArr = key.split(".");
	for(i=0;i<KEYS.length;i++){
		if(keyArr[0]==KEYS[i].id){
			var hash = crypto.createHash('sha256').update(keyArr[1]).digest('hex');
			if(hash==KEYS[i].keyHash){
				//check expiration date
				if(new Date(KEYS[i].expiration)>new Date()){
					console.log("access granted")

					execAPI(KEYS[i],cmd,wildcard, callback =>{
						console.log("callback!")
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
	if(cmd=="self" && key.perms.includes("dev")){
		callback({
			head:{
				code:200,
				metadata:{"Content-Type": "text/plain; charset=UTF-8"}
			},
			body:fs.readFileSync('./index.js').toString()
		})
	}
	else if(cmd=="vpn" && key.perms.includes("vpn")){
		var pageBody="";

		const URL = wildcard.substring(1)
		console.log(URL)

		const options = {
			host:"example.com",
			path:"/"
		}
		var request = http.request(options, function (res) {
			var data = '';
			res.on('data', function (chunk) {
				data += chunk;
			});
			res.on('end', function () {
				console.log("why is this not returning");	
				callback({
					head:{
						code:200,
						metadata:{"Content-Type": "text/plain; charset=UTF-8"}
					},
					body:data
				})
			});
		});
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
	/*//	var obj = { key : key, Content : "content " +idk };
	if(key==12345){
		if(cmd=="self"){
			res.writeHead(200, {"Content-Type": "text/plain; charset=UTF-8"});
			res.write(fs.readFileSync('./index.js').toString());
			res.end();
		}
		else{
			res.writeHead(404);
			res.end();
		}
		console.log(cmd)
		console.log(wildcard)
	}
});
*/
app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`)
})
