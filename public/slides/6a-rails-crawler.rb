class AjaxCrawler
  def matches?(request)
    request.params[:_escaped_fragment_].present?
  end
end

match "/photos", :to => "photos#html_snapshot", :constraints => AjaxCrawler.new