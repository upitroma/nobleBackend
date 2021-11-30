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

	//stores an ip address with a hostname and adds it to dyndns.json
	//ex mywebsite.com/api/id.key/dyndns/ip=1.2.3.4&hostname=example
	//FIXME: add rate limiting to limit spam and abuse
	else if(cmd=="dnsupdate" && key.perms.includes("dns_write")){
		var ip=""
		var hostname=""
		var overwrite=false

		var response=""

		//get ip and hostname
		wildcard.split("&").forEach(function(property){
			var split=property.split("=")
			var key=split[0]
			var value=split[1]
			if (key=="ip"){
				ip=value
			}
			else if(key=="hostname"){
				hostname=value
			}
			else if(key=="overwrite" && value=="true"){
				overwrite=true
			}
		})
		if(!ip){
			ip=req.headers['x-forwarded-for'] || req.ip.split(':')[3]
		}
		if(!hostname){
			hostname=req.headers.host || req.headers.hostname || "unknown"
		}

		//sanitize hostname and ip
		hostname=hostname.replace(/[^a-zA-Z0-9-]/g,"").substr(0,20)
		ip=ip.replace(/[^0-9.]/g,"").substr(0,15)

		//create dyndns.json if it doesn't exist
		if(!fs.existsSync('dyndns.json')){
			fs.writeFileSync('dyndns.json', '[]')
		}

		var dyndns=JSON.parse(fs.readFileSync("dyndns.json", "utf8"))

		//check if hostname already exists, ignore if overwrite is true
		var exists=false
		dyndns.forEach(function(entry){
			if(entry.hostname==hostname){
				exists=true
				if(overwrite){
					//replace entry
					entry.ip=ip
					fs.writeFileSync("dyndns.json", JSON.stringify(dyndns, null, 4), "utf8")
					response="Updated "+hostname+" to "+ip
				}
				else{
					response="hostname allready assigned to "+entry.ip+". set overwrite=true to your query to force the change"
				}
			}
		})
		if(!exists){
			//add new entry
			dyndns.push({
				ip: ip,
				hostname: hostname
			})
			fs.writeFileSync("dyndns.json", JSON.stringify(dyndns, null, 4), "utf8")
			response="Added "+hostname+" to dyndns.json"
		}

		callback({
			head:{
				code:200,
				metadata:{"Content-Type": "text/plain; charset=UTF-8"}
			},
			body:response
		})
		
	}

	//returns the ip address of a given hostname from dyndns.json
	else if(cmd=="dns" && (key.perms.includes("dns") || key.perms.includes("dns_write"))){
		var response=""
		var foundhostname=false
		var dyndns=JSON.parse(fs.readFileSync("dyndns.json", "utf8"))
		dyndns.forEach(function(entry){
			if(entry.hostname==wildcard){
				response=entry.ip
				foundhostname=true
			}
		})
		if(!foundhostname){
			response="hostname not found"
		}

		callback({
			head:{
				code:200,
				metadata:{"Content-Type": "text/plain; charset=UTF-8"}
			},
			body:response
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
				code:403,
				metadata:{"Content-Type": "text/plain; charset=UTF-8"}
			},
			body:"Error: Invalid cmd or insufficient permissions"
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
