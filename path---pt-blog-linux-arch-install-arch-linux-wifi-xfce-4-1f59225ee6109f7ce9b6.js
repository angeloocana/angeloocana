webpackJsonp([0x5f5bda9f4f0c],{"./node_modules/json-loader/index.js!./.cache/json/pt-blog-linux-arch-install-arch-linux-wifi-xfce-4.json":function(a,n){a.exports={data:{markdownRemark:{fileAbsolutePath:"/home/angeloocana/dev/angeloocana/src/pages/blog/linux/arch/install-arch-linux-wifi-xfce4.pt.md",html:'<p>Se você quer aprender linux de verdade, Arch é a minha distribuição favorita, esteja preparado pra quebrar muito a cabeça, mas relaxa que você vai aprender!</p>\n<h2>Boot Arch Linux pela USB usando pendrive</h2>\n<h3>Baixar Arch Linux</h3>\n<p>Baixar o arquivo .iso:\n<a href="https://www.archlinux.org/download/">https://www.archlinux.org/download/</a></p>\n<h3>Baixar Rufus</h3>\n<p>Rufus é um programa pra criar pendrives bootaveis apartir de arquivos .iso\n<a href="https://rufus.akeo.ie/">https://rufus.akeo.ie/</a></p>\n<p>Abra o rufus, seleciona o seu arquivo .iso, selecione o local do pendrive e BURN!</p>\n<p>Agora você esta pronto pra ligar o PC pelo pendrive e seguir as proximas etapas!</p>\n<p>Divirta-se!</p>\n<h2>Trocar layout do teclado para abnt2</h2>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    loadkeys br-abnt2\n</code></pre>\n      </div>\n<h2>Mostrar Partições</h2>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">fdisk</span> -l\n</code></pre>\n      </div>\n<h2>Create Partitions</h2>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">cfdisk</span>\n</code></pre>\n      </div>\n<h2>Format Partitions</h2>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    mkfs.ext4 /dev/sda1\n</code></pre>\n      </div>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    mkfs.ext4 /dev/sda5\n</code></pre>\n      </div>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    mkswap /dev/sda2\n</code></pre>\n      </div>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    swapon /dev/sda2\n</code></pre>\n      </div>\n<h2>Install Arch</h2>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">mount</span> /dev/sda1 /mnt\n</code></pre>\n      </div>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">mkdir</span> /mnt/home\n</code></pre>\n      </div>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">mount</span> /dev/sda5 /mnt/home\n</code></pre>\n      </div>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    pacstrap /mnt base base-devel\n</code></pre>\n      </div>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    genfstab /mnt <span class="token operator">>></span> /mnt/etc/fstab\n</code></pre>\n      </div>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">cat</span> /mnt/etc/fstab\n</code></pre>\n      </div>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    arch-chroot /mnt /bin/bash\n</code></pre>\n      </div>\n<h2>Set password</h2>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">passwd</span>\n</code></pre>\n      </div>\n<h2>Enable internet</h2>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    hostnamectl set-hostname ocana-note\n</code></pre>\n      </div>\n<h2>Enable 32bit packages</h2>\n<p>uncomment multilib line from:</p>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">nano</span> /etc/pacman.conf\n</code></pre>\n      </div>\n<h2>Sincronize  Repos</h2>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    pacman -Sy\n</code></pre>\n      </div>\n<h2>Create User</h2>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">useradd</span> -m -g <span class="token function">users</span> -G wheel,storage,power -s /bin/bash angeloocana\n</code></pre>\n      </div>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">passwd</span> angeloocana\n</code></pre>\n      </div>\n<h1>Install sudo</h1>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    pacman -S <span class="token function">sudo</span>\n</code></pre>\n      </div>\n<p>enable sudo for users, uncomment %wheel ALL=(ALL) ALL</p>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    EDITOR<span class="token operator">=</span>nano visudo\n</code></pre>\n      </div>\n<h2>Grub installation</h2>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    pacman -S grub os-prober\n</code></pre>\n      </div>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    grub-install /dev/sda\n</code></pre>\n      </div>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    grub-mkconfig -o /boot/grub/grub.cfg\n</code></pre>\n      </div>\n<h2>Exit</h2>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token keyword">exit</span>\n</code></pre>\n      </div>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>     <span class="token function">umount</span> /mnt/home\n</code></pre>\n      </div>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">umount</span> /mnt\n</code></pre>\n      </div>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    poweroff\n</code></pre>\n      </div>\n<h2>Install xfce4</h2>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">sudo</span> pacman -Syu\n</code></pre>\n      </div>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">sudo</span> pacman -S xorg xorg-server\n</code></pre>\n      </div>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">sudo</span> pacman -S xfce4 xfce4-goodies\n</code></pre>\n      </div>\n<h2>Change keyboard to abnt2 permanently</h2>\n<p>Go to ‘Applications’ -> ‘Settings’ -> ‘Settings Manager’ -> ‘Session and Startup’ -> ‘Application Autostart’ then click ‘Add’ button and just paste the command in the “Command” field, give a name and here you go.</p>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    setxkbmap -model abnt2 -layout br -variant abnt2\n</code></pre>\n      </div>\n<h2>Datetime</h2>\n<p>To check the current zone defined for the system:</p>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    timedatectl\n</code></pre>\n      </div>\n<p>To list available zones:</p>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    timedatectl list-timezones\n</code></pre>\n      </div>\n<p>To change your time zone:</p>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    timedatectl set-timezone Zone/SubZone   \n</code></pre>\n      </div>\n<p>Synchronize date time, maybe you have to restart to see the changes:</p>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">sudo</span> hwclock --systohc --utc\n</code></pre>\n      </div>\n<h2>Audio</h2>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">sudo</span> pacman -S alsa-utils pulseaudio\n</code></pre>\n      </div>\n<h1>Programs</h1>\n<h2>Vim</h2>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">sudo</span> pacman -S vim\n</code></pre>\n      </div>\n<h2>Yaourt</h2>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">sudo</span> vim /etc/pacman.conf\n</code></pre>\n      </div>\n<p>Add to the botton:</p>\n<div class="gatsby-highlight">\n      <pre class="language-conf"><code>    [archlinuxfr]\n    SigLevel = Never\n    Server = http://repo.archlinux.fr/$arch</code></pre>\n      </div>\n<div class="gatsby-highlight">\n      <pre class="language-bash"><code>    <span class="token function">sudo</span> pacman -Sy yaourt\n</code></pre>\n      </div>\n<h1>Troubleshooting</h1>\n<h2>Fix audio</h2>\n<div class="gatsby-highlight">\n      <pre class="language-none"><code>    alsactl restore</code></pre>\n      </div>\n<h2>Links</h2>\n<ul>\n<li><a href="https://www.ostechnix.com/install-arch-linux-latest-version/">https://www.ostechnix.com/install-arch-linux-latest-version/</a></li>\n</ul>',excerpt:"Se você quer aprender linux de verdade, Arch é a minha distribuição favorita, esteja preparado pra quebrar muito a cabeça, mas relaxa que...",fields:{tagSlugs:[{tag:"Linux",link:"/pt/tags/linux/"},{tag:"Arch",link:"/pt/tags/arch/"}],slug:"/pt/blog/linux/arch/install-arch-linux-wifi-xfce4/",readNextPosts:[{excerpt:"Instalar ZSH https://github.com/robbyrussell/oh-my-zsh/wiki/Installing-ZSH Instalar oh-my-zsh Baixar Instalar Transformar zsh em terminal...",frontmatter:{title:"Instalar ZSH e oh-my-zsh",date:"2017-06-23"},fields:{slug:"/pt/blog/terminal/install-zsh/",langKey:"pt"}},{excerpt:"",frontmatter:{title:"Exemplos Programação Funcional",date:"2017-06-23"},fields:{slug:"/pt/blog/functional-programming/examples/",langKey:"pt"}},{excerpt:"Vim é um editor de texto da velha guarda, ele é executado no console, é o mais rápido de todos.\nÉ a melhor opção para acessar servidores...",frontmatter:{title:"Vim ajuda com comandos",date:"2017-08-08"},fields:{slug:"/pt/blog/vim/vim-help-commands/",langKey:"pt"}}]},frontmatter:{youtubeId:null,title:"Instalar Arch linux + wifi and xfce4",tags:["Linux","Arch"],date:"2017-08-04",structuredData:null}}},pathContext:{path:"/pt/blog/linux/arch/install-arch-linux-wifi-xfce4/",langKey:"pt"}}}});
//# sourceMappingURL=path---pt-blog-linux-arch-install-arch-linux-wifi-xfce-4-1f59225ee6109f7ce9b6.js.map