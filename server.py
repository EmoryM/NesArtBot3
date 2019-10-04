import http.server
from http.server import HTTPServer, BaseHTTPRequestHandler
import socketserver
try:
    from BeautifulSoup import BeautifulSoup
except ImportError:
    from bs4 import BeautifulSoup
from requests import Session
from io import BytesIO
import json
from http.server import SimpleHTTPRequestHandler, HTTPServer
import os.path
import time
from datetime import datetime

with open("pid.json", "w") as outfile:
    json.dump(os.getpid(), outfile)

def GetAuth():
    try:
        print("HITTING THEIR WEB SERVER")
        session = Session()
        url = "http://ustvgo.net/cnn-live-streaming-free/"
        response = session.get(url)
        #bs = BeautifulSoup(response.content, "html.parser")
        start = response.text.find("wmsAuthSign=")
        end = response.text.find("'", start)
        wms = response.text[start+12:end]
        print(wms)
        return wms
    except:
        return ""

# HTTPRequestHandler class
#class testHTTPServer_RequestHandler(BaseHTTPRequestHandler):
    # GET
    # def do_GET(self):
    #     print(self.path)
    #
    #     # Send response status code
    #     self.send_response(200)
    #
    #     # Send headers
    #     self.send_header('Content-type', 'text/html')
    #     self.end_headers()
    #
    #     # Send message back to client
    #     message = "Hello world!"
    #     # Write content as utf-8 data
    #     self.wfile.write(bytes(message, "utf8"))
    #     return
class Eyy(SimpleHTTPRequestHandler):
    def do_GET(self):
        if "favicon.ico" in self.path:
            return

        return super().do_GET()

def run():
    print('starting server...')

    # Server settings
    # Choose port 8080, for port 80, which is normally used for a http server, you need root access
    server_address = ('', 8000)
    httpd = HTTPServer(server_address, Eyy)
    print('running server...')
    httpd.serve_forever()


run()