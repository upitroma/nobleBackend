const express = require('express');
const fs = require('fs')

const PORT = 80

var app = express();

//http://172.17.0.2/api/12345/self
app.get("/api/:key/:content",function(request, response){
	var key = request.params.key;
	var content = request.params.content;
    
	//	var obj = { key : key, Content : "content " +idk };
	if(key==12345){
		if(content=="self"){
			response.writeHead(200, {"Content-Type": "text/plain; charset=UTF-8"});
    			response.write(fs.readFileSync('./index.js').toString());
    			response.end();
		}
		else{
			response.writeHead(404);
			response.end();
		}
	}
});

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`)
})
