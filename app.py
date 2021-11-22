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

import time, random, string
from werkzeug.exceptions import Unauthorized

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Table, Column, Float, Integer, String, DateTime, MetaData, ForeignKey, func
from sqlalchemy.sql import exists

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

  i = db.Column(db.String(20), unique=True) # id
  k = db.Column(db.String(20)) # key
  u = db.Column(db.String(800)) # URL
  e = db.Column(db.String(80)) # eth
  g = db.Column(db.String(80)) # google analytics
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

@app.route('/', methods=("GET",))
def index():
  return render_template('index.html')

@app.route('/new', methods=("POST",))
def new():

  for length in range(1,10):
    for attempt in range(1,5):
      print("OMGYAY")
      newid = ''.join(random.choice(string.ascii_uppercase + string.ascii_lowercase + string.digits) for _ in range(length))
      print(newid)
      print("OMGYAY2")
        #newid = ''.join(random.choice(string.ascii_uppercase + string.ascii_lowercase + string.digits) for _ in range(length))
      #if Url.query(exists().where(Url.i == newid)):
      if not db.session.query(Url.query.filter(Url.i == newid).exists()).scalar():
        key = ''.join(random.choice(string.ascii_uppercase + string.ascii_lowercase + string.digits) for _ in range(10))
        url = Url()
        url.u = request.form['u']
        url.i = newid
        url.k = key
        print(key)
        db.session.add(url)
        db.session.commit() 
        return render_template('success.html', newid = newid, key = key)

  return "nope"

@app.route('/import', methods=("POST",))
def import_data():
  try:
    url = Url()
    url.i = request.form['i']
    url.k = request.form['k']
    url.u = request.form['u']
    print(url.i)
    print(url.k)
    print(url.u)
    db.session.add(url)
    db.session.commit()
    return("yay")
  except Exception as e:
    print('whoops '+str(e))
    return('boo') 


@app.route('/update')
def update():

  if request.values['key']:
    url = Url()
    url.u = request.values['url']
    url.e = request.values['email']
    url.i = request.values['id']
    url.b = request.values['btc']

  # redirect to editor

@app.route('/dump')
def dump():
  msg="<pre>\n"
  for thing in Url.query.order_by(Url.ctime.desc()).all():
    #print("[+++] OMG STUFF '"+str(thing.domain)+"'")
    msg+=thing.i+", "
    msg+=thing.u+"\n"

  msg+="</pre>"
  return msg

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
  try:
    url = Url.query.filter(Url.i == path).one()
    return render_template('redirect.html',redirect = url.u, hits = url.h)
  except:
    return("nope")
