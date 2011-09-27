function NoopController() {
}

function SlidesController($route, $location, $xhr) {
  this.$location = $location;

  this.presentation = {
    title: "Crawlable AJAX Applications",
    author: "Krzysztof Knapik"
  };

  function center(title, subtitle) {
    return {
      layout: 'center',
      title: title,
      subtitle: subtitle,
      load: angular.noop
    };
  }

  function slide(title, subtitle, contentSrc) {
    var thisSlide = {
      layout: 'slide',
      title: title,
      subtitle: subtitle,
      content: '',
      load: function() {
        $xhr('GET', '/slides/'+contentSrc, function(code, response) {
          if(contentSrc.match(/\.md$/)) {
            thisSlide.content = new Showdown.converter().makeHtml(response);
          } else {
            thisSlide.content = response;
          }
        });
      }
    };

    return thisSlide;
  }

  function snippet(title, subtitle, source) {
    var thisSlide = {
      layout: 'snippet',
      title: title,
      subtitle: subtitle,
      code: '',
      mode: '',
      load: function() {
        $xhr('GET', '/slides/'+source, function(code, response) {
          if(source.match(/\.js$/)) {
            thisSlide.mode = 'text/javascript';
          } else if(source.match(/\.rb$/)) {
            thisSlide.mode = 'text/x-ruby';
          } else {
            thisSlide.mode = 'text/html';
          }
          thisSlide.code = response;
        });
      }
    };

    return thisSlide;
  }

  this.slides = [
    center(this.presentation.title, this.presentation.author),

    slide('Agenda', '', '0-agenda.md'),
    slide('User vs. crawler', 'What they like?', '1-user-vs-crawler.md'),
    slide('(almost) Preety URLs', '', '2-preety-urls.html'),
    slide('How crawlers see and index our ajax pages?', '', '3-how-crawler.html'),
    slide('Crawler friendly ajax URLs', '', '4-ugly-urls.html'),
    slide('Ommiting hash part', '', '5-ommit-hash.html'),
    snippet('Rails & crawler', '', '6a-rails-crawler.rb'),
    snippet('Rack & crawler', '', '6b-rack-crawler.rb'),
    slide('HTML snapshots', 'Headless browsers FTW', '7-html-snapshots.html'),
    snippet('Shared templates', 'mustache (js & ruby)', '9-mustache.html'),
    snippet('Shared templates', 'mustache in ruby', '9-mustache.rb'),
    snippet('Shared templates', 'mustache in js', '9-mustache.js'),
    center("Questions?"),
    slide('', '', 'thank-you.html'),
  ];

  $route.parent(this);
  $route.when('/slide/:slideIdx', {template: '/views/main.html'});
  $route.otherwise({redirectTo: '/slide/0'});

  var self = this;
  $route.onChange(function() {
    self.currentSlideIdx = parseInt($route.current.params.slideIdx, 10);
  });

  this.$watch('currentSlideIdx', function() {
    self.currentSlide = self.slides[self.currentSlideIdx || 0] || {};
    (self.currentSlide.load || angular.noop)();
  });
}
SlidesController.$inject = ['$route', '$location', '$xhr.cache'];

SlidesController.prototype = {
  template: function() {
    return '/views/'+this.currentSlide.layout+'.html';
  },
  updateLocation: function() {
    this.$location.update({hash: '/slide/' + this.currentSlideIdx.toString()});
  },
  nextSlide: function() {
    this.currentSlideIdx++;
    if(this.currentSlideIdx >= this.slides.length) {
      this.currentSlideIdx = this.slides.length - 1;
    }
    this.updateLocation();
  },
  previousSlide: function() {
    this.currentSlideIdx--;
    if(this.currentSlideIdx < 0) {
      this.currentSlideIdx = 0;
    }
    this.updateLocation();
  }
};

function onKeyDown(keyCode) {
  return function(expression, element) {
    return function(element) {
      var scope = this;

      element.keydown(function(e) {
        if(e.keyCode === keyCode) {
          scope.$eval(expression);
          scope.$eval();
        }
        e.stopPropagation();
      });
    };
  };
}

angular.directive('my:left', onKeyDown(37));
angular.directive('my:right', onKeyDown(39));

function TabsController() {
  this.activeTab = 'demo';
}

TabsController.prototype = {
  activeClass: function(tab) {
    if(this.isActive(tab)) {
      return 'active';
    }
  },
  isActive: function(tab) {
    return this.activeTab === tab;
  },
  setActive: function(tab) {
    this.activeTab = tab;
  }
};

angular.widget('@my:html', function(expression, element) {
  var compiler = this;

  if (element[0]['ng:compiled']) {
    compiler.descend(true);
    compiler.directives(true);

    return angular.noop;
  } else {
    element[0]['ng:compiled'] = true;
    return function(element) {
      var scope = this;
      this.$watch(expression, function() {
        var html = scope.$eval(expression);
        element.html(html);
        compiler.compile(element)(scope);
      });
    };
  }
});

angular.widget('@my:script', function(expression, element) {
  return function(element) {
    var scope = this;
    this.$watch(expression, function() {
      var js = scope.$eval(expression);
      element.append('<script type="text/javascript">'+js+'</script>');
    });
  };
});

angular.directive('my:code-editor', function(mode, element) {
  var name = element.attr('name');

  return function(element) {
    var scope = this;

    var options = {
      lineNumbers: true,
      onChange: function(editor) {
        scope.$set(name, editor.getValue());
        scope.$eval();
      }
    };

    if(mode === 'js') {
      options.mode = "text/javascript";
      options.matchBrackets = true;
    } else if (mode === 'html') {
      options.mode = "text/html";
      options.tabMode = "indent";
    }

    var editor = CodeMirror.fromTextArea(element[0], options);

    scope.$watch(name, function() {
      var value = scope.$eval(name);
      if(editor.getValue() !== value) {
        editor.setValue(value);
        editor.refresh();
      }
    });
  };
});

angular.widget('my:snippet', function(element) {
  var name = element.attr('name');
  var modeExpr = element.attr('mode');

  this.descend(false);
  this.directives(true);

  var pre = $('<pre class="cm-s-default"></pre>');
  element.append(pre);

  element.addClass('snippet');

  return function(element) {
    var scope = this;

    scope.$watch(name, function() {
      pre.html('');
      var value = scope.$eval(name);
      var mode = scope.$eval(modeExpr);
      CodeMirror.runMode(value, mode, pre[0]);
    });
  };
});
