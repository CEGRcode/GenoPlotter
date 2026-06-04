#!/bin/bash

set -e

if [[ ! -n $1 ]] ; then
    echo 'Usage: setup-ubuntu.sh <bigwig_list_file> <normalization_factors_file (optional)>'
    exit 0
fi

GENOPLOTTER_DIR=$(dirname $(dirname $(realpath $0)))

sudo apt-get install -y nginx
sudo cp ${GENOPLOTTER_DIR}/nginx/nginx.conf /etc/nginx/
sudo sh -c "eval \"cat <<EOF
$(<${GENOPLOTTER_DIR}/nginx/GenoPlotter)
EOF
\" > /etc/nginx/sites-available/GenoPlotter"
[ -f /etc/nginx/sites-enabled/default ] && sudo rm /etc/nginx/sites-enabled/default
[ -f /etc/nginx/sites-available/GenoPlotter ] || sudo ln -s /etc/nginx/sites-available/GenoPlotter /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Download and install nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash
# in lieu of restarting the shell
\. "$HOME/.nvm/nvm.sh"
# Download and install Node.js:
nvm install 24

npm install --prefix ${GENOPLOTTER_DIR}/js/api express@5.2.1 cors@2.8.6 @gmod/bbi@9.2.0
npm pkg set --prefix ${GENOPLOTTER_DIR}/js/api type="module"

eval "cat <<EOF
$(<${GENOPLOTTER_DIR}/js/api/server_template.js)
EOF
" > ${GENOPLOTTER_DIR}/js/api/server.js

mv ${GENOPLOTTER_DIR}/server.html ${GENOPLOTTER_DIR}/index.html