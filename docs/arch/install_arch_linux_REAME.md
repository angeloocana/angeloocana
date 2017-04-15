# Install Arch Linux


# Change keyboard to abnt2
```
loadkeys br-abnt2

setxkbmap -model abnt2 -layout br -variant abnt2
```

# Show particions
```
fdisk -l
```

# Fix audio
```
    alsactl restore
```