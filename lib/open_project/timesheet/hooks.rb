module OpenProject::Timesheet
  class Hooks < Redmine::Hook::ViewListener
    render_on :view_layouts_base_html_head, inline: <<-VIEW
      <% content_for :header_tags do %>
        <%= stylesheet_link_tag 'timesheet/css/app', plugin: :openproject_timesheet %>
        <%= stylesheet_link_tag 'timesheet/css/chunk-vendors', plugin: :openproject_timesheet %>
      <% end %>
    VIEW
    render_on :view_layouts_base_body_bottom, inline: <<-VIEW
      <%= javascript_include_tag 'timesheet/js/chunk-vendors' %>
      <%= javascript_include_tag 'timesheet/js/app' %>
    VIEW
  end
end
