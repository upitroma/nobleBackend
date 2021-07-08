# nodeApiTesting
a place for me to mess around with bad api ideas
## api key attributes
* id (rng)
* key (rng)(30 chars a-z,A-Z,0-9, no look alike chars)(stored as sha256)
* expiration date (user defined, max 30 days)
* permissions(user defined)
* name (user defined)
## example key storage
### user side
all keys will be in the format ```${id}.${key}```<br>
```kU84b.kzvZKm545VQUaT3FnLTVFt5TrcMbtM```
### server side
```json
{
  "name":"read and write repo access",
  "id":"kU84b",
  "perms":["repo.read","repo.write"],
  "expiration":"2021-07-08T01:32:13.543Z",
  "keyHash":"fea0ea5407b40b62e113e5088d1f07994b550b67d89280c29af9d6cab4a52a0c"
}
```
