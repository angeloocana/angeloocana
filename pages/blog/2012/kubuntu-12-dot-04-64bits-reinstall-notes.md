---
title: kubuntu 12.04 Precise 64bits reinstall notes 
sub: On my Dell XPS m1530
path: /2012/08/kubuntu-12-dot-04-64bits-reinstall-notes/
date: 2012-08-02 14:21
categories: 
- Linux
---

When it comes to the usage of my computer, I have a precise set of requirements, combining the needs of web/ruby programming with the graphic/web design and digital painting.

I've used Gnome 2, then fought Unity (and lost the figh), and experimented with Gnome 3. but finally moved to KDE after reading [this article](http://www.davidrevoy.com/?article110/kubuntu-11-10-for-digital-painting) from David Revoy.

KDE proved to be the only desktop environment I've tried so far which was able to meet all my requirements out of the box, or with relatively simple customization. It's flexibility and no-nonsense makes it the most friendly and productive environment I've used so far. I have the feeling that KDE evolution was made without forgetting the priorities, and while I'm not convinced by some of its newest features (activities, nepomunk, ...), they are easy to disable or ignore, and don't interfere in my workflow at all.


I was very happy with my Mint 12 KDE (which is a derivative from Ubuntu 11), but I was not able to install Skype and Gimp 2.8 because of some dependencies problems.

Having to work for distant clients and not having Skype on my toolbelt was becoming a problem. This consideration, with the LTS status (long term support) of the latest Ubuntu were good enough reasons to move.

So I decided to try Kubuntu 12.04, after backing up my home directory to another partition. Then after having experimented with it during a few hours, I decided to make a new fresh reinstall with just what I need.

## My requirements

### Mandatory

- Having multiple ruby versions, using RVM
- A good advanced text editor for programming: Kate, which is the KDE default is perfect (better than Gedit IMHO).
- Decent dual screen support with different resolutions (Gnome3/Unity is depressing)
- Wacom tablet support
- Current graphic drivers for my nvidia graphics
- Dropbox
- A customizable desktop theme to make it gentle for my eyes
- Gimp, Skype, LibreOffice, Inkscape, Firefox, Chromium, Krita, Mypaint: latest stable versions
- Decent accelerated graphic drivers

### Desired

- A fast way do disable window compositing instantly (desktop effects)
- A control panel for my Wacom tablet so I can map it easily to my second monitor
- Gimp: version 2.8 with its solo window interface
- Current graphic drivers for my nvidia graphic card, with 3D support
- Bluetooth support for my headset with AD2P (high quality sound)
- A way to have customizable shortcuts & toolbars so I can quick launch anything
- A Gmail icon in my taskbar, with the unread meassages count

## 1. Installing Kubuntu 12.04

### 1.1. Creating the bootable usb stick

