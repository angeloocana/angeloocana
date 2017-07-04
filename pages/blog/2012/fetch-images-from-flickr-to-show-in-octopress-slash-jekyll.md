---
title: Fetch images from Flickr 
sub: And show them in Octopress/Jekyll
path: /2012/07/fetch-images-from-flickr-to-show-in-octopress-slash-jekyll/
date: 2012-07-21 17:53
categories:
- programming
- ruby
tags:
- flickr
- ruby
- api
- octopress
- jekyll
---

A convenient way to manage images for a blog is to host them on Flickr.

Using the Flickr API, it's possible to do lots of useful things: use Flickr to serve thumbnails, fetch the metadata associated with the image, organise your galleries by tags then show them on your blog, ...

Here is a very simple example.

## The flickraw gem

Flickraw is a very convenient gem for accessing the flickr API, making it super-easy.

Add it to your gemfile:

``` ruby
# Gemfile
gem 'flickraw'
```

<small>(And don't forget to run `bundle install`)</small>

## The FlickrImage plugin

**Note:** you have to define "FLICKR_KEY" and "FLICKR_SECRET" as environment variables for this script to work. <br /><small>(You can find your flickr key and secret in your Flickr interface, after having registered your app.)</small>

Put this file in the 'plugins' directory:

``` ruby
# flickr_image.rb
require 'flickraw'
class FlickrImage < Liquid::Tag

  def initialize(tag_name, markup, tokens)
     super
     @markup = markup
     @id   = markup.split(' ')[0]
     @size = markup.split(' ')[1]
  end

  def render(context)

    FlickRaw.api_key        = ENV["FLICKR_KEY"]
    FlickRaw.shared_secret  = ENV["FLICKR_SECRET"]

    info = flickr.photos.getInfo(:photo_id => @id)

    server        = info['server']
    farm          = info['farm']
    id            = info['id']
    secret        = info['secret']
    title         = info['title']
    description   = info['description']
    size          = "_#{@size}" if @size
    src           = "http://farm#{farm}.static.flickr.com/#{server}/#{id}_#{secret}#{size}.jpg"
    page_url      = info['urls'][0]["_content"]

    img_tag       = "<img src='#{src}' title='#{title}'/>"
    link_tag      = "<a href='#{page_url}'>#{img_tag}</a>"

  end
end

Liquid::Template.register_tag('flickr_image', FlickrImage)
```

## Usage in a post

``` markdown
---
layout: post
title: "Post with images from Flickr"
date: 2012-07-19 15:19
comments: true
categories: art
---

A big image:

{% flickr_image 6829790399 b %}

A medium-sized image:

{% flickr_image 7614906062 m %}

The same image, as a small square thumbnail:

{% flickr_image 7614906062 sq %}
```

Done !
