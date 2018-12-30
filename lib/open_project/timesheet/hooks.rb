module OpenProject::Timesheet
  class Hooks < Redmine::Hook::ViewListener
    render_on :view_layouts_base_html_head, inline: <<-VIEW
      <% content_for :header_tags do %>
        <%= stylesheet_link_tag 'timesheet/css/app', plugin: :openproject_timesheet %>
      <% end %>
    VIEW
  end
end
