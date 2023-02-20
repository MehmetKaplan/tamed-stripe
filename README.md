## Stripe registration

### Stripe related actions

1. Generate your account and get your publishable key and secret key from [here](https://dashboard.stripe.com/register).
2. Make sure you have correct icon, logo, business name, etc from https://dashboard.stripe.com/settings/connect
### Apple Pay

Add `merchantIdentifier` to `app.json` file. You can find it in your Apple Developer account. 

- For production, you should have an account in Apple's accepted banks listed [here](https://support.apple.com/en-us/HT204916).
- For testing purposes, you can use `merchant.com.example` as a placeholder. (As stated [here](https://stripe.com/docs/apple-pay?platform=react-native#testing-apple-pay) stripe will accept any value for the merchant identifier when testing.)

```javascript
{
  "expo": {
	 ...
	 "plugins": [
		[
		  "@stripe/stripe-react-native",
		  {
			 "merchantIdentifier": string | string []
		  }
		]
	 ],
  }
}
```

```javascript
{
  "expo": {
    ...
    "plugins": [
      [
        "@stripe/stripe-react-native",
        {
          "merchantIdentifier": string | string [],
          "enableGooglePay": boolean
        }
      ]
    ],
  }
}
```

### License

The license is MIT and full text [here](https://github.com/MehmetKaplan/tamed-stripe/blob/master/LICENSE).

#### Used Modules

* stripe license [here](./OtherLicenses/stripe.txt)
* fetch-lean license [here](./OtherLicenses/fetch-lean.txt)
* tamed-pg license [here](./OtherLicenses/tamed-pg.txt)
* tick-log license [here](./OtherLicenses/tick-log.txt)