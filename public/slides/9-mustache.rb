respond_to do |format|
  # json for ajax
  format.json{
    render :json => response_data
  }
  # crawler (html snapshot)
  format.html{
    template_path = File.join(Rails.root, 'public', response_data[:template] + '.html')
    template      = File.read(template_path)
    render :text => Mustache.render(template, response_data), :layout => true
  }
end