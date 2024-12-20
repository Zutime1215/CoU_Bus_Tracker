import requests
from time import sleep
import string
import random

s = ''.join(random.choices(string.ascii_letters, k=20))
i = 1
while True:
    res = requests.get("http://localhost:8080/updatePost/"+s+str(i)).text
    print(res, i)
    i+=1
    sleep(120)