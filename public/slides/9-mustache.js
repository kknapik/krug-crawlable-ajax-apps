$(window).bind('hashchange', function() {
  knapo.checkHashPart();
});

knapo = {
  /*
   * ...
   */
  loadPage: function(uri){
    var data     = this.getJson(uri);
    var template = this.getHtml(data.template);
    var html     = $.mustache(template, data);
    $('#content').html(html);
  }
}