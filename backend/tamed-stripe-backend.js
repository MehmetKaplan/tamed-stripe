const generateConnectedAccount = (props) => new Promise(async (resolve, reject) => {
	try {
		return resolve({
			result: 'OK',
			payload: undefined,
		});
	} catch (error) {
		return reject(error);
	}
});