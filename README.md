# nodeApiTesting
a place for me to mess around with bad api ideas
## api key attributes
* id (rng)(5 chars)
* key (rng)(30 chars a-z,A-Z,0-9, no look alike chars)(stored as sha256)
* expiration date (user defined, max 30 days)
* permissions(user defined)
* name (user defined)
* all keys will be in the format ```${id}.${key}```
## one time key attributes
* every attribute above with these changes
* the id will only be 3 chars long 
* the key will only be 10 chars long
* max expiration date will be 7 days
* once used, the expiration date will change to the current date, effectively disabling the key and logging the time.
* all otk's will be read only, and will have limited access.
## example key storage
### user side
example key ```kU84b.kzvZKm545VQUaT3FnLTVFt5TrcMbtM```<br>
example one time key ```s3A.Pa37f93WaH```
### server side
```json
{
  "name":"read and write repo access",
  "id":"kU84b",
  "perms":["repo.read","repo.write"],
  "expiration":"2021-07-08T01:32:13.543Z",
  "keyHash":"fea0ea5407b40b62e113e5088d1f07994b550b67d89280c29af9d6cab4a52a0c"
},
{
  "name":"otk repo",
  "id":"s3A",
  "perms":["otk"],
  "expiration":"2021-09-08T01:32:13.543Z",
  "keyHash":"76a5baad9d54bad7d4f8fd63594df2a78dbb5d7cfe9dd945dfbdea2f73b9c1f2"
}
```
