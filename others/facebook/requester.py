import requests
from time import sleep, time
import string
import random

i = 1
for i in range(1, 81):
    x = ''.join(random.choices(string.ascii_letters, k=15))
    s = f"Current Location: [{x}]\nUpdated at: {time()}"
    

    print(s)
    res = requests.get("http://localhost:8080/updatePost/"+s+str(i)).text
    print(res, i)
    sleep(50)