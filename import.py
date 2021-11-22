import requests

ifile = open('old.txt','r')

for line in ifile.readlines():
  data = line.split('\t')
  print(data[3])
  req = {'i':data[1],'k':data[2],'u':data[3]}
  x = requests.post('https://kikto.herokuapp.com/import', data = req)
  print(x.text)


  
