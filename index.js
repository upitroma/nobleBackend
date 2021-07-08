const express = require('express');
const fs = require('fs')
var crypto = require('crypto');

const PORT = 8000

var app = express();

//http://172.17.0.2/api/12345/self
app.get("/api/:key/:cmd*",function(req, res){

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

					const response = execAPI(KEYS[i],cmd,wildcard)
					res.writeHead(response.head.code,response.head.body);
					res.write(response.body);
					res.end();
				}	
				break
			}
		}
	}
});

function execAPI(key,cmd,wildcard){
	if(cmd=="self" && key.perms.includes("dev")){
		return{
			head:{
				code:200,
				metadata:{"Content-Type": "text/plain; charset=UTF-8"}
			},
			body:fs.readFileSync('./index.js').toString()
		}
	}
	
	else{
		return{
			head:{
				code:200,
				metadata:{"Content-Type": "text/plain; charset=UTF-8"}
			},
			body:"Error: Invalid cmd or insufficient permissions"
		}
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
