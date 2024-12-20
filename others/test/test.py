import json
import requests
import time

with open("locations.json", "r") as fl:
	data = json.loads(fl.read())

for i in range(len(data)):
	lat = data[i]['lat']
	lon = data[i]['lon']
	r = requests.patch(f'http://localhost:8080/locations/2/{lat}/{lon}').text
	print(r)
	time.sleep(1)