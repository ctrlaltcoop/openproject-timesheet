# Prevent load-order problems in case openproject-plugins is listed after a plugin in the Gemfile
# or not at all
require "open_project/plugins"

module OpenProject::Timesheet
  class Engine < ::Rails::Engine
    engine_name :openproject_timesheet

    include OpenProject::Plugins::ActsAsOpEngine

    register(
      "openproject-timesheet",
      :author_url => "https://openproject.org",
      :requires_openproject => ">= 8.2.0",
    ) do
      menu :top_menu,
        :timesheet,
        {controller: "/timesheet", action: "index"},
        caption: "Timesheet",
        if: Proc.new {
          (User.current.logged? || !Setting.login_required?) &&
            (User.current.allowed_to?(:view_own_time_entries, nil, global: true))
        }
    end
    initializer "timesheet.register_hooks" do
      require "open_project/timesheet/hooks"
    end
    assets %w(timesheet/js/app.js timesheet/css/app.css)
  end
end
