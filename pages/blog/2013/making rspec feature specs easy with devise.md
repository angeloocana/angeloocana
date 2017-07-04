---
date: 2013-01-16 12:22
title: Faster feature specs with authentication
sub: Make specs more efficient to write and execute
path: /2013/01/making-rspec-feature-specs-easy-with-devise/
comments: true
categories:
- programming
- testing
- ruby
tags: 
- rspec
- integration-tests
- devise
- rails
- capybara
---

I love writing feature specs with Rspec and Capybara.
In fact, I prefer this way over using cucumber. The process is cleaner and faster for me and works well for the actual project I'm working on.

Most of the features of the RoR app I'm working on require authentification, so normally that implies that, for each feature spec, I have to make capybara execute all the authentication steps.

But this repetition can become inconvenient, because it slows down the tests, while authentication is already covered by its own integration tests.

Is there a faster, lighter way to make this authentication happen ?

After some search, I discovered that Devise doesn't provide authentication helpers for integration/feature specs, which is justified as it contradicts the idea of full-stack testing.

But warden, on which Devise is based, provides this functionality.

### Here we go with an example

Beware: when you use this technique, you don't write full integration tests anymore in favor of taking a shortcut.
A useful one IMHO as long as you know what you do.

This means you already should have authentication well tested, with its complete set of integration tests.

#### A barebones example

<!-- {% codeblock file: %} -->

``` ruby 
# file: spec/features/admin_users_datatable.rb 

require 'spec_helper'

# including some warden magic:
include Warden::Test::Helpers             

# telling warden we are testing stuff:
Warden.test_mode!                         

feature "(...)" do
  context "(...)" do
    before(:each) do
      admin = FactoryGirl.create(:admin)

      # our instant magic authentication:
      login_as(admin , :scope => :user)   
    end

    scenario "(...)", js: true do
      visit admin_users_path
      # (...)
    end
  end
end
```

#### A working example, with some more flesh around bones

```ruby
# file: spec/features/admin_users_datatable.rb

require 'spec_helper'
include Warden::Test::Helpers
Warden.test_mode!

feature "admin searching for a specific user" do
  context "when logged in as admin" do
    before(:each) do
      admin = FactoryGirl.create(:admin)
      login_as(admin , :scope => :user)
      user1 = FactoryGirl.create(:user, email: 'foo@foo.com')
      user2 = FactoryGirl.create(:user, email: 'bar@bar.com')
    end

    scenario "admin searches for a specific user", js: true do
      visit manage_users_path
      page.body.should     have_content 'foo@foo.com'
      page.body.should     have_content 'bar@bar.com'
      fill_in 'Search', with: 'foo'
      page.body.should     have_content 'foo@foo.com'
      page.body.should_not have_content 'bar@bar.com'
    end
  end
end
```

#### More info

- [The classic but slower, full-stack way to do this](http://robots.thoughtbot.com/post/33771089985/rspec-integration-tests-with-capybara)
- [General documentation for Rspec feature specs](https://www.relishapp.com/rspec/rspec-rails/docs/feature-specs/feature-spec)



