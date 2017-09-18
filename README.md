# BitDo

A cryptocurrency automated trader (not an intelligent trader!).

The intention of this is to provide a configurable platform for performing
automated trades at preset points.

## Installing

Make sure to use at least node 6.x. You can always find the version of node I'm using in the [.nvmrc](.nvmrc) file.

If you get an error about installing/loading the exchanges or plugins, make sure you're running an up-to-date version of `npm`. You
can update npm by running `npm update -g npm`.

```bash
npm install -g bitdo
```

### Configuration

There are a set of files and configurations you need in order to leverage bitdo fully.

Let's start first by setting up your exchanges.

#### bitdo.conf

This configuration file can be used in place of cli arguments. It is JSON, and holds anything
you don't want to type each time.  bitdo will look for `bitdo.conf` in the current directory.

Example:
```json
{
	"exchange" : ["gdax"]
}
```

#### Exchanges

There are a few exchanges built-in by default.

gdax API setup: (`.gdaxrc`)
```
passphrase=xxx
key=yyy
b64secret=zzz
```

bittrex API setup: (`.bittrexrc`)
```
apikey=aaa
apisecret=bbb
```

#### Rules File

The `rules.json` file contains the core auto-trading rules of your program.

TODO: Add documentation of rules file.

### Plugins

The plugins are also controlled via arguments or the `bitdo.conf` file.

There are a few available plugins that come with bitdo.  bitdo will look for plugins in its `plugins/` folder,
and also plugins installed globally with the name `bitdo-plugin-*`.

#### web

The `web` plugin will bind to a port and expose information about your trading system via the port.  See the
[readme for the web plugin](/plugins/web) for more information.

### Running

Once configuration is all set up, you can run simply by executing `bitdo`.

Keep in mind, it's probably good to run it in its own directory, as it will output log files
and its sqlite database in the current directory.

## Running Locally

Make sure to follow the above configuration to setup some exchanges to use with bitdo.  When in doubt,
you can use the `mock` exchange while developing to test with.

```bash
npm install
npm run dev
```

# License

Copyright (c) 2017 Christopher LaPointe

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.