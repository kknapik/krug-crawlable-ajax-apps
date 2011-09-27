module Rack
  class AjaxCrawler

    def initialize(app)
      @app = app
    end

    def call(env)
      if env['REQUEST_URI'].include?('_escaped_fragment_=')
        uri = env['REQUEST_URI'].sub('_escaped_fragment_=', '#!')
        serve_html_snapshot(URI.unescape(uri))
      else
        @app.call(env)
      end
    end

  end
end