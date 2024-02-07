from .embed import encode_text

def request_handler(path,data,method):
    """ Handles an http request. data is either the request body or query params for a GET request """

    if method == "GET":
        return encode_text([data['text'] if 'text' in data else ""])
    else:
        return encode_text(data)
