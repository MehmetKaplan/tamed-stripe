module.exports = {
	"apiBackendMachine": "development.eseme.one",
	"apiBackendPort": process.env.TAMED_STRIPE_PORT,
	"apiBackend": () => `https://${apiBackendMachine}:${apiBackendPort}`,
	"routes": {
		"generateCustomerRoute": "/generate-customer",
	}
};

