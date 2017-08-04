---
title: How to install Arch linux
date: '2017-07-30'
layout: post
draft: false
---

## Links
 - https://www.ostechnix.com/install-arch-linux-latest-version/

## Change keyboard to abnt2
```bash
    loadkeys br-abnt2
```

## Show particions
```
fdisk -l
```

## Create Partitions
```bash
    cfdisk
```

## Format Partitions
```bash
    mkfs.ext4 /dev/sda1
```

```bash
    mkfs.ext4 /dev/sda5
```

```bash
    mkswap /dev/sda2
```

```bash
    swapon /dev/sda2
```

## Install Arch

```bash
    mount /dev/sda1 /mnt
```

```bash
    mkdir /mnt/home
```

```bash
    mount /dev/sda5 /mnt/home
```

```bash
    pacstrap /mnt base base-devel
```

```bash
    genfstab /mnt >> /mnt/etc/fstab
```

```bash
    cat /mnt/etc/fstab
```

```bash
    arch-chroot /mnt /bin/bash
```

## Enable internet
Enable dhcpcd for system start up.
```bash
    systemctl enable dhcpcd
```
Set your hostname, replace **YOUR_HOSTNAME_HERE** with your new machine name, in my case **ocana-note**
```bash
    echo YOUR_HOSTNAME_HERE > /etc/hostname
```

## Set password
```bash
    passwd
```

## Enable 32bit packages
uncomment multilib line from:
```bash
    nano /etc/pacman.conf
```

## Sincronize  Repos
```bash
    pacman -Sy
```

## Create User
```bash
    useradd -m -g users -G wheel,storage,power -s /bin/bash angeloocana
```
```bash
    passwd angeloocana
```

# Install sudo
```bash
    pacman -S sudo
```
enable sudo for users, uncomment %wheel ALL=(ALL) ALL
```bash
    EDITOR=nano visudo
```

## Grub installation
```bash
    pacman -S grub os-prober
```
```bash
    grub-install /dev/sda
```
```bash
    grub-mkconfig -o /boot/grub/grub.cfg
```

## Exit
```bash
    exit
```
```bash
     umount /mnt/home
```
```bash
    umount /mnt
```
```bash
    poweroff
```
Remove the pendrive running the arch image and start your machine to continue the process.

## Install xfce4
```bash
    sudo pacman -Syu
```
```bash
    sudo pacman -S xorg xorg-server
```
```bash
    sudo pacman -S xfce4 xfce4-goodies
```

Run xfce!
```bash
    startxfce4
```

## Change keyboard to abnt2 permanently

Go to 'Applications' -> 'Settings' -> 'Settings Manager' -> 'Session and Startup' -> 'Application Autostart' then click 'Add' button and just paste the command in the "Command" field, give a name and here you go.
```bash
    setxkbmap -model abnt2 -layout br -variant abnt2
```

## Datetime
To check the current zone defined for the system:
```bash
    timedatectl
```

To list available zones:
```bash
    timedatectl list-timezones
```

To change your time zone:
```bash
    timedatectl set-timezone Zone/SubZone   
```

Synchronize date time, maybe you have to restart to see the changes:
```bash
    sudo hwclock --systohc --utc
```    

## Audio
```bash
    sudo pacman -S alsa-utils pulseaudio
```

# Programs
## Vim
```bash
    sudo pacman -S vim
```

## Yaourt
Yaourt contains the community packages.

For pacman always use sudo, for yaourt never!!!

Open the file below for editing:
```bash
    sudo vim /etc/pacman.conf
```
Add to the bottom:
```conf
    [archlinuxfr]
    SigLevel = Never
    Server = http://repo.archlinux.fr/$arch
```

Install yaourt
```bash
    sudo pacman -Sy yaourt
```

# Wifi

Install NetworkManager
https://wiki.archlinux.org/index.php/NetworkManager#Installation

```bash
    sudo pacman -S networkmanager network-manager-applet xfce4-notifyd gnome-keyring
```
Maybe you need to restart to work properly.

Enable Network Manager:
```bash
    systemctl enable NetworkManager.service
```

Start Network Manager:
```bash
    systemctl start NetworkManager.service
```

# Troubleshooting

## Fix audio
```bash
    alsactl restore
```

## ENOSPC error

https://stackoverflow.com/questions/22475849/node-js-error-enospc/32600959#32600959

For Arch Linux add this line to /etc/sysctl.d/99-sysctl.conf:

```bash
    sudo fs.inotify.max_user_watches=524288
```

Then execute:

```bash
    sudo sysctl --system
```
