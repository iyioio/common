from http.server import BaseHTTPRequestHandler, HTTPServer
import json
from src import request_handler
import urllib.parse

hostName = "0.0.0.0"
serverPort = 8080

class MyServer(BaseHTTPRequestHandler):

    def send_json_result(self,result):
        self.send_response(200)
        self.send_header("Content-type", "application/json")
        self.send_cors_headers()
        self.end_headers()
        self.wfile.write(bytes(json.dumps(result), "utf-8"))

    def send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Access-Control-Allow-Methods", "OPTIONS,GET,PUT,POST,DELETE,PATCH,HEAD")
        self.send_header("Access-Control-Max-Age", "86400")
        self.send_header("Access-Control-Allow-Credentials", "true")

    def handle_body_request(self,method):
        print(method+" "+self.path)

        parsed=urllib.parse.urlparse(self.path)
        path=parsed.path

        content_len = int(self.headers.get('Content-Length'))
        post_body = json.loads(self.rfile.read(content_len))
        print(post_body)
        result = request_handler(path,post_body,"POST")

        self.send_json_result(result)

    def handle_no_body_request(self,method):

        print(method+" "+self.path)

        parsed=urllib.parse.urlparse(self.path)
        path=parsed.path
        query=urllib.parse.parse_qs(parsed.query)
        for key in query:
            query[key]=query[key][0]
        print(query)


        result = request_handler(path,query,"GET")

        self.send_json_result(result)

    def do_GET(self):
        self.handle_no_body_request("GET")

    def do_DELETE(self):
        self.handle_no_body_request("DELETE")

    def do_POST(self):
        self.handle_body_request("POST")

    def do_PUT(self):
        self.handle_body_request("PUT")

    def do_PATCH(self):
        self.handle_body_request("PATCH")



webServer = HTTPServer((hostName, serverPort), MyServer)
print("Server started http://%s:%s" % (hostName, serverPort))

try:
    webServer.serve_forever()
except KeyboardInterrupt:
    pass

webServer.server_close()
print("Server stopped.")
