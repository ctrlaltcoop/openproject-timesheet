# encoding: UTF-8
$:.push File.expand_path("../lib", __FILE__)
$:.push File.expand_path("../../lib", __dir__)
require 'open_project/timesheet/version'

# Describe your gem and declare its dependencies:
Gem::Specification.new do |s|
  s.name        = "openproject-timesheet"
  s.version     = OpenProject::Timesheet::VERSION
  s.authors     = "control.alt.coop eG"
  s.email       = "kontakt@ctrl.alt.coop"
  s.homepage    = "https://community.openproject.org/projects/timesheet"
  s.summary     = 'OpenProject Timesheet'
  s.description = "A timesheet for openproject"
  s.license     = "MIT"

  s.files = Dir["{app,config,db,lib}/**/*"] + %w(CHANGELOG.md README.md)

  s.add_dependency "rails", "~> 5.0"
end
