# GenoPlotter

### Server setup
The remote version of GenoPlotter requires a table of BIGWIG files formatted as a tab-separated table:
```
name	forward	reverse
sample1	/path/to/sample1.forward.bigwig	/path/to/sample1.reverse.bigwig
...
```
BIGWIG files can be absolute paths or http URLs.

You can optionally include a table of normalization factors also formatted as a tab-separated table:
```
name	method1	method2	...
sample1	1.23	4.56	...
...
```
#### Ubuntu
On your remote server:
1. Clone this repository with `git clone https://github.com/CEGRcode/GenoPlotter.git`
2. Run setup script with admin priveleges with `sudo GenoPlotter/server_setup_scripts/setup-ubuntu.sh /path/to/bigwig_table.txt /path/to/normalization_factors.txt`