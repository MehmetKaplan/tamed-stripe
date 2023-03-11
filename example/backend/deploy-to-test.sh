old_version=`grep tamed-stripe-backend package.json`
yarn remove tamed-stripe-backend 
yarn add tamed-stripe-backend 
remote-express-server-deployer.sh tamed-stripe-backend-example run-server.sh
new_version=`grep tamed-stripe-backend package.json`

# echo old and new versions with yellow color
echo -e "old version: \033[1;33m$old_version\033[0m"
echo -e "new version: \033[1;33m$new_version\033[0m"

