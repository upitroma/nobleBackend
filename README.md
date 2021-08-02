# nodeApiTesting
a place for me to mess around with bad api ideas
## install
1. ```npm install``` to install needed packages
2. generate ssl cert ```openssl req -newkey rsa:4096 -x509 -sha256 -days 365 -nodes -out app.crt -keyout app.key```
3. make a ```secrets.json```. (you can use example.secrets.json as a template)
4. run ```node index.js```

## api key attributes
* id (user defined)
* key (rng)(20 chars alphanumaric)
* expiration date (user defined, default 30 days)
* permissions (user defined)
* name (for organization, not used on client side)
* all keys will be in the format ```${id}.${key}```
* every key usage would be logged (obviously)

# current commands
* vpn - returns the content of another website
  * requires ```vpn``` perm
  * example: ```https://[server]/api/[id.key]/vpn/http://example.com/index.html``` would make the server fetch the content and return it to the user.
* source - return the source code for this project
  * requires ```admin``` perm
* perms - returns the permissions of the current key, comma seporated
  * no perms required
* self - returns all server side info on the current key
  * requires ```dev``` perm
* date - returns the current date in ISO format
  * requires ```dev``` perm
* wildcard - returns the wildcard in the url
  * requires ```dev``` perm
  * example: ```https://[server]/api/[id.key]/wildcard/Hello/World``` would return 'Hello/World'
* hash - returns the SHA256 hash of the wildcard
  * requires ```dev``` perm
  * example: ```https://[server]/api/[id.key]/hash/HelloWorld``` would return '872e4e50ce9990d8b041330c47c9ddd11bec6b503ae9386a99da8584e9bb12c4'



* keygen - returns a termplate key with given properties
  * requires ```dev``` perm
  * arguments
    * name - server side name
    * id - key id (must be unique)
    * perms - array of permissoins. default is empty
    * expiration - in ISO format. default is 30 days from present
  * example: ```https://[server]/api/[id.key]/keygen/name=exampleKey&id=exampleid&perms=dev,vpn&expiration=2021-07-17T03:30:55.632Z``` would return a template key with a name of 'exampleKey', an id of 'exampleid', 'dev' and 'vpn' permissions, and an expiration date of July 17, 2021 at 3:30am UTC.
* 


# todo
* module functionality to keep api code organized
