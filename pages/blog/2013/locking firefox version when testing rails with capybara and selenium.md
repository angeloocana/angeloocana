---
title: Locking to a specific Firefox release in specs
sub: when testing Rails with Capybara & Selenium
date: 2013-02-25 13:38
path: /2013/02/locking-the-firefox-version-when-testing-rails-with-capybara-and-selenium/
categories:
- programming
- testing
- ruby
tags: 
- rspec
- integration-tests
- capybara
- selenium
- rails
- cucumber
---

When Firefox was updated on my laptop a few days ago to version 19, suddenly my Cucumber tests using Selenium and Firefox stopped working, with error:

    unable to obtain stable firefox connection in 60 seconds 
    (127.0.0.1:7055) (Selenium::WebDriver::Error::WebDriverError)

When I investigated, I found that Capybara / Selenium didn't support this version yet.

The first thing I did was to downgrade Firefox to a previous version... But I don't like this idea.
In my opinion, the test suite should never depend on the same browser which is used by the user, it feels fragile and may break anytime again, when Firefox is upgraded.

So, the solution is relatively simple:

1) Download a previous Firefox version (I choosed the version 17, 64bits) here:<br />
[http://releases.mozilla.org/pub/mozilla.org/firefox/releases/17.0/linux-x86_64/en-GB/](http://releases.mozilla.org/pub/mozilla.org/firefox/releases/17.0/linux-x86_64/en-GB/)

2) Extract the archive, you should get a "firefox" folder containing the program and its binaries

3) Move the entire folder to your desired location.<br />
For example, on Ubuntu:

``` bash
$ sudo mv firefox /opt/firefox17
```

4) Now, in your env.rb file, add this:

```ruby
# features/support/env.rb
Capybara.register_driver :selenium do |app|
  require 'selenium/webdriver'
  Selenium::WebDriver::Firefox::Binary.path = "/opt/firefox17/firefox"
  Capybara::Selenium::Driver.new(app, :browser => :firefox)
end
```

I did a slightly improved version, so I can define the path to the binary as an environment variable.
If the environment variable is not present, then it simply falls back to the system's default Firefox:

```ruby
# features/support/env.rb
Capybara.register_driver :selenium do |app|
  require 'selenium/webdriver'
  Selenium::WebDriver::Firefox::Binary.path = ENV['FIREFOX_BINARY_PATH'] || Selenium::WebDriver::Firefox::Binary.path
  Capybara::Selenium::Driver.new(app, :browser => :firefox)
end
```

But don't forget to add this line to your .bashrc file for the above to work as expected:

```bash
# .bashrc
export FIREFOX_BINARY_PATH="/opt/firefox17/firefox"
```

Thanks for reading.<br />
Happy testing !








