from dataclasses import dataclass
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from typing import Any, Callable
import urllib.parse

@dataclass
class RestHandlerOptions:
    disableHealthCheckSupport:bool=False
    heathCheckPath:str='/health-check'

def create_rest_handler(
    request_handler:Callable[[str,Any,str],Any],
    *,
    options:RestHandlerOptions=RestHandlerOptions()
):
    class RestHandler(BaseHTTPRequestHandler):

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


            parsed=urllib.parse.urlparse(self.path)
            path=parsed.path
            query=urllib.parse.parse_qs(parsed.query)
            for key in query:
                query[key]=query[key][0]

            if  method=="GET" \
                and not options.disableHealthCheckSupport \
                and path.endswith(options.heathCheckPath):

                self.send_json_result({
                    "healthy":True
                })
                return

            print(method+" "+self.path)

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

    return RestHandler


def start_rest_server(port:int, handler:Callable[[str,Any,str],Any], * , hostName:str='0.0.0.0'):
    handlerClass=create_rest_handler(handler)
    server=ThreadingHTTPServer((hostName,port),handlerClass)
    print("Server started http://%s:%s" % (hostName, port))

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass

    server.server_close()
    print("Server stopped.")
