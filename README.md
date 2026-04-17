# GenoPlotter

### Server setup
The remote version of GenoPlotter requires a table of BIGWIG files formatted as a tab-separated table:
```
name	forward	reverse
sample1	/path/to/sample1.forward.bigwig	/path/to/sample1.reverse.bigwig
...
```
BIGWIG files can be absolute paths or http(s) URLs.

You can optionally include a table of normalization factors also formatted as a tab-separated table:
```
name	method1	method2	...
sample1	1.23	4.56	...
...
```
#### Ubuntu
On your remote server:
1. Clone this repository with `git clone https://github.com/CEGRcode/GenoPlotter.git`
2. Run setup script (make sure you have sudo priveleges) `GenoPlotter/server_setup_scripts/setup-ubuntu.sh /path/to/bigwig_table.txt /path/to/normalization_factors.txt`

### Running the server
1. Open up a background shell with `tmux new -s GenoPlotter`
2. Run the server with `node GenoPlotter/js/api/server.js`

Then your GenoPlotter instance can be accessed by entering the remote server's IP address into an internet browser.

To stop the server, enter the background shell with `tmux a -t GenoPlotter` and interrupt the server with `Ctrl+C`.