# co-crypto

Thunkified crypto module.

## Installation

```
$ npm install co-crypto --save
```

## Usage

```
var crypto = require('crypto');

var bytes = yield crypto.randomBytes(20);

var hash = crypto.createHash('md5').update('hello').digest('hex');
```

## License

Released under MIT license.