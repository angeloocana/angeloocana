# Install Arch Linux


# Change keyboard to abnt2

Add the line below to this file **~/.xinitrc** in order to change keyboard layout permanently.
```bash
    setxkbmap -model abnt2 -layout br -variant abnt2
```

or

```bash
    loadkeys br-abnt2
```

# Show particions
```
fdisk -l
```

# Fix audio
```
    alsactl restore
```