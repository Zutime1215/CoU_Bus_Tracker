const express = require("express");
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());

app.use(express.static('public'));
// Configuring body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const port = process.env.port || 8080;

const not_found = {
	'lat': -1,
	'lon': -1
};

let location_data = {
	'1': {
		'lat': 23.418516,
		'lon': 91.134237,
		'last_updated_at': 0
	},
	'2': {
		'lat': 2,
		'lon': 2,
		'last_updated_at': 0
	},
	'3': {
		'lat': 3,
		'lon': 3,
		'last_updated_at': 0
	}
};

app.get('/locations/:id', (req, res) => {
	const { id } = req.params;
  	res.json(location_data[id] || not_found);
});

app.patch('/locations/:id/:lat/:lon', (req, res) => {
	const { id, lat, lon } = req.params;

	if (!location_data[id]) {
		res.status(400).send('Invalid request id.');
		return;
	}

	if (lat < 0 || lon < 0) {
		res.status(400).send('Invalid lat or lon data.');
		return;
	}

	updated_location = {
		'lat': lat,
		'lon': lon,
		'last_updated_at': Date.now()
	}

	location_data[id] = updated_location;
  	res.json(updated_location);
});

app.get('/locations', (req, res) => {
  	res.json(location_data);
});

app.post('/locations/save', (req, res) => {
	fs.writeFile(`./log/${Date.now()}.txt`, JSON.stringify(location_data), err => {
		if (err) {
			res.send('file written failed');}
		else {
	  		res.send('saved');  
	  	}
	});
});

app.listen(port, () => {
  	console.log(`Example app listening on port ${port}`);
});

/**
 * 
 * curl -X PATCH {base_url}/location/:id/:lat/:lon
 * 
 */