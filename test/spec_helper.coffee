FRAMEWORK = (window.__env__['FRAMEWORK'] || 'angular').toLowerCase()

afterEach ->
  HTTPong.private.schemes = {}

HttpBackend = null

do ->
  switch FRAMEWORK
    when 'angular'
      $httpBackend = null
      $http = null

      beforeEach inject ($injector) ->
        $httpBackend = $injector.get('$httpBackend')
        $http = $injector.get('$http')
        HTTPong.setHttpFunction($http, 'angular')

      afterEach ->
        $httpBackend.verifyNoOutstandingExpectation()
        $httpBackend.verifyNoOutstandingRequest()

      class HttpBackend
        reply: (method, url, data, status = 200, fn) ->
          $httpBackend.expect(method, url).respond (_method, _url, _data, _headers, _params) ->
            fn(JSON.parse(_data)) if fn
            response_data = JSON.stringify(data) if status isnt 204
            response_headers = if status isnt 204 then {'Content-Type': 'application/json'} else {}
            [status, response_data, response_headers]

        expect: (method, url, data, status = 200, fn) ->
          $httpBackend.expect(method, url).respond (_method, _url, _data, _headers, _params) ->
            fn(JSON.parse(_data)) if fn
            response_data = JSON.stringify(data) if status isnt 204
            response_headers = if status isnt 204 then {'Content-Type': 'application/json'} else {}
            [status, response_data, response_headers]

        flush: -> $httpBackend.flush()
        done: (fn) -> setTimeout(fn)

    when 'jquery'
      # $.mockjax( (opts) -> # if a request comes in that doesn't match a reply mock
      #   throw new Error("HttpBackend: jQuery: #{opts.url} isn't mocked")
      # )

      afterEach ->
        # $.mockjax.clear()

      class HttpBackend
        reply: (method, url, data, status = 200, fn) ->
          HTTPong.setHttpFunction(window.jQuery.ajax, 'jquery')
          json = JSON.stringify(data)
          console.log("Will respond to #{method} #{url} with #{json}")
          response_data = if status isnt 204 then json else ''
          response_headers = if status isnt 204 then {'Content-Type': 'application/json'} else {}
          $.mockjax({
            url: url
            dataType: 'json'
            type: method
            status: status
            headers: response_headers
            responseText: response_data
            responseTime: 0
          })
        expect: -> @reply.apply(@, arguments)
        flush: (->)
        done: (fn) -> fn()

    when 'fetch'
      fetchMock._mock() # set window.fetch to mock
      HTTPong.setHttpFunction(fetch, 'fetch')

      afterEach ->
        fetchMock.restore()

      class HttpBackend
        reply: (method, url, data, status = 200, fn) ->
          fetchMock.mock matcher: url, method: method, response: (_url, _options) ->
            fn(JSON.parse(_options.body)) if fn
            response_data = JSON.stringify(data)
            response_headers = if status isnt 204 then {'Content-Type': 'application/json'} else {}
            return {body: response_data, status: status, headers: response_headers}
        expect: -> @reply.apply(@, arguments)
        flush: (->)
        done: (fn) -> fn()
