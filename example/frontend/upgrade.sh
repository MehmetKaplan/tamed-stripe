old_version=`grep tamed-stripe-frontend package.json`
yarn remove tamed-stripe-frontend 
yarn add tamed-stripe-frontend
new_version=`grep tamed-stripe-frontend package.json`


# echo old and new versions with yellow color
echo -e "old version: \033[1;33m$old_version\033[0m"
echo -e "new version: \033[1;33m$new_version\033[0m"

