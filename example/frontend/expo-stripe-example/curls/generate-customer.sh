curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
	"description": "Test Customer MODIFYME", 
	"email": "MODIFYME@yopmail.com", 
	"metadata": {
		"key1": "value1",
		"key2": "value2"
	},
	"name": "MODIFYME",, 
	"phone": "MODIFYME",", 
	"address": {
		"city": "MODIFYME",
		"country": "MODIFYME",
		"line1": "MODIFYME",
		"line2": "MODIFYME",
		"postal_code": "MODIFYME",
		"state": "MODIFYME"
	}' \
	https://development.eseme.one:$TAMED_STRIPE_PORT'


