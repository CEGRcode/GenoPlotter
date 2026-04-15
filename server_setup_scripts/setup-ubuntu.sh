if [[ ! -n $1 ]] ; then
    echo 'Usage: setup-ubuntu.sh <bigwig_list_file> <normalization_factors_file (optional)>'
    exit 0
fi

apt-get install -y nginx=1.18.0
cp ../nginx/nginx.conf /etc/nginx/
eval "cat <<EOF
$(<../nginx/GenoPlotter)
EOF
" > /etc/nginx/sites-available/GenoPlotter
rm /etc/nginx/sites-enabled/default
ln -s /etc/nginx/sites-available/GenoPlotter /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Download and install nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash
# in lieu of restarting the shell
\. "$HOME/.nvm/nvm.sh"
# Download and install Node.js:
nvm install 24

npm install --prefix ../js/api express@5.2.1 cors@2.8.6 @gmod/bbi@8.1.1

eval "cat <<EOF
$(<../js/api/server_template.js)
EOF
" > ../js/api/server.js

mv ../server.html ../index.html