# Install Arch Linux

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

## Set password
```bash
    passwd
```
## Enable internet
```bash
    hostnamectl set-hostname ocana-note
```
```bash
    systemctl enable dhcpcd@eth0.service
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

## Change keyboard to abnt2

Add the line below to this file **~/.xinitrc** in order to change keyboard layout permanently.
```bash
    setxkbmap -model abnt2 -layout br -variant abnt2
```

# Troubleshooting

## Fix audio
```
    alsactl restore
```
