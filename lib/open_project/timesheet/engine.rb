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
        caption: "Timesheet"
    end
    initializer "timesheet.register_hooks" do
      require "open_project/timesheet/hooks"
    end
    assets %w(timesheet/js/app.js timesheet/js/chunk-vendors.js timesheet/css/app.css timesheet/css/chunk-vendors.css)
  end
end