After having downloaded the [Kubuntu 12.04 iso image](http://www.kubuntu.org/getkubuntu/download#download-block), I used the "Startup disk creator" utility under Kubuntu to create a Kubuntu bootable usb stick.

(Or you can  use [Unetbootin](http://unetbootin.sourceforge.net/) to create the same usb stick, from any operating system)

### 1.2. Booting on the usb stick

- Reboot the PC, from usb
- Keymap: belgian
- Startup menu: "Try Kubuntu"

### 1.3. Kubuntu desktop, booted from USB

Now, the original system is untouched but we are already under a Kubuntu desktop living in RAM, which allows us to use the computer, browse the net and, and install Kubuntu on the Original system 

### 1.4. Installing Kubuntu on the original system

Click on the desktop icon "install Kubuntu 12.04 LTS"

#### My install options

- Language: english
- Prepare:
  - install third-party software: checked
  - download updates when installing: unchecked (I prefer to do this later)
  - unmount sda: yes
  - disk setup: manual
    - sda6 (40gb): ext4, format => mount point: "/"
    - sda5 ( 4gb): swap
    - Boot loader: /dev/sda
  - User info:
      - encrypt home folder: yes

Reboot the computer

## 2. Customizing Kubuntu to my needs

Kubuntu lives now on the system, installation was smooth, fast and easy.

### 2.1. RVM, ruby & rails

In a terminal (konsole):

    sudo apt-get install curl
    curl -L https://get.rvm.io | bash -s stable
    source ~/.rvm/scripts/rvm
    echo "source ~/.rvm/scripts/rvm" >> .bashrc
    rvm notes # read the notes
    rvm requirements # read the requirements !!

    # folowing the ínfos in "rvm requirements":
    sudo apt-get install build-essential openssl libreadline6 \
    libreadline6-dev curl git-core zlib1g zlib1g-dev libssl-dev \
    libyaml-dev libsqlite3-dev sqlite3 libxml2-dev libxslt-dev \
    autoconf libc6-dev ncurses-dev automake libtool bison subversion
    
    rvm install 1.9.3
    
    # wait a few minutes while rvm compiles ruby
    rvm use 1.9.3 --default
    gem install bundler --no-rdoc --no-ri
    gem install rails --no-rdoc --no-ri
    
    # testing if everything works with ruby and rails:
    irb # launch ruby interactive console => OK
    rails new test-app
    cd test-app
    rails c # error: Could not find a JavaScript runtime
    sudo apt-get install nodejs
    rails c # works !

### 2.2. Replace Amarok with Guayadeque, install Krita, Scribus, K4dirstat, ...

Using the "muon software center" (from the KDE menu):

* Remove: 
  * Amarok

* Install:
  * Guayadeque
  * Krita
  * Scribus
  * K4dirstat
  * Inkscape

### 2.3. Enable the media keys for Gayadeque

- Launch "Custom shortcuts" from menu
- Create new group called "Guayadeque", inside it, create new global shortcuts (edit>new>global shortcut > Command/URL)
      <br>
      <br>
      
      "Next":         dbus-send --print-reply --type=method_call --dest=org.mpris.guayadeque /Player org.freedesktop.MediaPlayer.Next
      "Prev":         dbus-send --print-reply --type=method_call --dest=org.mpris.guayadeque /Player org.freedesktop.MediaPlayer.Prev
      "Play/Pause":   dbus-send --print-reply --type=method_call --dest=org.mpris.guayadeque /Player org.freedesktop.MediaPlayer.Pause
      "Stop":         dbus-send --print-reply --type=method_call --dest=org.mpris.guayadeque /Player org.freedesktop.MediaPlayer.Stop

### 2.4. Gimp 2.8.

    sudo add-apt-repository ppa:otto-kesselgulasch/gimp
    sudo apt-get update && sudo apt-get install gimp
  
HUH ? Seems like Gimp 2.6 was installed instead of 2.8.
  
Trying again:

    sudo apt-get purge gimp
    sudo add-apt-repository ppa:otto-kesselgulasch/gimp  
    sudo apt-get update && sudo apt-get install gimp
    
Gimp 2.8 was installed successfully this time.
  
### 2.5. Firefox, Chromium

- Launch "Mozilla Firefox browser installer" from the kubuntu menu.
- Using the Muon software center, install "chromium-browser".

### 2.6. Dropbox

- Using the muon software center, install "dropbox"
- Launch Dropbox from the menu, ignore when it complains about the non standard location
- Configure with your credentials when asked

#### Dropbox integration with Dolphin

In Dolphin:

- "Settings" > "Configure Dolphin" > "Services" > "Download new services"
- Search: "dropbox"
- Select and instal "Dropbox ServiceMenu"

### 2.7. Current nvidia drivers

- Launch "Additional Drivers" from the KDE menu
- change nvidia driver version from 173 to version current-updates
- Reboot

### 2.8. Skype

- Download the (official Skype 4 for Linux)[http://www.skype.com/intl/fr/get-skype/on-your-computer/linux/].
- Choose version "ubuntu 10.04 64bits".
- Double-click on the downloaded file "skype-ubuntu_4.0.0.8-1_amd64.deb" to launch package installer.

### 2.9. Java

- From the KDE Software Center, find and install "OpenJDK Java 7 Runtime"

### 2.10. Wacom tablet

The drivers already work smoothly out of the box, but I want a conrol panel so I can map the tablet to my external monitor.
Under KDE, it's easy:

    sudo apt-get install kde-config-tablet
  
### 2.11. Various developer tools: s3cmd, gitk

  sudo apt-get install s3cmd gitk

### 2.12. Bluetooth

Despite my efforts, i couldn't make bluetooth work correctly with my headset.
  
Fortunately, blueman solves this
- Using the Software Center, find and install "blueman"

