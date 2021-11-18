from flask import render_template
from flask import request

import time
import flask
import logging
import sys
from flask import Flask
#from flask_sslify import SSLify

import os
import requests

from flask import send_from_directory
from flask import Response

import time
from werkzeug.exceptions import Unauthorized

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Table, Column, Float, Integer, String, DateTime, MetaData, ForeignKey, func

app = Flask(__name__,static_url_path='/static')
#sslify = SSLify(app)
app.logger.addHandler(logging.StreamHandler(sys.stdout))
app.logger.setLevel(logging.ERROR)

try:
  app.config['SQLALCHEMY_DATABASE_URI'] = os.environ['DATABASE_URL2']
except:
  app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///:memory:"
db = SQLAlchemy(app)

class Url(db.Model):
  id = db.Column(db.Integer, primary_key=True)

  u = db.Column(db.String(80)) # URL
  i = db.Column(db.String(80)) # id
  k = db.Column(db.String(80)) # key
  e = db.Column(db.String(80)) # email
  b = db.Column(db.String(80)) # bitcoin
  h = db.Column(db.Integer) # hits

  ctime = db.Column(DateTime, default=func.now())

@app.before_first_request
def setup():
  print("[+] running setup")
  try:
    db.create_all()
    print("[+] created db")
  except:
    print("[+] db already exists")


@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                          'favicon.ico',mimetype='image/vnd.microsoft.icon')

@app.route('/', methods=("GET", "POST", "OPTIONS"))
def index():
  return render_template('index.html')

@app.route('/new')
def new():

  for length in range(1,10):
    for attempt in range(1,5):
      newid = ''.join(random.choice(string.ascii_uppercase + string.ascii_lowercase + string.digits) for _ in range(length))
      if Url.query(exists().where(URL.i != newid)):
        url = URL()
        url.u = request.values['url']
        url.e = request.values['email']
        url.i = request.values['id']
        url.b = request.values['btc']
        db.session.add(interesting)
        db.session.commit() 
        return "YEY"

@app.route('/update')
def update():

  if request.values['key']:
    url = URL()
    url.u = request.values['url']
    url.e = request.values['email']
    url.i = request.values['id']
    url.b = request.values['btc']

  # redirect to editor

@app.route('/dump')
def dump():
  msg="<pre>\n"
  for thing in Interesting.query.order_by(Interesting.ctime.desc()).all():
    #print("[+++] OMG STUFF '"+str(thing.domain)+"'")
    msg+=thing.domain+"\n"
    msg+=thing.headers+"\n"
    msg+=thing.values+"\n\n"

  msg+="</pre>"
  return msg
