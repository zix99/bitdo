# BitDo

> NOTE: BitDo is still under development, and can't execute rules quite yet.  It can display and track your holding history to a local database.  Please wait a little bit longer until it can execute rules.

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
Configuration files can be either json or yaml.

Example:
```json
{
	"exchange" : ["gdax"]
}
```
OR
```yaml
exchange:
 - gdax
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

The `rules.conf` file contains the core auto-trading rules of your program. Rules can be JSON or yaml.

TODO: Add documentation of rules file.

Rules will automatically be reloaded if *bitdo* detects a change, without needing to restart *bitdo*.

It is important to note that the rules file also maintains the state of the execution, so the application
may overwrite it with an updated state from time to time.

For now, you can see an [rules.example.conf](rules.example.conf)

### Plugins

The plugins are also controlled via arguments or the `bitdo.conf` file.

There are a few available plugins that come with bitdo.  bitdo will look for plugins in its `plugins/` folder,
and also plugins installed globally with the name `bitdo-plugin-*`.

#### web

The `web` plugin will bind to a port and expose information about your trading system via the port.  See the
[readme for the web plugin](/plugins/web) for more information.

### Database

By default, *bitdo* uses a `sqlite3` database that it will create in the working directory.  This is a fine default,
but if you find it doesn't scale or would like to use a different database.  It uses [Sequelize](http://docs.sequelizejs.com/manual/installation/getting-started.html#setting-up-a-connection),
so any DB that it supports, will work fine.  Just change the database connection string in the configuration `db`, and
make sure to install whatever driver sequelize requires to connect to that db.

For example, if you wanted to use mysql:
```bash
npm install -g tedious //mysql driver
bitdo --db "mysql://localhost/bitdo"
```

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